import { Edges, Html, Line, OrbitControls, OrthographicCamera, PerspectiveCamera, useTexture } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { defaultCalibration } from '../data/sheets';
import type { Bounds, DimLine, Item, LayerId, MaterialId, Shape, Sheet } from '../data/types';

export type ViewMode = 'top' | 'iso' | 'eye';

export interface ViewportProps {
  sheet: Sheet;
  view: ViewMode;
  layers: Record<LayerId, boolean>;
  underlayVisible: boolean;
  underlayOpacity: number;
  cutHeight: number;
  selectedId: string | null;
  fitTick: number;
  onSelect: (id: string | null) => void;
  onCursor: (x: number, y: number) => void;
  onFit: () => void;
}

/** mm를 장면 단위(m)로 바꾼다. */
const M = 0.001;

const COLORS: Record<MaterialId, string> = {
  wall: '#d7dbe0',
  glass: '#9fd3f0',
  partition: '#cdb891',
  door: '#b08d57',
  ceramic: '#ffffff',
  stone: '#9a9fa6',
  mirror: '#bfe3ea',
  metal: '#6f7680',
  tactile: '#f2c200',
  light: '#ffb300',
};

const LAYER_MATERIAL: Record<LayerId, MaterialId> = {
  wall: 'wall',
  partition: 'partition',
  door: 'door',
  fixture: 'ceramic',
  accessory: 'stone',
  light: 'light',
  dim: 'metal',
};

const noRaycast = () => null;

function sheetBounds(sheet: Sheet): Bounds {
  if (sheet.model) return sheet.model.bounds;
  const cal = sheet.calibration ?? defaultCalibration;
  return {
    x0: -cal.originPx[0] * cal.mmPerPx,
    y0: -cal.originPx[1] * cal.mmPerPx,
    x1: (cal.workSize[0] - cal.originPx[0]) * cal.mmPerPx,
    y1: (cal.workSize[1] - cal.originPx[1]) * cal.mmPerPx,
  };
}

/** 절단 높이(cut)보다 위는 그리지 않는다. */
function ShapeMesh({ shape, cut, children }: { shape: Shape; cut: number; children: ReactNode }) {
  const z1 = Math.min(shape.z1, cut);
  if (z1 <= shape.z0) return null;
  const h = (z1 - shape.z0) * M;
  const y = ((shape.z0 + z1) / 2) * M;
  switch (shape.type) {
    case 'box':
      return (
        <mesh position={[((shape.x0 + shape.x1) / 2) * M, y, ((shape.y0 + shape.y1) / 2) * M]}>
          <boxGeometry args={[(shape.x1 - shape.x0) * M, h, (shape.y1 - shape.y0) * M]} />
          {children}
        </mesh>
      );
    case 'cylinder':
      return (
        <mesh position={[shape.cx * M, y, shape.cy * M]} scale={[shape.rx * M, h, shape.ry * M]}>
          <cylinderGeometry args={[1, 1, 1, 40]} />
          {children}
        </mesh>
      );
    case 'leaf':
      return (
        <group position={[shape.hx * M, y, shape.hy * M]} rotation={[0, -THREE.MathUtils.degToRad(shape.angleDeg), 0]}>
          <mesh position={[(shape.width / 2) * M, 0, 0]}>
            <boxGeometry args={[shape.width * M, h, shape.thickness * M]} />
            {children}
          </mesh>
        </group>
      );
    case 'quarter':
      return (
        <mesh position={[shape.cx * M, y, shape.cy * M]}>
          <cylinderGeometry
            args={[shape.r * M, shape.r * M, h, 24, 1, false, -THREE.MathUtils.degToRad(shape.startDeg), Math.PI / 2]}
          />
          {children}
        </mesh>
      );
  }
}

interface ItemGroupProps {
  item: Item;
  cut: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: (name: string | null) => void;
  onFocus: (point: THREE.Vector3) => void;
}

function ItemGroup({ item, cut, selected, onSelect, onHover, onFocus }: ItemGroupProps) {
  const [hovered, setHovered] = useState(false);
  const materialId = item.material ?? LAYER_MATERIAL[item.layer];
  const isLight = item.layer === 'light';
  const translucent = materialId === 'glass' || materialId === 'mirror';
  const color = selected ? '#ff6b3d' : hovered ? '#ffc56e' : COLORS[materialId];
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(item.name);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onFocus(e.point.clone());
      }}
    >
      {item.shapes.map((shape, i) => (
        <ShapeMesh key={i} shape={shape} cut={isLight ? Infinity : cut}>
          <meshStandardMaterial
            color={color}
            roughness={0.85}
            transparent={translucent}
            opacity={translucent ? 0.55 : 1}
            emissive={isLight ? '#ffb300' : '#000000'}
            emissiveIntensity={isLight ? 0.6 : 0}
          />
          <Edges threshold={20} color={selected ? '#b3300b' : '#59606b'} />
        </ShapeMesh>
      ))}
    </group>
  );
}

function UnderlayImage({ url, width, depth, opacity }: { url: string; width: number; depth: number; opacity: number }) {
  const maxAnisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texture = useTexture(url, (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
    loaded.needsUpdate = true;
  });
  return (
    <mesh position={[0, 0, -0.004]} raycast={noRaycast}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

interface FloorProps {
  sheet: Sheet;
  underlayVisible: boolean;
  underlayOpacity: number;
  onCursor: (x: number, y: number) => void;
  onSelect: (id: string | null) => void;
  onFit: () => void;
}

/** 도면 한 장 크기의 바닥판. 스캔 도면을 mm 좌표에 맞춰 깐다. */
function Floor({ sheet, underlayVisible, underlayOpacity, onCursor, onSelect, onFit }: FloorProps) {
  const cal = sheet.calibration ?? defaultCalibration;
  const width = cal.workSize[0] * cal.mmPerPx * M;
  const depth = cal.workSize[1] * cal.mmPerPx * M;
  const cx = (cal.workSize[0] / 2 - cal.originPx[0]) * cal.mmPerPx * M;
  const cz = (cal.workSize[1] / 2 - cal.originPx[1]) * cal.mmPerPx * M;
  return (
    <group position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh
        position={[0, 0, -0.01]}
        onPointerMove={(e) => onCursor(e.point.x / M, e.point.z / M)}
        onClick={() => onSelect(null)}
        onDoubleClick={onFit}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {underlayVisible && (
        <Suspense fallback={null}>
          <UnderlayImage url={sheet.image} width={width} depth={depth} opacity={underlayOpacity} />
        </Suspense>
      )}
    </group>
  );
}

function DimLines({ lines }: { lines: DimLine[] }) {
  return (
    <>
      {lines.map((line, i) => {
        const a: [number, number, number] = [line.from[0] * M, 0.02, line.from[1] * M];
        const b: [number, number, number] = [line.to[0] * M, 0.02, line.to[1] * M];
        return (
          <group key={i}>
            <Line points={[a, b]} color="#0b63ce" lineWidth={1.5} />
            <Html position={[(a[0] + b[0]) / 2, 0.02, (a[2] + b[2]) / 2]} center className="dim-label" zIndexRange={[5, 0]}>
              {line.label}
            </Html>
          </group>
        );
      })}
    </>
  );
}

interface CameraRigProps {
  sheet: Sheet;
  view: ViewMode;
  fitTick: number;
  focus: { point: THREE.Vector3; tick: number } | null;
}

function CameraRig({ sheet, view, fitTick, focus }: CameraRigProps) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera);
  const get = useThree((s) => s.get);
  const handledFocus = useRef(0);

  // 뷰, 탭, 맞춤 요청이 바뀌면 카메라를 기본 위치로 옮긴다.
  useLayoutEffect(() => {
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
      ctl.target.set(to[0] * M, to[2] * M, to[1] * M);
    } else {
      const r = Math.max(w, d);
      const [dx, dz] = sheet.model?.isoDir ?? [1, 1];
      camera.position.set(cx + dx * r * 0.8, r * 1.0, cz + dz * r * 0.9);
      ctl.target.set(cx, 0.5, cz);
    }
    camera.updateProjectionMatrix();
    ctl.update();
  }, [camera, get, sheet, view, fitTick]);

  // 더블클릭한 지점으로 주시점을 옮긴다. 카메라와의 상대 위치는 유지한다.
  useEffect(() => {
    const ctl = controls.current;
    if (!focus || !ctl || focus.tick === handledFocus.current) return;
    handledFocus.current = focus.tick;
    camera.position.add(focus.point.clone().sub(ctl.target));
    ctl.target.copy(focus.point);
    ctl.update();
  }, [focus, camera]);

  const top = view === 'top';
  return (
    <OrbitControls
      key={view}
      ref={controls}
      makeDefault
      zoomToCursor
      enableDamping={false}
      enableRotate={!top}
      maxPolarAngle={top ? Math.PI : Math.PI / 2 - 0.01}
      mouseButtons={{
        LEFT: top ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

export function Viewport(props: ViewportProps) {
  const { sheet, view, layers, cutHeight, selectedId, onSelect } = props;
  const [focus, setFocus] = useState<{ point: THREE.Vector3; tick: number } | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const model = sheet.model;

  useEffect(() => setHoverName(null), [sheet.id]);

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
      <Canvas flat dpr={[1, 2]} onPointerMissed={() => onSelect(null)}>
        <color attach="background" args={['#e9ecf0']} />
        <ambientLight intensity={1.7} />
        <directionalLight position={[6, 12, 4]} intensity={1.3} />
        <PerspectiveCamera makeDefault={view !== 'top'} fov={45} near={0.05} far={400} />
        <OrthographicCamera makeDefault={view === 'top'} up={[0, 0, -1]} near={0.1} far={400} />
        <CameraRig sheet={sheet} view={view} fitTick={props.fitTick} focus={focus} />
        <Floor
          sheet={sheet}
          underlayVisible={props.underlayVisible}
          underlayOpacity={props.underlayOpacity}
          onCursor={props.onCursor}
          onSelect={onSelect}
          onFit={props.onFit}
        />
        {model?.items
          .filter((item) => layers[item.layer])
          .map((item) => (
            <ItemGroup
              key={`${sheet.id}-${item.id}`}
              item={item}
              cut={cutHeight}
              selected={item.id === selectedId}
              onSelect={onSelect}
              onHover={setHoverName}
              onFocus={(point) => setFocus((prev) => ({ point, tick: (prev?.tick ?? 0) + 1 }))}
            />
          ))}
        {model && layers.dim && <DimLines lines={model.dimLines} />}
        {model?.roomLabels.map((label) => (
          <Html key={label.text} position={[label.at[0] * M, 0.02, label.at[1] * M]} center className="room-label" zIndexRange={[5, 0]}>
            {label.text}
          </Html>
        ))}
      </Canvas>
      <div ref={tooltip} className="tooltip" hidden={!hoverName}>
        {hoverName}
      </div>
    </div>
  );
}
