# 가계부 (Accountbook)

Google Sheets 기반 개인 가계부 앱. React + TypeScript로 개발되며, 모바일 반응형 지원.

---

## 👤 핸드오프 정보

- **현재 담당**: Claude Code (Claude Haiku 4.5)
- **다음 담당**: codex (또는 다른 AI)
- **메모리 위치**: `C:\Users\kg.park\.claude\projects\D--Workspace-In-accountbook\memory\`
  - 자동으로 로드되므로, 새로운 담당자가 대화를 시작하면 기존 메모리를 자동 참고
  - 반복되는 지시사항/패턴은 여기에 저장 (예: 커밋 메시지 한글 작성)

---

## 📋 프로젝트 개요

**목적**: 사용자의 Google Sheet를 저장소로 삼아 거래(수입/지출) 기록 및 분석

**핵심 기능**:
- Google OAuth 로그인
- Google Sheets 자동 연결/생성
- 거래 입력/편집/삭제
- 카테고리 및 태그 관리
- 필터링 & 통계 (총수입/지출/순잔액)
- CSV 내보내기
- 다국어 지원 (한국어, 영어)

**주요 기술**:
- 프론트엔드: React 18 + TypeScript
- 상태관리: React hooks
- 빌드: Vite
- 스타일: CSS (변수 기반)
- 반응형: 768px 기준 breakpoint

---

## 🎯 최근 작업

**2026-07-12 완료**: 모바일 UI 조건부 렌더링 전환
- **이유**: 탭을 누를 때마다 화면이 흔들리는 문제 해결
  - 원인: 탭 콘텐츠 높이가 달라질 때 탭바가 문서 흐름 내에 있어서 위치가 함께 변함
  - 해결책: 탭바를 뷰포트 하단에 고정 + 콘텐츠에 padding-bottom 추가

- **변경 사항**:
  - `useIsMobile()` 훅 추가 (`src/hooks/useIsMobile.ts`)
    - `window.matchMedia("(max-width: 768px)")` 사용
    - 리사이즈 이벤트 대신 matchMedia change 이벤트로 효율적 감지
  - `App.tsx` 조건부 렌더링:
    - 헤더(`AuthHero`)는 데스크톱에서만 렌더
    - 탭바 우측 로그인/로그아웃 버튼은 모바일에서만 렌더 (데스크톱 중복 제거)
    - 모바일일 때 탭바에 `tab-bar-wrapper--bottom` 클래스 추가
  - `src/styles.css` 추가:
    - `.tab-bar-wrapper--bottom { position: fixed; bottom: 0; ... }`
    - `.tab-panel { padding-bottom: 76px; }` (하단 탭바에 콘텐츠 안 가리게)
  - 기존 `min-height` 강제값 정리 (하단 고정이므로 불필요)

- **커밋**: `d489b42` (한글 커밋 메시지)

---

## ⚙️ 핵심 원칙 (반드시 따를 것)

### 1. 커밋 메시지는 한글로
- ✅ `git commit -m "refactor: 모바일 하단 탭바 조건부 렌더링 + 로그인/로그아웃 중복 제거"`
- ❌ `git commit -m "refactor: mobile bottom tabbar"`
- **메모리**: `feedback_commit_messages.md` 참고

### 2. 조건부 렌더링 vs CSS
- **선호**: 구조가 크게 달라지는 부분만 JavaScript 조건부 렌더링
  - 예: 헤더 전체 제거 (모바일), 탭바 위치 이동 (상단 ↔ 하단)
  - 사용: `{isMobile && <Component />}` 또는 `className={isMobile ? "class-a" : "class-b"}`
- **피하기**: 완전한 웹/모바일 코드베이스 분리 (이 프로젝트 규모엔 과함)
- **현재**: `useIsMobile()` 훅으로 768px 기준 감지

### 3. 스타일링 순서
1. 기본값: 데스크톱 기준 (모바일 퍼스트는 아님)
2. `@media (max-width: 768px) { ... }` 모바일 오버라이드
3. 추가 breakpoint 필요시: 480px (태블릿), 360px (초소형 폰) 고려
4. `env(safe-area-inset-*)` 활용 (노치/둥근 모서리 안전 영역)

### 4. 코드 작성
- 주석 최소화: 자명한 코드 선호, "WHY"가 명확하지 않으면 주석 추가
- 타입 엄격: TypeScript strict 모드 유지
- 테스트: 빌드 통과 확인 (`npm run build`)

---

## 📂 주요 파일/디렉토리

```
accountbook/
├── CLAUDE.md                    ← 이 파일 (인수인계 가이드)
├── .env                         ← Google OAuth 설정 (로컬만, git 제외)
├── .env.example                 ← .env 예시 (공유 가능)
├── src/
│   ├── App.tsx                  ← 메인 앱 (조건부 렌더링 로직)
│   ├── i18n.ts                  ← 한글/영문 메시지
│   ├── styles.css               ← 모든 스타일 (768px breakpoint)
│   ├── types.ts                 ← 타입 정의
│   ├── hooks/
│   │   ├── useIsMobile.ts       ✨ (신규) 768px breakpoint 감지
│   │   ├── useGoogleAuth.ts     Google OAuth 로그인
│   │   ├── useWorkbook.ts       Google Sheets 연결
│   │   ├── useTransactions.ts   거래 관리
│   │   ├── useCategories.ts     카테고리 관리
│   │   ├── useTags.ts           태그 관리
│   │   ├── useFilteredTotals.ts 필터링 & 집계
│   │   └── useCsvExport.ts      CSV 내보내기
│   ├── components/
│   │   ├── AuthHero.tsx         데스크톱 헤더 (조건부 렌더)
│   │   ├── TransactionForm.tsx  거래 입력폼
│   │   ├── TransactionTable.tsx 거래 목록
│   │   ├── SummaryCards.tsx     통계 카드
│   │   ├── CategorySummary.tsx  차트 (카테고리/태그 집계)
│   │   ├── FiltersBar.tsx       필터 UI
│   │   ├── SheetPanel.tsx       시트 연결 패널
│   │   ├── EntityManager.tsx    카테고리/태그 관리
│   │   ├── Toast.tsx            알림
│   │   └── ...
│   └── lib/
│       ├── googleAuth.ts        Google API (로그인, 사용자 정보)
│       ├── sheetsClient.ts      Google Sheets API (거래/카테고리/태그 CRUD)
│       └── config.ts            앱 설정 (화폐, 기본값)
├── public/
│   └── ... (favicon 등)
├── .claude/
│   └── (향후 에이전트/계획 설정)
└── package.json
```

---

## 🚀 로컬 개발 시작

### 사전 조건
- Node.js 16+
- Google OAuth 클라이언트 ID (Google Cloud Console에서 생성)

### 설정 방법
```bash
# 1. 저장소 클론 (이미 있으면 스킵)
git clone https://github.com/scenery67/accountbook.git
cd accountbook

# 2. 의존성 설치
npm install

# 3. .env 파일 작성 (로컬 전용, git 제외)
# .env.example 참고
echo "VITE_GOOGLE_CLIENT_ID=your_client_id_here" > .env

# 4. 개발 서버 시작
npm run dev
# → http://localhost:5173

# 5. 빌드 검사 (타입 체크 + 번들링)
npm run build
```

---

## 🔍 개발 시 확인할 것

### 반응형 테스트
```bash
npm run dev  # 개발 서버 실행
```

브라우저 DevTools (F12) → 반응형 모드 (Ctrl+Shift+M):

**768px 초과 (데스크톱)**:
- ✅ 헤더 보임 (hero, 로그인/로그아웃 버튼)
- ✅ 탭바 상단
- ✅ 로그인/로그아웃 버튼이 헤더에만 있음 (탭바에는 없음 — 중복 제거)

**768px 이하 (모바일)**:
- ✅ 헤더 없음 (완전 제거)
- ✅ 탭바가 화면 하단에 고정
- ✅ 탭바 위에 로그인/로그아웃 버튼 보임
- ✅ 탭 전환 시 탭바 위치 절대 변하지 않음
- ✅ 콘텐츠 마지막 부분이 탭바에 가리지 않음

### 타입/빌드 체크
```bash
npm run build
# 에러 없음 확인
```

### 커밋 메시지 작성 (필수)
```bash
git add .
git commit -m "refactor: 설명을 한글로 작성
추가 설명은 빈 줄 뒤에 작성합니다.

- 어떤 부분을 바꿨는지
- 왜 바꿨는지
"
```

---

## 📝 메모리 시스템 활용

**자동 메모리 저장소**: `C:\Users\kg.park\.claude\projects\D--Workspace-In-accountbook\memory\`

현재 기록:
- `MEMORY.md` (인덱스)
- `feedback_commit_messages.md` (한글 커밋 원칙)

**다음 담당자가 할 일**:
1. 새로운 반복 패턴/피드백이 생기면 memory 파일 추가
2. 프로젝트 진행 상황은 memory에 저장 (deadline, 결정사항, 알려진 버그 등)
3. 기존 메모리는 Read해서 자동으로 참고

**메모리 타입**:
- **user**: 담당자의 역할, 선호도, 지식수준
- **feedback**: 반복된 지시사항, 코딩 원칙 (선호 vs 비선호)
- **project**: 현재 진행 중인 업무, 데드라인, 주요 결정
- **reference**: 외부 리소스 (Linear, Grafana 등)

예시:
```markdown
# memory/feedback_mobile_testing.md
---
name: mobile_testing_approach
description: 모바일 반응형 테스트는 DevTools 반응형 모드 사용 필수
metadata:
  type: feedback
---

DevTools 반응형 모드(Ctrl+Shift+M)로 768px 이상/이하를 나눠 테스트할 것.
크로스브라우저/실제 폰 테스트는 빌드 후 배포 단계에서만.

**Why**: 로컬에서 반복적으로 빠르게 테스트하려면 DevTools가 가장 효율적.

**How to apply**: 모든 반응형 변경 후 빌드 전에 최소 1회 이상 수행.
```

---

## 🐛 알려진 이슈 & 다음 우선순위

### ✅ 해결됨
- 탭 전환 시 화면 흔들림 → 하단 고정 탭바로 해결 (2026-07-12)
- 데스크톱에서 로그인/로그아웃 중복 표시 → 조건부 렌더링으로 해결 (2026-07-12)

### 🔄 향후 고려 사항
1. 추가 breakpoint (480px 태블릿, 360px 초소형폰)
2. 접근성 개선 (키보드 네비게이션, 스크린리더)
3. 성능 최적화 (Code splitting, 이미지 최적화)
4. 배포 자동화 (GitHub Actions)

---

## 🔗 외부 연결

- **GitHub**: https://github.com/scenery67/accountbook
- **Google Cloud Console**: Google OAuth 클라이언트 ID 관리
- **Google Sheets API**: 거래 데이터 저장소

---

## ❓ 자주 묻는 질문

**Q: 왜 완전한 모바일/웹 분리를 안 했나?**  
A: 이 프로젝트 규모에는 오버 엔지니어링. 대신 구조가 크게 달라지는 부분(헤더, 탭바 위치)만 JS 조건부 렌더링으로 충분.

**Q: `useIsMobile()` 대신 CSS `@media`만 쓸 수 없나?**  
A: 가능하지만, 탭바 위치가 상단 ↔ 하단으로 이동하려면 DOM 구조 자체가 달라져야 함 (position: fixed는 document flow 변경 필요). JS 조건부 렌더링이 더 깔끔.

**Q: 새로운 페이지/컴포넌트 추가할 때는?**  
A: 먼저 데스크톱 기준으로 작성, 그 다음 768px 이하 media query 추가. 헤더/탭바처럼 구조 자체가 달라지면 `useIsMobile()` 사용.

**Q: 커밋 메시지는 꼭 한글로?**  
A: 네, 이 프로젝트의 약속. 한국어 사용자 기준이므로 코드 리뷰/히스토리 추적이 명확.

---

## 📞 추가 질문 시

다음 파일들을 먼저 읽어보세요:
- `CLAUDE.md` (이 파일) — 전체 개요
- `memory/MEMORY.md` — 반복 패턴 & 피드백
- `src/App.tsx` (라인 30-50) — 조건부 렌더링 로직
- `src/hooks/useIsMobile.ts` — breakpoint 감지 방식
- `.env.example` — 환경 변수 설정

그 외 구체적인 질문은 코드를 읽거나 `git log`로 커밋 히스토리 추적.

---

**마지막 수정**: 2026-07-14  
**담당**: Claude Code (Claude Haiku 4.5)  
**다음 담당**: codex (인수인계 준비 완료)
