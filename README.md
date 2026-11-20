# 교육관 화장실 도면 3D 뷰어

스캔 도면 PDF `교육관 화장실 배치(안).pdf` 8장을 탭 8개로 보는 3D 뷰어다.
도면 치수로 직접 만든 3D 모델 아래에 기울기를 보정한 스캔 도면을 깐다.

현재 상태와 다음 작업은 [docs/handover/session_handover.md](docs/handover/session_handover.md)에 있다.

## 실행

```powershell
pnpm install
pnpm dev
```

검사 명령은 `pnpm typecheck` 와 `pnpm lint` 다.

URL 인자로 처음 상태를 정할 수 있다. 예: `?sheet=research-3f&view=top&cut=1200`
(`view` 는 `top`, `iso`, `eye` 중 하나다. `cut` 은 절단 높이 mm다.)

TypeScript는 6.x를 쓴다. `typescript-eslint` 가 7.0을 지원하지 않는다.

## 도면 이미지 다시 만들기

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r scripts\requirements.txt
.venv\Scripts\python.exe scripts\prep_plans.py "교육관 화장실 배치(안).pdf" public\plans work\plans_300
```

## 문서

문서 목록은 [docs/index.md](docs/index.md)에 있다.
