import * as THREE from 'three';
import type { LayerId, MaterialId } from '../data/types';
import { surfaceMaps } from './textures';

/** 도면 모드의 색. 재질을 색으로만 구분한다. */
export const DRAW_COLORS: Record<MaterialId, string> = {
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
  // 다음 4개는 기존 품목의 재질을 실사 모드용으로 나눈 것이다. 도면 모드 색은 나누기 전과 같다.
  steelDoor: '#b08d57',
  paintDoor: '#b08d57',
  marble: '#9a9fa6',
  granite: '#9a9fa6',
  // 그 밖은 새로 넣은 품목의 색이다.
  floorTile: '#c9c4ba',
  smallTile: '#b5b0a6',
  wainscotTile: '#e3e0d8',
  paint: '#ecebe6',
  ceiling: '#f2f2f0',
  brass: '#c8a25a',
  bronze: '#5a5048',
  black: '#2b2d31',
  white: '#f4f4f2',
  led: '#ffd27a',
};

export const LAYER_MATERIAL: Record<LayerId, MaterialId> = {
  wall: 'wall',
  partition: 'partition',
  door: 'door',
  fixture: 'ceramic',
  accessory: 'stone',
  light: 'light',
  finish: 'floorTile',
  dim: 'metal',
};

export type Highlight = 'none' | 'hover' | 'selected';

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

/**
 * 실사 모드의 재질(PBR). 색은 도면에 없다. 호텔 화장실 느낌에 맞춘 작성자 제안이다.
 * 경로 추적기가 MeshStandardMaterial 과 MeshPhysicalMaterial 만 지원하므로 그 둘만 쓴다.
 */
function createReal(id: MaterialId): THREE.MeshStandardMaterial {
  switch (id) {
    case 'wall':
      return std({ ...surfaceMaps('wallTile'), roughness: 1 });
    case 'floorTile':
      return std({ ...surfaceMaps('floorTile'), roughness: 1 });
    case 'smallTile':
      return std({ ...surfaceMaps('smallTile'), roughness: 1 });
    case 'wainscotTile':
      return std({ ...surfaceMaps('wainscotTile'), roughness: 1 });
    case 'partition':
    case 'door':
      return std({ ...surfaceMaps('wood'), roughness: 0.42 });
    case 'marble':
      return std({ ...surfaceMaps('marble'), roughness: 0.22 });
    case 'granite':
      return std({ ...surfaceMaps('granite'), roughness: 0.4 });
    case 'ceiling':
      return std({ ...surfaceMaps('ceiling'), roughness: 0.6, metalness: 0.1 });
    case 'ceramic':
      return new THREE.MeshPhysicalMaterial({ color: '#f6f4ef', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
    case 'glass':
      // 깊이를 쓰지 않는다. 접촉 음영(AO)이 유리 면에 점무늬를 만들지 않게 한다.
      return new THREE.MeshPhysicalMaterial({ color: '#dff1ee', roughness: 0.03, transparent: true, opacity: 0.28, depthWrite: false });
    case 'mirror':
      return std({ color: '#ffffff', metalness: 1, roughness: 0.03 });
    case 'metal':
      return std({ color: '#c9c9c6', metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
    case 'brass':
      return std({ color: '#c8a25a', metalness: 1, roughness: 0.28 });
    case 'bronze':
      return std({ color: '#3a332d', metalness: 0.8, roughness: 0.4 });
    case 'steelDoor':
      return std({ color: '#5b5148', metalness: 0.85, roughness: 0.38 });
    case 'paintDoor':
      return std({ color: '#cfc8bb', roughness: 0.6 });
    case 'paint':
      return std({ color: '#e8e3da', roughness: 0.9 });
    case 'stone':
      return std({ color: '#b9b4aa', roughness: 0.5 });
    case 'black':
      return std({ color: '#1b1b1d', metalness: 0.3, roughness: 0.5 });
    case 'white':
      return std({ color: '#f1f0ec', roughness: 0.7 });
    case 'tactile':
      return std({ color: '#e2b400', roughness: 0.75 });
    case 'light':
      return std({ color: '#ffffff', emissive: '#ffe3bd', emissiveIntensity: 3 });
    case 'led':
      return std({ color: '#ffffff', emissive: '#ffd9a6', emissiveIntensity: 4 });
  }
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** 재질은 종류와 강조 상태마다 1개만 만들어서 함께 쓴다. */
export function realMaterial(id: MaterialId, highlight: Highlight): THREE.MeshStandardMaterial {
  const key = `${id}|${highlight}`;
  let material = cache.get(key);
  if (!material) {
    material = createReal(id);
    if (highlight !== 'none' && id !== 'light' && id !== 'led') {
      material.emissive = new THREE.Color(highlight === 'selected' ? '#ff5a2a' : '#ffb347');
      material.emissiveIntensity = highlight === 'selected' ? 0.45 : 0.22;
    }
    cache.set(key, material);
  }
  return material;
}

/** 그림자를 만들지 않는 재질 */
export const NO_SHADOW: ReadonlySet<MaterialId> = new Set<MaterialId>(['glass', 'light', 'led']);
