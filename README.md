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
(`view` 는 `top`, `iso`, `eye` 중 하나다. `cut` 은 절단 높이 mm다. `dim=1` 은 치수 레이어를 켠다. `mode=real` 은 실사 모드로 시작한다. `added=0` 은 도면에 없는 상식 보완 품목을 두 모드 모두에서 끈다. `added=1` 은 두 모드 모두에서 켠다. 인자가 없으면 실사 모드에서만 켠다. `hq=0` 은 고품질 렌더 스위치를 끈 채로 시작한다.)

표시 모드는 2개다. 도면 모드는 스캔 도면 위에 모델을 겹쳐 본다. 실사 모드는 재질, 조명, 그림자를 넣어 본다. 실사 모드의 「고품질 렌더」 는 켜고 끄는 스위치다. 기본은 켜짐이다. 켜 두면 화면이 멈추고 1.5초 뒤에 현재 시점을 경로 추적으로 다듬는다. 시점을 바꾸면 처음부터 다시 만든다. 내장 그래픽에서는 오래 걸린다. 느린 PC에서는 스위치를 끄거나 `hq=0` 으로 연다.

TypeScript는 6.x를 쓴다. `typescript-eslint` 가 7.0을 지원하지 않는다.

## 도면 이미지 다시 만들기

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r scripts\requirements.txt
.venv\Scripts\python.exe scripts\prep_plans.py "교육관 화장실 배치(안).pdf" public\plans work\plans_300
```

## 문서

문서 목록은 [docs/index.md](docs/index.md)에 있다.
