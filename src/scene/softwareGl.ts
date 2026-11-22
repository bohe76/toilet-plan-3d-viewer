// 브라우저의 그래픽 가속이 꺼졌는지 판별한다. WebGL 렌더러 이름(UNMASKED_RENDERER_WEBGL)을 받는다.
// 그래픽 가속이 꺼지면 Chrome은 CPU로 그린다(SwiftShader). Linux의 llvmpipe, Windows의 Microsoft Basic Render Driver도 같다.

const SOFTWARE_NAMES = ['swiftshader', 'llvmpipe', 'software', 'basic render'];

export function isSoftwareRenderer(renderer: string): boolean {
  const name = renderer.toLowerCase();
  return SOFTWARE_NAMES.some((word) => name.includes(word));
}
