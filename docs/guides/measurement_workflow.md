# 스캔 도면 좌표 추출 절차

스캔 도면 1장을 3D 모델 데이터로 옮기는 절차다. 연구동 3층에서 쓴 방법이다. 나머지 7장에 같은 절차를 쓴다.

## 준비

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r scripts\requirements.txt
```

이전 세션은 임시 폴더의 venv를 썼다. 그 venv는 세션과 함께 사라진다. 프로젝트에 `.venv` 를 새로 만든다.

## 절차

### 1. 기울기 보정 이미지 만들기

```powershell
.venv\Scripts\python.exe scripts\prep_plans.py "교육관 화장실 배치(안).pdf" public\plans work\plans_300
```

- `public/plans/plan_N.jpg`: 200dpi. 뷰어의 바닥 도면이다.
- `work/plans_300/plan_N.jpg`: 300dpi. 측정용이다. git에 넣지 않는다.
- 이미 8장 모두 만들어져 있다. 다시 실행할 필요는 없다.

### 2. 선분 검출과 눈금자 타일 만들기

```powershell
.venv\Scripts\python.exe scripts\measure_plan.py work\plans_300\plan_6.jpg work\measure\p6 1100 230 3300 3230 2 3
```

인자는 이미지, 출력 폴더, 평면이 있는 영역(x0 y0 x1 y1, 300dpi 픽셀), 타일 열 수와 행 수다.

- `segments.json`: 길이 40px 이상인 수직선과 수평선 목록이다. `pos` 는 선의 위치, `a`~`b` 는 구간, `t` 는 두께다.
- `tile_rRcC.png`: 100px 간격 눈금과 좌표 숫자가 있는 타일이다.

### 3. 타일을 읽고 선분의 뜻을 정하기

- 타일의 눈금 숫자가 전역 픽셀 좌표다. 타일 이미지 자체의 픽셀 위치를 쓰지 않는다.
- 타일에서 벽, 칸막이, 문, 기구의 대략 위치를 읽는다. 그 위치와 가까운 선분을 `segments.json` 에서 찾아 정확한 값을 쓴다.

### 4. 축척과 원점 정하기

- 치수 보조선(길고 얇은 선)의 픽셀 위치를 찾는다.
- 도면 표기 치수를 픽셀 거리로 나눠 mm/px를 구한다. 가로와 세로를 각각 구해 서로 맞는지 본다.
- 치수선의 시작점을 원점으로 정한다.
- 모든 치수선 분할을 환산해서 도면 표기와 비교한다. 오차가 10mm를 넘으면 선분 선택을 다시 본다.

### 5. 모델 데이터 작성

- `src/data/` 에 탭 데이터 파일을 만든다. `research_3f.ts` 를 본보기로 쓴다.
- 치수마다 출처(`drawn` / `scaled` / `assumed`)를 붙인다.
- 도면에 없는 높이는 가정값으로 넣고 `remark` 에 적는다.
- 판독이 불확실한 항목은 지어내지 않는다. 판독된 것만 넣고 `remark` 와 측정값 문서에 남긴다.

### 6. 화면 확인

- 평면 뷰에서 모델이 바닥 도면의 선과 겹치는지 본다. 어긋나면 좌표를 고친다.
- 브라우저 자동화 도구가 없으면 Chrome 헤드리스로 캡처한다. 개발 서버를 띄운 뒤 아래 명령을 쓴다.

```powershell
pnpm dev --port 5183 --strictPort
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --user-data-dir="$env:TEMP\chrome-capture" --window-size=2400,2300 --hide-scrollbars --enable-unsafe-swiftshader --virtual-time-budget=25000 --screenshot=work\verify\p6\top.png "http://localhost:5183/?sheet=research-3f&mode=plan&view=top&dim=1&cut=1200"
```

- 이 명령으로 캡처하면 캔버스 오른쪽과 아래에 빈 띠가 생긴다. 창 안쪽 크기가 지정값보다 작게 잡혀서 생기는 캡처 현상이다. 2026-11-21에 chrome-devtools-headless MCP로 뷰포트를 1600 × 1000으로 고정해서 캡처했을 때는 빈 띠가 없었다(캔버스 크기와 화면 영역 크기가 같았다).
- 검수자에게 줄 평면 화면은 `?mode=plan&view=top&dim=1&cut=1200` 으로 만든다. 처음 화면이 실사 모드라서 `mode=plan` 이 필요하다. 절단 높이의 기본값이 탭의 천장고라서 `cut=1200` 이 필요하다. 붙이지 않으면 문 위의 벽이 문 개구를 덮는다. 도면 모드는 도면에 없는 상식 보완 품목을 기본으로 숨긴다.
- 고품질 렌더는 기본으로 꺼져 있다. 실사 모드 화면은 그대로 캡처한다. `hq=1` 을 붙이면 고품질 렌더가 자동으로 시작한다.
- 표기 치수와 선 위치가 다르면 표기 치수를 따른다. 그 사실을 `remark` 에 적는다.

### 7. 독립 검수 (필수)

- 작성자와 다른 에이전트(verifier)에게 맡긴다. 작성자의 결론은 주지 않는다.
- 주는 자료: 원본 도면 이미지(`work/plans_300/plan_N.jpg` 또는 타일), 모델 데이터 파일, 평면 뷰 화면.
- 대조 항목: 치수, 배치, 개수, 문 열림 방향, 도면 주기와 품목의 대응.
- 불일치가 나오면 고친 뒤 다시 검수한다.

## 주의할 점

- **지시선이 선분에 붙는다.** 주기의 지시선이 대상 선과 같은 직선 위에 있으면 선분 하나로 검출된다. 예: 가림 칸막이는 279px로 검출됐지만 실제 길이는 약 185px(800mm)다. 타일로 끝점을 확인한다.
- **두꺼운 선은 여러 선이 겹친 것일 수 있다.** `t` 가 8 이상이면 벽 면과 거울 선 등이 겹친 것이다.
- **점선은 검출되지 않는다.** 길이 40px 미만 조각은 빠진다. 타일로 읽는다.
- **손글씨와 형광펜은 채도로 걸러 낸다.** 그 아래의 선이 끊겨 검출될 수 있다.
- **작은 글자는 100dpi에서 읽지 않는다.** 치수 숫자는 300dpi 타일에서만 읽는다.
- **명목 축척을 쓰지 않는다.** 스캔에 약 97% 축소가 들어가 있다.
