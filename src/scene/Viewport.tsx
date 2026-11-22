import { Edges, Html, Line, OrbitControls, OrthographicCamera, PerspectiveCamera, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react';
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { defaultCalibration } from '../data/sheets';
import type { Bounds, DimLine, Item, LayerId, Shape, Sheet } from '../data/types';
import { buildGeometry, cutKey, M } from './geometry';
import { DRAW_COLORS, LAYER_MATERIAL, NO_SHADOW, realMaterial, type Highlight } from './materials';
import { setTileOrigin } from './textures';
import { GUIDE_ONLY, PathTracer, TRACE_ONLY, type PathTraceStatus } from './PathTracer';
import { RealStage } from './RealStage';
import { isSoftwareRenderer } from './softwareGl';

export type ViewMode = 'top' | 'iso' | 'eye';
/** plan=도면 모드(스캔 도면 겹침, 검수용), real=실사 모드 */
export type RenderMode = 'plan' | 'real';

/** 화면 이동 요청. dx는 오른쪽, dy는 앞쪽(평면 뷰는 위쪽)이 +다. 단위는 걸음이다. */
export interface PanRequest {
  dx: number;
  dy: number;
  fast: boolean;
  tick: number;
}

export interface ViewportProps {
  sheet: Sheet;
  view: ViewMode;
  mode: RenderMode;
  layers: Record<LayerId, boolean>;
  /** 상식 보완 품목(도면에 없는 것)을 그릴지 여부 */
  showAdded: boolean;
  underlayVisible: boolean;
  underlayOpacity: number;
  cutHeight: number;
  selectedId: string | null;
  fitTick: number;
  pan: PanRequest | null;
  /** 고품질 렌더(경로 추적)를 켠다. 실사 모드에서만 쓴다. */
  pathTrace: boolean;
  onPathTrace: (status: PathTraceStatus) => void;
  /** 시점이나 화면 크기가 실제로 바뀌었다. 고품질 렌더 중이면 끝내게 한다. 드래그하는 동안 매 프레임 불린다. */
  onInterrupt: () => void;
  /** 마우스로 시점을 움직이는 중인지 알린다. */
  onDrag: (active: boolean) => void;
  onSelect: (id: string | null) => void;
  onCursor: (x: number, y: number) => void;
  onFit: () => void;
  /** 화면 이동 요청. 눈높이 뷰의 휠이 화살표 키와 같은 이동을 요청한다. */
  onMove: (dx: number, dy: number, fast: boolean) => void;
  /** 장면 전환 번호. 바뀌면 새 장면의 첫 화면을 기다린다. */
  sceneTick: number;
  /** 장면 전환 번호 sceneTick의 첫 화면을 그렸다. 도면 모드에서 바닥 도면을 보이는 설정이면 스캔 도면까지 그린 뒤다. */
  onReady: (tick: number) => void;
  /** 소프트웨어 렌더링(브라우저의 그래픽 가속 꺼짐)으로 판별했다. */
  onSoftwareGl: () => void;
}

/** 화살표 키 한 번에 움직이는 거리(m). Shift를 누르면 FAST_STEP이다. */
const PAN_STEP = 0.25;
const FAST_STEP = 1;
/** 눈높이 뷰의 주시점은 카메라의 이만큼(m) 앞에 둔다. 조작기가 이 점을 축으로 돌면 카메라는 제자리에서 고개를 돌린다. */
const EYE_LEAD = 0.01;
/**
 * 눈높이 뷰의 드래그 감도. 조작기는 화면 높이만큼 끌면 360° × 이 값만큼 돌린다. 크기는 세로 시야각(45°)에 맞춘다.
 * 음수다. 화면을 잡고 끄는 방향(오른쪽으로 끌면 그림이 오른쪽으로 따라온다)이 되는 부호를 끌기 실험으로 정했다.
 */
const EYE_ROTATE_SPEED = -45 / 360;
/** 눈높이 뷰의 더블클릭. 찍은 점이 이 높이(m) 이하면 바닥으로 보고 그 점 위에 선다. 높으면 그 점의 EYE_STOP(m) 앞에서 멈춘다. */
const FLOOR_PICK = 0.1;
const EYE_STOP = 1;
/** 눈높이 뷰의 휠. 트랙패드는 작은 값을 여러 번 보낸다. 누적해서 이만큼(px)마다 한 걸음을 뗀다. 마우스 휠 한 칸이 100px다. */
const WHEEL_STEP = 100;
/** 줄 단위 휠(deltaMode 1)의 줄 하나를 픽셀로 바꾼 값. Windows 기본값(한 칸 = 3줄)에서 한 칸이 한 걸음이 된다. */
const WHEEL_LINE = WHEEL_STEP / 3;

const noRaycast = () => null;

/**
 * 거울 반사면의 셰이더. 반사 화면에 거울 색을 곱한다.
 * three.js 기본 셰이더의 오버레이 합성은 0~1 범위를 가정해서, 1보다 밝은 곳(HDR)에 주황색 얼룩이 생긴다.
 */
const MIRROR_SHADER = {
  name: 'MirrorShader',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null } },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    varying vec4 vUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      gl_FragColor = vec4( texture2DProj( tDiffuse, vUv ).rgb * color, 1.0 );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

/** 거울 반사면 하나가 장면을 그리는 동안 true다. 그 사이 다른 거울은 지난 화면을 그대로 쓴다. 거울끼리 서로를 거듭 그리지 않게 한다. */
let reflecting = false;

function sheetBounds(sheet: Sheet): Bounds {
  if (sheet.model) return sheet.model.bounds;
  const cal = sheet.calibration ?? defaultCalibration;
  return {
    x0: -cal.originPx[0] * cal.mmPerPx,
    y0: -cal.originPx[1] * (cal.mmPerPxY ?? cal.mmPerPx),
    x1: (cal.workSize[0] - cal.originPx[0]) * cal.mmPerPx,
    y1: (cal.workSize[1] - cal.originPx[1]) * (cal.mmPerPxY ?? cal.mmPerPx),
  };
}

interface ShapeMeshProps {
  shape: Shape;
  item: Item;
  cut: number;
  real: boolean;
  highlight: Highlight;
}

function ShapeMesh({ shape, item, cut, real, highlight }: ShapeMeshProps) {
  const key = cutKey(shape, cut);
  const geometry = useMemo(() => buildGeometry(shape, key), [shape, key]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  const materialId = shape.material ?? item.material ?? LAYER_MATERIAL[item.layer];
  if (real) {
    const shadow = !NO_SHADOW.has(materialId);
    // 두 모드의 메시에 다른 key를 준다. 같은 메시를 다시 쓰면 material 속성이 빠지면서 기본 재질(흰색)로 돌아간다.
    return <mesh key="real" geometry={geometry} material={realMaterial(materialId, highlight, item.tileOrigin)} castShadow={shadow} receiveShadow={shadow} />;
  }
  const isLight = item.layer === 'light';
  const translucent = materialId === 'glass' || materialId === 'mirror';
  const color = highlight === 'selected' ? '#ff6b3d' : highlight === 'hover' ? '#ffc56e' : DRAW_COLORS[materialId];
  // 도면 모드에는 바닥이 없고 스캔 도면이 높이 0에 깔린다. 바닥 아래에 있는 도형(구배 바닥의 배수구)은 도면 위로 올려서 그린다.
  const lift = 'z1' in shape && shape.z1 <= 0 ? (6 - shape.z1) * M : 0;
  return (
    <mesh key="plan" geometry={geometry} position-y={lift}>
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        transparent={translucent}
        opacity={translucent ? 0.55 : 1}
        emissive={isLight ? '#ffb300' : '#000000'}
        emissiveIntensity={isLight ? 0.6 : 0}
      />
      <Edges threshold={20} color={highlight === 'selected' ? '#b3300b' : '#59606b'} />
    </mesh>
  );
}

/**
 * 실사 모드의 거울 반사면. 거울 상자마다 평면 1장이 장면을 한 번 더 그려서 비춘다.
 * 반사면을 쓸 때는 거울 상자를 그리지 않는다. 상자가 반사면 바로 뒤에 있어서 반사 화면에 상자 뒷면이 찍힌다.
 */
function MirrorSurface({ item, cut }: { item: Item; cut: number }) {
  const boxes = useMemo(() => item.shapes.filter((s) => s.type === 'box'), [item]);
  const facing = item.facing;
  if (!facing) return null;
  return (
    <>
      {boxes.map((box, i) => (
        <MirrorPane key={i} box={box} facing={facing} cut={cut} />
      ))}
    </>
  );
}

function MirrorPane({ box, facing, cut }: { box: Extract<Shape, { type: 'box' }>; facing: [number, number]; cut: number }) {
  // 거울이 잘리지 않는 절단 높이에서는 반사면을 다시 만들지 않는다.
  const key = cut >= box.z1 ? Infinity : cut;
  const reflector = useMemo(() => {
    const { x0, x1, y0, y1, z0 } = box;
    const z1 = Math.min(box.z1, key);
    if (z1 <= z0) return null;
    const alongX = facing[0] === 0;
    const width = (alongX ? x1 - x0 : y1 - y0) * M;
    const mirror = new Reflector(new THREE.PlaneGeometry(width, (z1 - z0) * M), { textureWidth: 1024, textureHeight: 1024, color: 0xe4e9e8, shader: MIRROR_SHADER });
    // 거울 앞면에서 1mm 띄운다.
    const px = alongX ? (x0 + x1) / 2 : facing[0] > 0 ? x1 + 1 : x0 - 1;
    const py = alongX ? (facing[1] > 0 ? y1 + 1 : y0 - 1) : (y0 + y1) / 2;
    mirror.position.set(px * M, ((z0 + z1) / 2) * M, py * M);
    mirror.rotation.y = Math.atan2(facing[0], facing[1]);
    const render = mirror.onBeforeRender;
    mirror.onBeforeRender = function (...args) {
      if (reflecting) return;
      reflecting = true;
      try {
        render.apply(this, args);
      } finally {
        reflecting = false;
      }
    };
    return mirror;
  }, [box, facing, key]);
  useEffect(
    () => () => {
      reflector?.geometry.dispose();
      reflector?.dispose();
    },
    [reflector],
  );
  return reflector ? <primitive object={reflector} /> : null;
}

interface ItemGroupProps {
  item: Item;
  cut: number;
  real: boolean;
  /** 고품질 렌더 중이다. 거울 반사면을 숨기고(거울 재질이 직접 반사한다) 강조색을 뺀다(강조색은 빛을 내는 재질이라 렌더에 섞인다). */
  tracing: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: (name: string | null) => void;
  onFocus: (point: THREE.Vector3) => void;
}

function ItemGroup({ item, cut, real, tracing, selected, onSelect, onHover, onFocus }: ItemGroupProps) {
  const [hovered, setHovered] = useState(false);
  // 마감(바닥·벽·천장)은 넓어서 마우스를 올려도 강조하지 않는다. 클릭하면 선택된다.
  const quiet = item.layer === 'finish';
  // 도면 모드의 조명 표시는 절단 높이와 관계없이 천장면에 그린다.
  const itemCut = !real && item.layer === 'light' ? Infinity : cut;
  const highlight: Highlight = tracing ? 'none' : selected ? 'selected' : hovered ? 'hover' : 'none';
  const mirrored = real && item.facing !== undefined;
  const shapes = item.shapes.map((shape, i) => <ShapeMesh key={i} shape={shape} item={item} cut={itemCut} real={real} highlight={highlight} />);
  return (
    <group
      onPointerOver={(e) => {
        if (quiet) return;
        e.stopPropagation();
        setHovered(true);
        onHover(item.name);
      }}
      onPointerOut={() => {
        if (quiet) return;
        setHovered(false);
        onHover(null);
      }}
      onClick={(e) => {
        // 전파는 여기서 끊는다. 끊지 않으면 뒤의 바닥판이 받아서 선택을 푼다.
        e.stopPropagation();
        // 끌다가 뗀 것은 선택하지 않는다. delta는 누른 점과 뗀 점의 화면 거리(px)다. 2px 기준은 R3F의 onPointerMissed와 같다.
        if (e.delta <= 2) onSelect(item.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFocus(e.point.clone());
      }}
    >
      {mirrored ? (
        <>
          {/* 고품질 렌더 중에는 반사면을 숨긴 채로 남긴다. 노이즈 제거 필터의 길잡이 화면을 그릴 때만 켠다(PathTracer). */}
          <group name={GUIDE_ONLY} visible={!tracing}>
            <MirrorSurface item={item} cut={itemCut} />
          </group>
          {tracing && <group name={TRACE_ONLY}>{shapes}</group>}
        </>
      ) : (
        shapes
      )}
    </group>
  );
}

interface UnderlayImageProps {
  url: string;
  width: number;
  depth: number;
  opacity: number;
  /** 스캔 도면 이미지를 받아서 장면에 올렸다. */
  onLoad: (url: string) => void;
}

function UnderlayImage({ url, width, depth, opacity, onLoad }: UnderlayImageProps) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texture = useTexture(url, (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
    loaded.needsUpdate = true;
  });
  // 이미지를 받기 전에는 Suspense가 이 컴포넌트를 올리지 않는다. 한 번 받은 이미지는 바로 올라온다.
  useEffect(() => onLoad(url), [onLoad, url]);
  return (
    <mesh position={[0, 0, -0.004]} raycast={noRaycast}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

interface FloorProps {
  sheet: Sheet;
  real: boolean;
  underlayVisible: boolean;
  underlayOpacity: number;
  onCursor: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onDoubleClick: (point: THREE.Vector3) => void;
  onImageLoad: (url: string) => void;
}

/** 도면 한 장 크기의 바닥판. 도면 모드는 스캔 도면을 mm 좌표에 맞춰 깐다. 실사 모드는 실 바깥의 바닥이 된다. */
function Floor({ sheet, real, underlayVisible, underlayOpacity, onCursor, onSelect, onDoubleClick, onImageLoad }: FloorProps) {
  const cal = sheet.calibration ?? defaultCalibration;
  const width = cal.workSize[0] * cal.mmPerPx * M;
  const mmPerPxY = cal.mmPerPxY ?? cal.mmPerPx;
  const depth = cal.workSize[1] * mmPerPxY * M;
  const cx = (cal.workSize[0] / 2 - cal.originPx[0]) * cal.mmPerPx * M;
  const cz = (cal.workSize[1] / 2 - cal.originPx[1]) * mmPerPxY * M;
  const handlers = {
    onPointerMove: (e: { point: THREE.Vector3 }) => onCursor(e.point.x / M, e.point.z / M),
    // 끌다가 뗀 것은 선택을 풀지 않는다(품목의 onClick과 같다).
    onClick: (e: { delta: number }) => {
      if (e.delta <= 2) onSelect(null);
    },
    onDoubleClick: (e: { point: THREE.Vector3 }) => onDoubleClick(e.point.clone()),
  };
  if (real) {
    // 실 바깥(복도)의 마감은 도면에 없다. 중립 회색 바닥으로 둔다. 실 안의 바닥 마감보다 30mm 아래다.
    return (
      <mesh position={[cx, -0.03, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow {...handlers}>
        <planeGeometry args={[width * 2, depth * 2]} />
        <meshStandardMaterial color="#aeaaa3" roughness={0.95} />
      </mesh>
    );
  }
  return (
    <group position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -0.01]} {...handlers}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {underlayVisible && (
        <Suspense fallback={null}>
          <UnderlayImage url={sheet.image} width={width} depth={depth} opacity={underlayOpacity} onLoad={onImageLoad} />
        </Suspense>
      )}
    </group>
  );
}

function DimLines({ lines, portal }: { lines: DimLine[]; portal: RefObject<HTMLElement> }) {
  return (
    <>
      {lines.map((line, i) => {
        const a: [number, number, number] = [line.from[0] * M, 0.02, line.from[1] * M];
        const b: [number, number, number] = [line.to[0] * M, 0.02, line.to[1] * M];
        return (
          <group key={i}>
            <Line points={[a, b]} color="#0b63ce" lineWidth={1.5} />
            <Html portal={portal} position={[(a[0] + b[0]) / 2, 0.02, (a[2] + b[2]) / 2]} center className="dim-label" zIndexRange={[5, 0]}>
              {line.label}
            </Html>
          </group>
        );
      })}
    </>
  );
}

/**
 * 도면 모드는 톤 매핑을 쓰지 않는다.
 * 실사 모드의 후처리는 꺼질 때 톤 매핑을 켜진 값으로 되돌려 놓는다. 그 뒤에 다시 끈다.
 */
function FlatTone() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
  }, [gl]);
  return null;
}

/**
 * 장면 전환 뒤의 첫 화면을 알린다. 전환마다 새로 올린다(key).
 * useFrame은 그리기 전에 불린다. 두 번째로 불릴 때 첫 화면이 그려져 있다.
 * 실사 모드는 화면이 바뀔 때만 그리므로 올라올 때와 첫 프레임에서 한 번씩 다시 그리게 한다.
 */
function FrameWatch({ tick, onReady }: { tick: number; onReady: (tick: number) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const frames = useRef(0);
  useEffect(() => invalidate(), [invalidate]);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 1) invalidate();
    else if (frames.current === 2) onReady(tick);
  });
  return null;
}

interface CameraRigProps {
  sheet: Sheet;
  view: ViewMode;
  fitTick: number;
  focus: { point: THREE.Vector3; tick: number } | null;
  pan: PanRequest | null;
  onInterrupt: () => void;
  onDrag: (active: boolean) => void;
  /** 카메라가 천장보다 높이 있는지 알린다. 바뀔 때만 부른다. */
  onAbove: (above: boolean) => void;
  onMove: (dx: number, dy: number, fast: boolean) => void;
}

function CameraRig({ sheet, view, fitTick, focus, pan, onInterrupt, onDrag, onAbove, onMove }: CameraRigProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  const invalidate = useThree((s) => s.invalidate);

  // 검사 도구가 카메라를 읽는 훅(window.__cam). 개발 모드에서만 둔다. 빌드 결과물에는 들어가지 않는다.
  useEffect(() => {
    if (import.meta.env.DEV) {
      const target = window as Window & { __cam?: () => unknown };
      target.__cam = () => {
        camera.updateMatrixWorld();
        const direction = camera.getWorldDirection(new THREE.Vector3());
        return {
          view,
          position: camera.position.toArray(),
          direction: direction.toArray(),
          pitchDeg: THREE.MathUtils.radToDeg(Math.asin(direction.y)),
          target: controls.current?.target.toArray() ?? null,
        };
      };
      return () => {
        delete target.__cam;
      };
    }
  }, [camera, view]);
  const handledFocus = useRef(0);
  const handledPan = useRef(pan?.tick ?? 0);

  // 카메라가 천장을 넘나드는 것을 본다. 넘어가면 Viewport가 천장을 숨기거나 다시 그린다.
  const ceilingY = (sheet.model?.ceilingHeight ?? 0) * M;
  const wasAbove = useRef<boolean | null>(null);
  useFrame(({ camera: current }) => {
    const above = current.position.y > ceilingY;
    if (above === wasAbove.current) return;
    wasAbove.current = above;
    onAbove(above);
  });

  // 캔버스 크기가 바뀌면 그리던 고품질 렌더는 못 쓴다(완료 화면은 지워지고, 진행 중인 화면은 비율이 어긋난다). 끝내고 다시 시작하게 한다.
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const sized = useRef(false);
  useEffect(() => {
    if (sized.current) onInterrupt();
    sized.current = true;
  }, [width, height, dpr, onInterrupt]);

  // 눈높이 뷰의 카메라 높이(m). 아래 onChange가 읽는다.
  // 탭을 바꾼 commit의 ctl.update()는 직전 렌더의 onChange를 부른다(drei는 리스너를 useEffect에서 다시 단다). 그래서 렌더 값 대신 ref를 쓰고, 카메라를 놓기 전에 갱신한다.
  const eyeY = useRef<number | null>(null);

  // 뷰, 탭, 맞춤 요청이 바뀌면 카메라를 기본 위치로 옮긴다.
  useLayoutEffect(() => {
    eyeY.current = view === 'eye' && sheet.model ? sheet.model.eye.from[2] * M : null;
    const ctl = controls.current;
    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
    if (!ctl || isOrtho !== (view === 'top')) return;
    const b = sheetBounds(sheet);
    const cx = ((b.x0 + b.x1) / 2) * M;
    const cz = ((b.y0 + b.y1) / 2) * M;
    const w = (b.x1 - b.x0) * M;
    const d = (b.y1 - b.y0) * M;
    if (view === 'top') {
      const { size } = get();
      camera.position.set(cx, 60, cz);
      camera.zoom = Math.min(size.width / (w * 1.3), size.height / (d * 1.3));
      ctl.target.set(cx, 0, cz);
    } else if (view === 'eye' && sheet.model) {
      const { from, to } = sheet.model.eye;
      camera.position.set(from[0] * M, from[2] * M, from[1] * M);
      const ahead = new THREE.Vector3(to[0] * M, to[2] * M, to[1] * M).sub(camera.position).normalize();
      ctl.target.copy(camera.position).addScaledVector(ahead, EYE_LEAD);
    } else {
      const r = Math.max(w, d);
      const [dx, dz] = sheet.model?.isoDir ?? [1, 1];
      camera.position.set(cx + dx * r * 0.8, r * 1.0, cz + dz * r * 0.9);
      ctl.target.set(cx, 0.5, cz);
    }
    camera.updateProjectionMatrix();
    ctl.update();
    invalidate();
  }, [camera, get, invalidate, sheet, view, fitTick]);

  // 더블클릭한 지점으로 주시점을 옮긴다. 카메라와의 상대 위치는 유지한다.
  // 눈높이 뷰는 그 지점으로 걸어간다. 높이와 보는 방향은 유지한다.
  useEffect(() => {
    const ctl = controls.current;
    if (!focus || !ctl || focus.tick === handledFocus.current) return;
    handledFocus.current = focus.tick;
    if (view === 'eye') {
      const way = new THREE.Vector3(focus.point.x - camera.position.x, 0, focus.point.z - camera.position.z);
      // 높은 곳(품목)은 그 점의 EYE_STOP 앞에서 멈춘다. 이미 그보다 가까우면 움직이지 않는다(뒤로 걷지 않는다).
      if (focus.point.y > FLOOR_PICK) way.setLength(Math.max(way.length() - EYE_STOP, 0));
      camera.position.add(way);
      ctl.target.add(way);
    } else {
      camera.position.add(focus.point.clone().sub(ctl.target));
      ctl.target.copy(focus.point);
    }
    ctl.update();
    invalidate();
  }, [focus, view, camera, invalidate]);

  // 눈높이 뷰의 휠은 확대 대신 앞뒤로 걷는다. 한 칸이 화살표 키 한 번이다.
  useEffect(() => {
    if (view !== 'eye') return;
    const canvas = gl.domElement;
    let pending = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * WHEEL_LINE : e.deltaY;
      if (dy === 0) return;
      // 방향이 바뀌면 모아 둔 값을 버린다.
      if (Math.sign(dy) !== Math.sign(pending)) pending = 0;
      pending += dy;
      const steps = Math.trunc(pending / WHEEL_STEP);
      if (steps === 0) return;
      pending -= steps * WHEEL_STEP;
      onMove(0, -steps, false);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [view, gl, onMove]);

  // 화살표 키와 이동 버튼. 카메라와 주시점을 함께 옮긴다. 높이는 바꾸지 않는다.
  useEffect(() => {
    const ctl = controls.current;
    if (!pan || !ctl || pan.tick === handledPan.current) return;
    handledPan.current = pan.tick;
    const forward = new THREE.Vector3(0, 0, -1);
    if (view !== 'top') {
      camera.getWorldDirection(forward);
      forward.y = 0;
      // 바로 아래를 볼 때는 화면 위쪽을 앞으로 삼는다.
      if (forward.lengthSq() < 1e-6) forward.set(0, 1, 0).applyQuaternion(camera.quaternion).setY(0);
      forward.normalize();
    }
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
    const step = pan.fast ? FAST_STEP : PAN_STEP;
    const delta = right.multiplyScalar(pan.dx * step).addScaledVector(forward, pan.dy * step);
    camera.position.add(delta);
    ctl.target.add(delta);
    ctl.update();
    invalidate();
  }, [pan, view, camera, invalidate]);

  const top = view === 'top';
  // 눈높이 뷰는 제자리에서 고개를 돌린다. 주시점이 카메라의 EYE_LEAD 앞에 있다. 확대와 이동은 끈다.
  const eye = view === 'eye';
  return (
    <OrbitControls
      key={view}
      ref={controls}
      makeDefault
      zoomToCursor
      onChange={() => {
        // 눈높이 뷰의 조작기는 카메라를 주시점 둘레의 작은 구면 위로 돌린다. 카메라와 주시점을 같이 옮겨서 눈높이를 그대로 둔다.
        const ctl = controls.current;
        if (eyeY.current !== null && ctl) {
          const dy = eyeY.current - camera.position.y;
          camera.position.y += dy;
          ctl.target.y += dy;
        }
        // 시점이 실제로 움직였을 때만 고품질 렌더를 끝낸다. 누르기만 한 클릭은 렌더를 버리지 않는다.
        onInterrupt();
      }}
      onStart={() => onDrag(true)}
      onEnd={() => onDrag(false)}
      enableDamping={false}
      enableRotate={!top}
      enableZoom={!eye}
      enablePan={!eye}
      rotateSpeed={eye ? EYE_ROTATE_SPEED : 1}
      // 극각은 「카메라 − 주시점」의 각이다. 눈높이 뷰에서 30°는 아래 60°, 150°는 위 60°를 보는 각이다.
      minPolarAngle={eye ? Math.PI / 6 : 0}
      maxPolarAngle={top ? Math.PI : eye ? (Math.PI * 5) / 6 : Math.PI / 2 - 0.01}
      mouseButtons={{
        LEFT: top ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        // 눈높이 뷰는 오른쪽 버튼을 확대(꺼짐)에 둔다. 이동에 두면 Shift·Ctrl과 함께 누를 때 회전이 된다.
        RIGHT: eye ? THREE.MOUSE.DOLLY : THREE.MOUSE.PAN,
      }}
    />
  );
}

export function Viewport(props: ViewportProps) {
  const { sheet, view, layers, cutHeight, selectedId, onSelect } = props;
  const [focus, setFocus] = useState<{ point: THREE.Vector3; tick: number } | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  /** 마지막으로 장면에 올린 스캔 도면 이미지의 주소 */
  const [loadedImage, setLoadedImage] = useState<string | null>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  // 치수와 실명 라벨(drei Html)을 붙이는 곳이다. 한 곳으로 고정한다.
  // 고정하지 않으면 캔버스 초기화 중에 붙이는 곳이 한 번 바뀐다. 그때 라벨을 떼었다 다시 붙이면서 removeChild 오류가 난다.
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const portal = useMemo<RefObject<HTMLElement> | null>(() => (overlay ? { current: overlay } : null), [overlay]);
  const model = sheet.model;
  // 천장은 실내에서 볼 때만 그린다(보헤님 지시, 2026-11-21). 천장에 조명 기구와 환기구가 달려 있어서 실내에서는 천장이 필요하다.
  // 카메라가 천장보다 높이 있으면 그리지 않는다. 위에서 실내를 들여다볼 수 있게 한다.
  // 절단 높이가 천장고보다 낮으면 그 높이에서 자른다. 천장고 위에 있는 도형은 천장 마감뿐이다.
  const [above, setAbove] = useState(true);
  const full = model !== undefined && cutHeight >= model.ceilingHeight;
  const cut = full && !above ? Infinity : cutHeight;
  const real = props.mode === 'real' && model !== undefined;
  const tracing = real && props.pathTrace;

  useEffect(() => setHoverName(null), [sheet.id]);

  // 바닥 타일의 줄눈 시작점은 탭마다 다르다. 그리기 전에 이 탭의 값으로 맞춘다.
  useLayoutEffect(() => {
    if (!real) return;
    setTileOrigin('floorTile', model.tileOrigin?.floorTile);
    setTileOrigin('smallTile', model.tileOrigin?.smallTile);
  }, [real, model]);

  // 마감(바닥·벽·천장)은 실사 모드에서만 그린다. 도면 모드에서는 스캔 도면이 바닥이다.
  const items = useMemo(
    () => (model?.items ?? []).filter((item) => layers[item.layer] && (props.showAdded || !item.added) && (real || item.layer !== 'finish')),
    [model, layers, props.showAdded, real],
  );

  const focusAt = (point: THREE.Vector3) => {
    props.onInterrupt();
    setFocus((prev) => ({ point, tick: (prev?.tick ?? 0) + 1 }));
  };
  // 도면 모드에서 바닥 도면을 보이는 설정이면 스캔 도면이 뜬 뒤에 첫 화면을 센다.
  const imageReady = real || !props.underlayVisible || loadedImage === sheet.image;

  return (
    <div
      className="viewport"
      onMouseMove={(e) => {
        const el = tooltip.current;
        if (!el) return;
        const rect = e.currentTarget.getBoundingClientRect();
        el.style.left = `${e.clientX - rect.left + 14}px`;
        el.style.top = `${e.clientY - rect.top + 14}px`;
      }}
    >
      {/* 실사 모드는 화면이 바뀔 때만 다시 그린다. 광원, 그림자, 거울 반사가 무겁다. */}
      <Canvas
        flat={!real}
        shadows={real}
        frameloop={real ? 'demand' : 'always'}
        dpr={[1, 2]}
        onPointerMissed={() => onSelect(null)}
        onCreated={({ gl }) => {
          // 그래픽 장치 이름을 읽는다. 확장이 없으면 판별하지 않는다.
          const context = gl.getContext();
          const info = context.getExtension('WEBGL_debug_renderer_info');
          if (info && isSoftwareRenderer(String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)))) props.onSoftwareGl();
        }}
      >
        {real && model ? (
          <RealStage model={model} items={items} postprocessing={!tracing} />
        ) : (
          <>
            <FlatTone />
            {/* styles.css의 --bg-main과 같은 값 */}
            <color attach="background" args={['#272727']} />
            <ambientLight intensity={1.7} />
            <directionalLight position={[6, 12, 4]} intensity={1.3} />
          </>
        )}
        <PerspectiveCamera makeDefault={view !== 'top'} fov={45} near={0.05} far={400} />
        <OrthographicCamera makeDefault={view === 'top'} up={[0, 0, -1]} near={0.1} far={400} />
        <CameraRig
          sheet={sheet}
          view={view}
          fitTick={props.fitTick}
          focus={focus}
          pan={props.pan}
          onInterrupt={props.onInterrupt}
          onDrag={props.onDrag}
          onAbove={setAbove}
          onMove={props.onMove}
        />
        <Floor
          sheet={sheet}
          real={real}
          underlayVisible={props.underlayVisible}
          underlayOpacity={props.underlayOpacity}
          onCursor={props.onCursor}
          onSelect={onSelect}
          // 바닥판의 더블클릭은 맞춤이다. 눈높이 뷰에서는 그 지점으로 걸어간다.
          onDoubleClick={(point) => (view === 'eye' ? focusAt(point) : props.onFit())}
          onImageLoad={setLoadedImage}
        />
        {imageReady && <FrameWatch key={props.sceneTick} tick={props.sceneTick} onReady={props.onReady} />}
        {items.map((item) => (
          <ItemGroup
            key={`${sheet.id}-${item.id}`}
            item={item}
            cut={cut}
            real={real}
            tracing={tracing}
            selected={item.id === selectedId}
            onSelect={onSelect}
            onHover={setHoverName}
            onFocus={focusAt}
          />
        ))}
        {model && !real && layers.dim && portal && <DimLines lines={model.dimLines} portal={portal} />}
        {!real &&
          portal &&
          model?.roomLabels.map((label) => (
            <Html key={label.text} portal={portal} position={[label.at[0] * M, 0.02, label.at[1] * M]} center className="room-label" zIndexRange={[5, 0]}>
              {label.text}
            </Html>
          ))}
        {tracing && <PathTracer onStatus={props.onPathTrace} />}
      </Canvas>
      {/* 라벨 층. 3D 화면 밖으로 나간 라벨을 자른다. 툴팁은 이 층 밖에 두어서 화면 가장자리에서도 잘리지 않게 한다. */}
      <div ref={setOverlay} className="labels" />
      <div ref={tooltip} className="tooltip" hidden={!hoverName}>
        {hoverName}
      </div>
    </div>
  );
}
