# Health
운동 회원들에게 운동 기구 설명 및 영상으로의 사용 설명, 헬스장 이벤트 공지 등. 헬스장 기구를 잘못된 자세로 하는 게 아니라 정자세로 알려드리기 위한 것을 목표로 잡고 있다.

## 기구 도감 페이지

| 파일 | 용도 |
|---|---|
| `training/index.html` | **회원용** — 보기 전용. 편집 기능이 전혀 노출되지 않습니다 |
| `training/admin.html` | **관리자용** — 기구 추가, 영상 링크 등록, 숨기기, 내보내기 |
| `training/assets/data.js` | 기구 34종 데이터 |
| `training/assets/app.css` `training/assets/app.js` | 두 페이지가 함께 쓰는 스타일·스크립트 |
| `index.html` | `training/` 으로 보내는 안내 페이지 |

- 분류: 유산소 / 프리웨이트 / 상체 머신 / 하체 머신 / 케이블·기능성
- 기구별 **자세히 보기** → 타깃 근육 · 세팅 체크 · 동작 순서 · 코칭 큐 · 주의사항 · 영상
- 영상은 새 탭 링크 카드. 아직 없는 기구는 유튜브 검색 링크가 걸린 자리로 표시됩니다

### 관리자 페이지 암호
`training/admin.html` 안의 `window.ADMIN_CODE = "2580";` 에서 바꿉니다.
소스 보기로 확인할 수 있으므로 **화면 가림용**이지 보안 장치가 아닙니다.
`""` 로 비우면 잠금이 꺼집니다.

### 변경 내용 반영
관리자 페이지에서 추가·수정한 내용은 그 브라우저(localStorage)에만 저장됩니다.
회원 모두에게 보이게 하려면 **내보내기** JSON을 받아 `training/assets/data.js` 에 반영해야 합니다.

### GitHub Pages로 공개하기
저장소는 `kindgym` 조직의 `health` 라는 이름이어야 아래 주소가 나옵니다.
Settings → Pages → Source: `Deploy from a branch` → 브랜치와 `/ (root)` 선택 → Save.

- 회원용: `https://kindgym.github.io/health/training/`
- 관리자용: `https://kindgym.github.io/health/training/admin.html` (회원용 페이지에서 링크하지 않음)
