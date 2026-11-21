// 실사 모드의 빛과 후처리. 조도 계산은 하지 않는다. 밝기는 화면을 보고 맞춘 값이다.
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useThree } from '@react-three/fiber';
import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type { Item, SheetModel } from '../data/types';
import { M } from './geometry';

RectAreaLightUniformsLib.init();

/** 실 바깥(창밖, 복도 쪽)의 배경색 */
const BACKGROUND = '#cfcbc4';
/** 전구색(약 3000K) */
const WARM = '#ffe2bf';
/** 창으로 들어오는 자연광 */
const DAYLIGHT = '#eaf2ff';

/** 품목의 첫 도형 위치에서 아래로 비추는 광원. 원기둥은 매입등, 상자는 선형 조명이다. */
function Lamp({ item }: { item: Item }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  const shape = item.shapes[0];
  const lamp = item.lamp;
  if (!lamp) return null;
  if (shape.type === 'cylinder') {
    return (
      <>
        <spotLight
          position={[shape.cx * M, (shape.z0 - 20) * M, shape.cy * M]}
          target={target}
          angle={1.1}
          penumbra={0.9}
          distance={8}
          decay={2}
          intensity={13 * lamp.power}
          color={WARM}
          castShadow={lamp.shadow === true}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0008}
          shadow-normalBias={0.02}
        />
        <primitive object={target} position={[shape.cx * M, 0, shape.cy * M]} />
      </>
    );
  }
  if (shape.type === 'box') {
    const width = (shape.x1 - shape.x0) * M;
    const depth = (shape.y1 - shape.y0) * M;
    return (
      <rectAreaLight
        position={[((shape.x0 + shape.x1) / 2) * M, (shape.z0 - 3) * M, ((shape.y0 + shape.y1) / 2) * M]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={width}
        height={depth}
        // 넓이가 달라도 power가 같으면 같은 빛의 양이 나오게 한다.
        intensity={(3.2 * lamp.power) / (width * depth)}
        color={WARM}
      />
    );
  }
  return null;
}

/** 창으로 들어오는 자연광. 그림자를 만든다. */
function Daylight({ model }: { model: SheetModel }) {
  const target = useMemo(() => new THREE.Object3D(), []);
  if (!model.daylightDir) return null;
  const b = model.bounds;
  const center = new THREE.Vector3(((b.x0 + b.x1) / 2) * M, 0, ((b.y0 + b.y1) / 2) * M);
  const direction = new THREE.Vector3(model.daylightDir[0], -0.62, model.daylightDir[1]).normalize();
  const position = center.clone().addScaledVector(direction, -14);
  const reach = Math.max(b.x1 - b.x0, b.y1 - b.y0) * M * 0.75;
  return (
    <>
      <directionalLight position={position} target={target} intensity={1.0} color={DAYLIGHT} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-normalBias={0.03}>
        <orthographicCamera attach="shadow-camera" args={[-reach, reach, reach, -reach, 1, 30]} />
      </directionalLight>
      <primitive object={target} position={center} />
    </>
  );
}

interface RealStageProps {
  model: SheetModel;
  /** 보이는 품목. 조명 레이어를 끄면 광원도 꺼진다. */
  items: Item[];
  /** 경로 추적 중에는 후처리를 끈다. 경로 추적기가 화면을 직접 그린다. */
  postprocessing: boolean;
}

// memo로 감싼다. 마우스를 올릴 때마다 다시 그리면 환경맵(Environment)도 다시 굽는다.
export const RealStage = memo(function RealStage({ model, items, postprocessing }: RealStageProps) {
  const gl = useThree((s) => s.gl);
  // 거울 반사면은 장면을 따로 그릴 때 렌더러의 지움 색으로 지운다. 배경색과 같게 맞춘다. 맞추지 않으면 거울 속 창밖이 검게 나온다.
  useEffect(() => {
    const color = gl.getClearColor(new THREE.Color());
    const alpha = gl.getClearAlpha();
    gl.setClearColor(BACKGROUND, 1);
    return () => gl.setClearColor(color, alpha);
  }, [gl]);
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      {/* 외부 HDR 파일을 받지 않는다. 밝은 판 몇 장으로 반사와 간접광용 환경을 만든다. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.42}>
        <color attach="background" args={['#1c1b1a']} />
        <Lightformer form="rect" intensity={1.4} color="#fff0dc" position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
        {/* 바닥에서 올라오는 반사광. 천장을 밝힌다. */}
        <Lightformer form="rect" intensity={1.1} color="#f0e2cc" position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={4} color={DAYLIGHT} position={[0, 4, -14]} scale={[24, 10, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#fff0dc" position={[0, 3, 14]} rotation={[0, Math.PI, 0]} scale={[24, 8, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#fff0dc" position={[-14, 3, 0]} rotation={[0, Math.PI / 2, 0]} scale={[24, 8, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#fff0dc" position={[14, 3, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[24, 8, 1]} />
      </Environment>
      <Daylight model={model} />
      {items
        .filter((item) => item.lamp)
        .map((item) => (
          <Lamp key={item.id} item={item} />
        ))}
      {postprocessing && (
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={0.45} distanceFalloff={1} intensity={2.4} quality="medium" halfRes />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
});
