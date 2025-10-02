# 개발 가이드

## 🛠 개발 환경 설정

### 1. 필수 요구사항
- Python 3.8 이상
- 웹 브라우저 (Chrome, Firefox, Safari, Edge)

### 2. 프로젝트 설정
```bash
# 저장소 클론
git clone <repository-url>
cd love-simulator

# Python 가상환경 생성
cd backend
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 의존성 설치
pip install -r ../requirements.txt

# 데이터베이스 초기화
python seed.py

# 개발 서버 실행
python app.py
```

### 3. 개발 서버 접속
- 서버: http://localhost:8000
- API: http://localhost:8000/api

## 📁 프로젝트 구조

```
love-simulator/
├── frontend/                 # 프론트엔드 (Vanilla JS)
│   ├── index.html           # 메인 HTML 파일
│   ├── style.css            # 스타일시트
│   ├── script.js            # 메인 게임 로직
│   ├── achievements.js      # 업적 시스템
│   ├── animations.js        # 애니메이션 효과
│   └── advancedGameSystem.js # 고급 기능들
├── backend/                 # 백엔드 (Flask)
│   ├── app.py              # Flask 애플리케이션
│   ├── seed.py             # 데이터베이스 초기화
│   └── instance/           # SQLite 데이터베이스 저장소
├── data/                   # 게임 시나리오 데이터
│   ├── female-friend.json  # 여사친 시나리오
│   ├── male-friend.json    # 남사친 시나리오
│   └── teacher.json        # 선생님 시나리오
└── docs/                   # 문서
```

## 🎮 게임 시스템

### 핵심 컴포넌트
1. **GameState**: 게임 상태 관리
2. **DOM**: DOM 요소 캐싱 및 관리
3. **CONFIG**: 설정 상수들
4. **AchievementSystem**: 업적 시스템
5. **AnimationSystem**: 애니메이션 효과
6. **SoundManager**: 사운드 관리

### 데이터 플로우
1. 사용자가 시나리오 선택
2. `initializeGame()` 호출로 게임 시작
3. `fetchNextScene()` → API 호출 → 장면 데이터 받기
4. `updateScene()` → UI 업데이트
5. 사용자 선택 → `selectChoice()` → 호감도 업데이트
6. 다음 장면으로 이동 또는 게임 종료

## 🔧 새 시나리오 추가하기

### 1. JSON 파일 생성
`data/` 폴더에 새 시나리오 JSON 파일 생성:

```json
{
  "scenarioTitle": "새 시나리오 제목",
  "scenarioDescription": "시나리오 설명",
  "difficulty": 3,
  "scenes": [
    {
      "sceneId": 1,
      "aiLine": "AI 대사",
      "characterMood": "감정상태",
      "characterImage": "images/character.png",
      "userCards": [
        {
          "cardId": "1A",
          "text": "선택지 텍스트",
          "nextSceneId": 2,
          "favorability": 10
        }
      ]
    }
  ]
}
```

### 2. seed.py 업데이트
새 시나리오를 데이터베이스에 추가하도록 `seed.py` 수정

### 3. 프론트엔드 업데이트
- `index.html`에 새 시나리오 카드 추가
- `script.js`의 `scenarioTitles`, `characterNames` 업데이트

## 🎨 UI 컴포넌트 수정

### CSS 변수 사용
모든 색상과 스타일은 CSS 변수로 관리:
```css
:root {
    --primary-color: #FF6B9D;
    --secondary-color: #C66FBC;
    --background-color: #F8F9FA;
}
```

### 반응형 디자인
- 모바일 우선 설계
- 최대 너비 450px로 제한
- CSS Grid와 Flexbox 활용

## 🔌 API 엔드포인트

### GET /api/scenarios
시나리오 목록 조회
```json
[
  {
    "name": "female-friend",
    "title": "여사친 시나리오",
    "description": "설명"
  }
]
```

### GET /api/{scenario}/{scene_id}
특정 장면 데이터 조회
```json
{
  "sceneId": 1,
  "aiLine": "대사",
  "characterMood": "감정",
  "characterImage": "이미지 경로",
  "userCards": [...]
}
```

### GET /api/rankings
랭킹 조회
```json
[
  {
    "nickname": "플레이어",
    "score": 85,
    "scenario_title": "시나리오명"
  }
]
```

### POST /api/rankings
랭킹 등록
```json
{
  "nickname": "플레이어",
  "score": 85,
  "scenario_title": "시나리오명",
  "play_time": 300,
  "choices_count": 10
}
```

## 🧪 테스트

### 브라우저 테스트
- Chrome DevTools 사용
- Console에서 `window.DEBUG` 객체로 디버깅
- Network 탭으로 API 요청 확인

### 데이터베이스 확인
```bash
sqlite3 backend/instance/game.db
.tables
.schema ranking
SELECT * FROM ranking LIMIT 5;
```

## 🚀 배포

### 프로덕션 환경 변수
```bash
export FLASK_ENV=production
export SECRET_KEY=your-strong-secret-key
export DATABASE_URL=your-database-url
```

### 정적 파일 서빙
프로덕션에서는 Nginx나 Apache로 정적 파일 서빙 권장

## 🐛 디버깅 팁

### 1. JavaScript 콘솔 명령어
```javascript
// 게임 상태 확인
console.log(GameState);

// 호감도 설정 (디버그 모드)
window.DEBUG.setFavorability(80);

// 결과 화면으로 이동
window.DEBUG.skipToEnd();
```

### 2. Flask 로그 확인
```bash
tail -f backend/app.log
```

### 3. 일반적인 문제들
- **CORS 오류**: 백엔드 서버가 실행 중인지 확인
- **404 오류**: API 엔드포인트 URL 확인
- **데이터베이스 오류**: `seed.py` 재실행

## 📝 코드 스타일

### JavaScript
- ES6+ 문법 사용
- async/await 선호
- 명확한 함수명 사용
- 주석은 필요한 경우에만

### Python
- PEP 8 스타일 가이드 준수
- Type hints 사용 권장
- 에러 처리 철저히

### CSS
- CSS 변수 활용
- 모바일 우선 반응형
- BEM 방법론 부분 적용

## 🤝 기여하기

1. 새 브랜치 생성: `git checkout -b feature/new-feature`
2. 변경사항 커밋: `git commit -m 'Add new feature'`
3. 브랜치 푸시: `git push origin feature/new-feature`
4. Pull Request 생성

## 📞 문제 해결

이슈가 있다면 GitHub Issues에 등록해 주세요:
- 버그 리포트
- 기능 요청
- 개선 제안