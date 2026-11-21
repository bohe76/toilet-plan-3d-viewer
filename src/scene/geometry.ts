import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Hole, Shape } from '../data/types';

/** mm를 장면 단위(m)로 바꾼다. */
export const M = 0.001;

/** 도형이 차지하는 높이 범위 [아래, 위] mm */
function zRange(shape: Shape): [number, number] {
  switch (shape.type) {
    case 'lathe': {
      const zs = shape.profile.map((p) => p[1]);
      return [Math.min(...zs), Math.max(...zs)];
    }
    case 'tube': {
      const zs = shape.path.map((p) => p[2]);
      return [Math.min(...zs) - shape.r, Math.max(...zs) + shape.r];
    }
    case 'pan':
      return [shape.z - shape.drop, shape.z];
    default:
      return [shape.z0, shape.z1];
  }
}

/**
 * 면의 방향에 따라 장면 좌표(m)를 그대로 UV로 쓴다.
 * 수평면은 (X, Z), 수직면은 (수평 방향, 높이)다. 타일 질감의 한 칸 크기가 실제 크기와 같아진다.
 */
function applyWorldUV(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i));
    const ny = Math.abs(n.getY(i));
    const nz = Math.abs(n.getZ(i));
    if (ny >= nx && ny >= nz) {
      uv[i * 2] = p.getX(i);
      uv[i * 2 + 1] = p.getZ(i);
    } else if (nx >= nz) {
      uv[i * 2] = p.getZ(i);
      uv[i * 2 + 1] = p.getY(i);
    } else {
      uv[i * 2] = p.getX(i);
      uv[i * 2 + 1] = p.getY(i);
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/**
 * 형상이 실제로 달라지는 절단 높이만 남긴다. 절단 슬라이더를 움직여도 잘리지 않는 도형은 다시 만들지 않게 한다.
 * 잘리지 않으면 Infinity다. 회전체·관·경사 바닥은 통째로 그리거나(Infinity) 안 그린다(-Infinity).
 */
export function cutKey(shape: Shape, cut: number): number {
  const [zMin, zMax] = zRange(shape);
  if (cut >= zMax) return Infinity;
  if (shape.type === 'lathe' || shape.type === 'tube' || shape.type === 'pan') return cut > zMin ? Infinity : -Infinity;
  return cut;
}

function roundedRect(path: THREE.Path, x0: number, y0: number, x1: number, y1: number, r: number): void {
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  if (rr <= 0) {
    path.moveTo(x0, y0);
    path.lineTo(x1, y0);
    path.lineTo(x1, y1);
    path.lineTo(x0, y1);
    path.closePath();
    return;
  }
  path.moveTo(x0 + rr, y0);
  path.lineTo(x1 - rr, y0);
  path.absarc(x1 - rr, y0 + rr, rr, -Math.PI / 2, 0, false);
  path.lineTo(x1, y1 - rr);
  path.absarc(x1 - rr, y1 - rr, rr, 0, Math.PI / 2, false);
  path.lineTo(x0 + rr, y1);
  path.absarc(x0 + rr, y1 - rr, rr, Math.PI / 2, Math.PI, false);
  path.lineTo(x0, y0 + rr);
  path.absarc(x0 + rr, y0 + rr, rr, Math.PI, Math.PI * 1.5, false);
}

function holePath(h: Hole): THREE.Path {
  const path = new THREE.Path();
  if ('cx' in h) path.absarc(h.cx * M, h.cy * M, h.r * M, 0, Math.PI * 2, true);
  else roundedRect(path, h.x0 * M, h.y0 * M, h.x1 * M, h.y1 * M, h.r * M);
  return path;
}

/**
 * 도형의 형상을 장면 좌표(m)로 만든다. 메시는 원점에 둔다.
 * 절단 높이(cut)보다 위는 그리지 않는다. 상자류는 잘라서 그리고, 회전체·관·경사 바닥은 아래 끝이 cut보다 낮으면 통째로 그린다.
 */
export function buildGeometry(shape: Shape, cut: number): THREE.BufferGeometry | null {
  const [zMin, zMax] = zRange(shape);
  if (zMin >= cut) return null;
  const z1 = Math.min(zMax, cut);
  const h = (z1 - zMin) * M;
  const yMid = ((zMin + z1) / 2) * M;
  switch (shape.type) {
    case 'box': {
      const g = new THREE.BoxGeometry((shape.x1 - shape.x0) * M, h, (shape.y1 - shape.y0) * M);
      g.translate(((shape.x0 + shape.x1) / 2) * M, yMid, ((shape.y0 + shape.y1) / 2) * M);
      return applyWorldUV(g);
    }
    case 'rbox': {
      const w = (shape.x1 - shape.x0) * M;
      const d = (shape.y1 - shape.y0) * M;
      const g = new RoundedBoxGeometry(w, h, d, 6, Math.min(shape.r * M, w / 2, h / 2, d / 2));
      g.translate(((shape.x0 + shape.x1) / 2) * M, yMid, ((shape.y0 + shape.y1) / 2) * M);
      return applyWorldUV(g);
    }
    case 'cylinder': {
      const g = new THREE.CylinderGeometry(1, 1, 1, 40);
      g.scale(shape.rx * M, h, shape.ry * M);
      g.translate(shape.cx * M, yMid, shape.cy * M);
      return applyWorldUV(g);
    }
    case 'leaf': {
      const g = new THREE.BoxGeometry(shape.width * M, h, shape.thickness * M);
      g.translate((shape.width / 2) * M, yMid, 0);
      applyWorldUV(g);
      g.rotateY(-THREE.MathUtils.degToRad(shape.angleDeg));
      g.translate(shape.hx * M, 0, shape.hy * M);
      return g;
    }
    case 'quarter': {
      const g = new THREE.CylinderGeometry(shape.r * M, shape.r * M, h, 24, 1, false, -THREE.MathUtils.degToRad(shape.startDeg), Math.PI / 2);
      g.translate(shape.cx * M, yMid, shape.cy * M);
      return applyWorldUV(g);
    }
    case 'lathe': {
      const g = new THREE.LatheGeometry(shape.profile.map(([r, z]) => new THREE.Vector2(r, z * M)), 48);
      g.scale(shape.rx * M, 1, shape.ry * M);
      g.translate(shape.cx * M, 0, shape.cy * M);
      return g;
    }
    case 'tube': {
      const pts = shape.path.map(([x, y, z]) => new THREE.Vector3(x * M, z * M, y * M));
      const r = shape.r * M;
      if (pts.length === 2) {
        const dir = pts[1].clone().sub(pts[0]);
        const g = new THREE.CylinderGeometry(r, r, dir.length(), 24);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
        const mid = pts[0].clone().add(pts[1]).multiplyScalar(0.5);
        g.translate(mid.x, mid.y, mid.z);
        return g;
      }
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
      const body = new THREE.TubeGeometry(curve, pts.length * 8, r, 20, false);
      const caps = [pts[0], pts[pts.length - 1]].map((p) => new THREE.SphereGeometry(r, 20, 10).translate(p.x, p.y, p.z));
      return mergeGeometries([body, ...caps]);
    }
    case 'plate': {
      const outline = new THREE.Shape();
      roundedRect(outline, shape.x0 * M, shape.y0 * M, shape.x1 * M, shape.y1 * M, (shape.r ?? 0) * M);
      outline.holes = shape.holes.map(holePath);
      const g = new THREE.ExtrudeGeometry(outline, { depth: h, bevelEnabled: false, curveSegments: 24 });
      // 도형의 (x, y)를 장면의 (X, Z)로, 돌출 방향을 아래(-Y)로 돌린다.
      g.rotateX(Math.PI / 2);
      g.translate(0, z1 * M, 0);
      return applyWorldUV(g);
    }
    case 'pan': {
      const y = shape.z * M;
      const c = [shape.cx * M, (shape.z - shape.drop) * M, shape.cy * M];
      const corners = [
        [shape.x0 * M, y, shape.y0 * M],
        [shape.x0 * M, y, shape.y1 * M],
        [shape.x1 * M, y, shape.y1 * M],
        [shape.x1 * M, y, shape.y0 * M],
      ];
      // 위에서 볼 때 법선이 위를 향하는 순서다.
      const position = corners.flatMap((corner, i) => [...corner, ...corners[(i + 1) % 4], ...c]);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
      g.computeVertexNormals();
      return applyWorldUV(g);
    }
  }
}
