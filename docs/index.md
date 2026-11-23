# 문서 목록

교육관 화장실 도면 3D 뷰어의 문서다. 다음 세션은 `handover/session_handover.md` 부터 읽는다.

| 폴더 | 문서 | 내용 |
|---|---|---|
| `handover/` | [session_handover.md](handover/session_handover.md) | 현재 상태, 미검증 항목, 다음 작업 순서, 환경 문제 |
| `spec/` | [viewer_spec.md](spec/viewer_spec.md) | 확정된 방식과 범위, 기능, 화면 배치, 마우스 동작 |
| `plans/` | [viewer_ux_theme_plan.md](plans/viewer_ux_theme_plan.md) | 뷰어 조작 5건과 어두운 테마의 구현 계획. 보헤님 승인, 구현 전 |
| `drawings/` | [sheet_index.md](drawings/sheet_index.md) | 도면 8장 목록, 탭 매핑, 스캔 특성 |
| `drawings/` | `<탭>_measurements.md` 8개 | 탭마다의 측정값, 좌표 환산, 판독 메모. [강의동 2F](drawings/lecture_2f_measurements.md), [3F](drawings/lecture_3f_measurements.md), [4F](drawings/lecture_4f_measurements.md), [연구동 1F](drawings/research_1f_measurements.md), [2F](drawings/research_2f_measurements.md), [3F(파일럿)](drawings/research_3f_measurements.md), [4F](drawings/research_4f_measurements.md), [5F](drawings/research_5f_measurements.md) |
| `guides/` | [measurement_workflow.md](guides/measurement_workflow.md) | 스캔 도면에서 좌표를 얻는 절차, 독립 검수 절차 |
| `guides/` | [tab_author_brief.md](guides/tab_author_brief.md) | 탭 작성 에이전트의 순서, 파일 범위, 데이터 규칙, 보고 형식 |
| `guides/` | [tab_verifier_brief.md](guides/tab_verifier_brief.md) | 독립 검증 에이전트의 순서, 규칙, 대조 항목 |
| `guides/` | [project_story_for_friends.md](guides/project_story_for_friends.md) | 비개발자용 프로젝트 진행 이야기. 시간순 지시, 피드백, AI의 행동, 따라 하는 요령 |
| `verification/` | `<탭>_verification.md` 8개 | 탭마다의 독립 검수 기록, 조율자 결정, 모델 제외 항목, 판정불가. [강의동 2F](verification/lecture_2f_verification.md), [3F](verification/lecture_3f_verification.md), [4F](verification/lecture_4f_verification.md), [연구동 1F](verification/research_1f_verification.md), [2F](verification/research_2f_verification.md), [3F(파일럿)](verification/research_3f_verification.md), [4F](verification/research_4f_verification.md), [5F](verification/research_5f_verification.md) |

문서가 가리키는 `work/` 경로(측정 이미지, 검수 캡처, 작업 폴더)는 git 밖이라서 저장소에 없다. 측정 이미지는 `scripts/` 로 다시 만들 수 있다. 점검 도구는 `tools/` 에 있다.
