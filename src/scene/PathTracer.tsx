// 고품질 렌더. 현재 시점을 경로 추적(path tracing)으로 다듬은 정지 화면을 만든다.
// 스위치가 켜져 있으면 App이 화면이 멈춘 뒤에 이 컴포넌트를 올린다. 시점이나 화면 구성이 바뀌면 내리고 다시 올린다.
// three-gpu-pathtracer 의 WebGLPathTracer 를 쓴다. 0.0.28에서 지원 중단이 예고됐다. 대체품(WebGPUPathTracer)은 WebGPU가 필요하다.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GradientEquirectTexture, WebGLPathTracer } from 'three-gpu-pathtracer';

export interface PathTraceStatus {
  /** preparing=장면 준비, compiling=셰이더 준비(표본 0), rendering=표본을 모으는 중 */
  state: 'preparing' | 'compiling' | 'rendering' | 'done' | 'error';
  samples: number;
  target: number;
  seconds: number;
  message?: string;
}

// 품질 값(표본 수, 해상도, 반사 횟수)은 일반 사양 PC를 기준으로 잡았다(보헤님 지시, 2026-11-21).
// 내장 그래픽에서는 오래 걸린다. 멈추지 않게 타일 크기만 속도에 맞춘다. 사용자는 언제든 스위치를 끌 수 있다.
/** 모으는 표본 수. 많을수록 얼룩(노이즈)이 줄고 오래 걸린다. */
const TARGET_SAMPLES = 400;
/** 경로 추적 화면의 긴 변 픽셀 수 상한 */
const MAX_SIDE = 1920;
/**
 * 처음에 화면을 나누는 타일 수(가로, 세로). 한 번에 타일 1장만 그린다.
 * 타일이 크면 느린 그래픽 장치에서 그리기 1번이 2초를 넘는다. 그러면 Windows가 그래픽 장치를 재시작해서 WebGL 컨텍스트가 사라진다.
 * 가장 잘게 나눈 상태로 시작하고, 표본 1개를 마칠 때마다 걸린 시간을 보고 타일을 키운다(타일 수를 반씩 줄인다).
 */
const START_TILES = 16;
/** 타일 1장을 그리는 시간의 목표 상한(ms) */
const TILE_BUDGET_MS = 250;

/**
 * 렌더러마다 경로 추적기를 1개만 만들어 다시 쓴다.
 * WebGLPathTracer.dispose() 는 질감 배열과 BVH 질감을 해제하지 않는다. 열 때마다 새로 만들면 GPU 메모리가 샌다.
 */
const tracers = new WeakMap<THREE.WebGLRenderer, WebGLPathTracer>();

export function PathTracer({ onStatus }: { onStatus: (status: PathTraceStatus) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const tracer = useRef<WebGLPathTracer | null>(null);
  const started = useRef(0);
  const reportedAt = useRef(0);
  /** 직전 타일의 완료 표지. GPU가 그 타일을 다 그렸는지 묻는 데 쓴다. */
  const fence = useRef<WebGLSync | null>(null);
  const issuedAt = useRef(0);
  /** 이번 표본에서 가장 오래 걸린 타일의 시간(ms) */
  const slowest = useRef(0);
  const tunedAt = useRef(0);
  const finished = useRef(false);

  useEffect(() => {
    const previousToneMapping = gl.toneMapping;
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    let pathTracer: WebGLPathTracer | null = null;
    let sky: GradientEquirectTexture | null = null;
    const fail = (message: string) => {
      tracer.current = null;
      // 컨텍스트가 사라지면 경로 추적기의 GPU 자원도 사라진다. 다음에는 새로 만든다.
      tracers.delete(gl);
      onStatus({ state: 'error', samples: 0, target: TARGET_SAMPLES, seconds: (performance.now() - started.current) / 1000, message });
    };
    const onContextLost = () => fail('그래픽 장치가 렌더를 중단했다(WebGL 컨텍스트 손실). 닫은 뒤 화면을 다시 불러온다.');
    gl.domElement.addEventListener('webglcontextlost', onContextLost);
    started.current = performance.now();
    onStatus({ state: 'preparing', samples: 0, target: TARGET_SAMPLES, seconds: 0 });
    // 준비 중 표시가 먼저 화면에 나오도록 한 박자 늦춰 시작한다. 장면 준비가 화면을 잠깐 멈춘다.
    const timer = window.setTimeout(() => {
      try {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        // 실사 모드의 환경맵은 큐브 질감이다. 경로 추적기(0.0.28)의 큐브 변환기는 three 0.187에서 사라진 셰이더 조각을 불러서 실패한다.
        // 경로 추적 중에만 하늘빛 그라데이션 환경으로 바꾼다. 창과 열린 문으로 들어오는 빛이 된다.
        sky = new GradientEquirectTexture();
        sky.topColor.set('#dfeaff');
        sky.bottomColor.set('#b9b4ac');
        sky.update();
        scene.environment = sky;
        scene.environmentIntensity = 1.5;
        pathTracer = tracers.get(gl) ?? new WebGLPathTracer(gl);
        tracers.set(gl, pathTracer);
        const size = gl.getDrawingBufferSize(new THREE.Vector2());
        pathTracer.renderScale = Math.min(1, MAX_SIDE / Math.max(size.x, size.y));
        pathTracer.tiles.set(START_TILES, START_TILES);
        pathTracer.bounces = 5;
        pathTracer.filterGlossyFactor = 0.5;
        pathTracer.minSamples = 1;
        pathTracer.renderDelay = 0;
        pathTracer.fadeDuration = 0;
        // 첫 표본이 나올 때까지 직전 화면을 그대로 둔다.
        pathTracer.rasterizeScene = false;
        pathTracer.setScene(scene, camera);
        reportedAt.current = 0;
        slowest.current = 0;
        tunedAt.current = 0;
        finished.current = false;
        tracer.current = pathTracer;
        invalidate();
      } catch (error) {
        // 만들다 만 경로 추적기는 버린다. fail()이 목록에서 빼므로 다음에는 새로 만든다.
        try {
          pathTracer?.dispose();
        } catch {
          // 이미 망가진 상태다. 해제 실패는 무시한다.
        }
        fail(error instanceof Error ? error.message : String(error));
      }
    }, 50);
    return () => {
      window.clearTimeout(timer);
      gl.domElement.removeEventListener('webglcontextlost', onContextLost);
      tracer.current = null;
      if (fence.current) {
        (gl.getContext() as WebGL2RenderingContext).deleteSync(fence.current);
        fence.current = null;
      }
      sky?.dispose();
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      gl.toneMapping = previousToneMapping;
      invalidate();
    };
  }, [gl, scene, camera, invalidate, onStatus]);

  // 우선순위를 1로 주면 기본 렌더 대신 이 함수가 화면을 그린다.
  useFrame(() => {
    const pathTracer = tracer.current;
    const context = gl.getContext() as WebGL2RenderingContext;
    // 표본을 다 모았으면 멈춘다. 멈추지 않으면 상태 보고가 화면을 다시 그리게 하고, 그것이 다음 표본을 부른다.
    if (!pathTracer || finished.current || context.isContextLost()) return;
    // GPU가 직전 타일을 끝낸 뒤에만 다음 타일을 그린다. 끝나기 전에 계속 쌓으면 그래픽 장치가 멈춘 것으로 판정돼 컨텍스트가 사라진다.
    if (fence.current) {
      if (context.clientWaitSync(fence.current, 0, 0) === context.TIMEOUT_EXPIRED) {
        invalidate();
        return;
      }
      context.deleteSync(fence.current);
      fence.current = null;
      slowest.current = Math.max(slowest.current, performance.now() - issuedAt.current);
    }
    // 표본 1개를 마쳤으면 타일 크기를 다시 정한다. 타일 수를 반으로 줄이면 타일 1장이 4배 커진다.
    // 줄이기만 한다. 타일 수가 앞 단계의 약수라서 표본 경계가 어긋나지 않는다.
    if (pathTracer.samples > 0 && Number.isInteger(pathTracer.samples) && pathTracer.samples !== tunedAt.current) {
      tunedAt.current = pathTracer.samples;
      let tiles = pathTracer.tiles.x;
      let expected = slowest.current;
      while (tiles > 1 && expected * 4 <= TILE_BUDGET_MS) {
        tiles /= 2;
        expected *= 4;
      }
      pathTracer.tiles.set(tiles, tiles);
      slowest.current = 0;
    }
    try {
      pathTracer.renderSample();
    } catch (error) {
      tracer.current = null;
      onStatus({ state: 'error', samples: 0, target: TARGET_SAMPLES, seconds: (performance.now() - started.current) / 1000, message: error instanceof Error ? error.message : String(error) });
      return;
    }
    issuedAt.current = performance.now();
    fence.current = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0);
    context.flush();
    const samples = Math.floor(pathTracer.samples);
    const done = samples >= TARGET_SAMPLES;
    finished.current = done;
    const now = performance.now();
    // 진행 표시는 1초에 한 번만 바꾼다.
    if (done || now - reportedAt.current >= 1000) {
      reportedAt.current = now;
      const state = done ? 'done' : pathTracer.samples > 0 ? 'rendering' : 'compiling';
      onStatus({ state, samples, target: TARGET_SAMPLES, seconds: (now - started.current) / 1000 });
    }
    if (!done) invalidate();
  }, 1);

  return null;
}
