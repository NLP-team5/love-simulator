# 💖 Love Simulator

[![Made with Python](https://img.shields.io/badge/Made%20with-Python-1f425f.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-blue.svg)](https://flask.palletsprojects.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**인터랙티브 연애 시뮬레이션 게임** - 다양한 시나리오를 통해 선택이 관계에 미치는 영향을 체험해보세요!

## ✨ 주요 특징

- **3가지 독립적인 스토리라인**: 여사친, 남사친, 선생님 시나리오
- **실시간 호감도 시스템**: 선택에 따른 즉각적인 시각적 피드백
- **글로벌 랭킹 시스템**: 다른 플레이어들과 점수 경쟁
- **업적 시스템**: 숨겨진 도전 과제들 발견
- **부드러운 애니메이션**: 몰입감 있는 UI/UX 경험
- **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 🛠 기술 스택

### Frontend
- **Core**: HTML5, CSS3, Vanilla JavaScript
- **Architecture**: 단일 JavaScript 클래스 기반 구조 (SimpleLoveSimulator)
- **Design**: 반응형 디자인 (CSS Grid, Flexbox)
- **Audio**: Web Audio API를 활용한 사운드 시스템
- **Accessibility**: ARIA 레이블, 스크린 리더 지원

### Backend
- **Framework**: Python Flask 3.0+
- **Database**: SQLAlchemy ORM with SQLite/PostgreSQL
- **Security**: Flask-CORS, Flask-Limiter, Rate Limiting
- **API**: RESTful API with comprehensive error handling
- **Monitoring**: 헬스체크, 로깅, 성능 모니터링

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions (자동 테스트, 빌드, 배포)
- **Security**: Vulnerability scanning, Code quality checks
- **Monitoring**: Health checks, Uptime monitoring
- **Reverse Proxy**: Nginx with SSL termination

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd love-simulator
```

### 2. Python 가상환경 설정
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 서버 실행
```bash
python app.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

### 5. 프론트엔드 접속
브라우저에서 `http://localhost:8000`로 접속하면 게임을 플레이할 수 있습니다.

## 📁 프로젝트 구조

```
love-simulator/
├── frontend/               # 웹 프론트엔드
│   ├── index.html            # 메인 HTML
│   ├── style.css             # CSS 스타일시트
│   ├── simple-app.js         # 게임 로직 (메인 JavaScript)
│   ├── manifest.json         # PWA 매니페스트
│   ├── sounds/               # 음향 파일
│   │   ├── bgm.mp3          # 배경음악
│   │   ├── select.mp3       # 선택 효과음
│   │   └── success.mp3      # 성공 음악
│   └── images/              # 게임 이미지 파일들
│       ├── female_friend_*.png
│       ├── male_friend_*.png
│       └── teacher_*.png
├── backend/               # Flask 백엔드 서버
│   ├── app.py               # 메인 서버 애플리케이션
│   ├── requirements.txt     # Python 의존성
│   └── instance/           # SQLite 데이터베이스 (자동 생성)
├── data/                 # 게임 시나리오 데이터
│   ├── female-friend.json
│   ├── male-friend.json
│   └── teacher.json
└── 설정 파일들
    ├── README.md           # 프로젝트 문서
    ├── DEVELOPMENT.md      # 개발 가이드
    ├── LICENSE            # 라이선스
    └── .gitignore        # Git 무시 파일
```

## 🎯 게임 플레이

1. **시나리오 선택**: 메인 화면에서 원하는 시나리오를 선택
2. **대화 진행**: AI 캐릭터와의 대화에서 선택지를 고름
3. **호감도 관리**: 선택에 따라 호감도가 변화
4. **엔딩 확인**: 최종 점수와 결과 분석 확인
5. **랭킹 등록**: 닉네임을 입력하여 랭킹에 등록

## 🏆 업적 시스템

- **첫 만남**: 첫 게임 시작
- **완벽한 사랑**: 호감도 100 달성
- **연애 고수**: 80점 이상 달성
- **탐험가**: 모든 시나리오 플레이
- 그 외 다양한 숨겨진 업적들...

## ⚡ 성능 최적화 권장사항

### 이미지 최적화
현재 캐릭터 이미지 파일들이 1.6MB+ 크기입니다. 프로덕션 배포 시 다음 최적화를 권장합니다:

```bash
# WebP 형식으로 변환 (약 70% 크기 감소)
cwebp -q 80 image.png -o image.webp

# 또는 PNG 최적화
pngquant --quality=65-80 image.png
```

### 프로덕션 배포 체크리스트
- [ ] 환경변수 `SECRET_KEY` 설정 (보안)
- [ ] `FLASK_ENV=production` 설정
- [ ] 이미지 파일 최적화
- [ ] CDN 적용 고려
- [ ] 데이터베이스 백업 전략 수립

## 🔧 개발 정보

### API 엔드포인트
- `GET /api/scenarios` - 시나리오 목록 조회
- `GET /api/<scenario>/<scene_id>` - 특정 장면 조회
- `GET /api/rankings` - 랭킹 조회
- `POST /api/rankings` - 랭킹 등록

## 🚀 배포

### Docker를 사용한 간편 배포

```bash
# 1. 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 프로덕션 설정 적용

# 2. Docker Compose로 실행
docker-compose up -d

# 3. Nginx 프록시와 함께 실행 (프로덕션)
docker-compose --profile production up -d
```

### 수동 배포

```bash
# 1. Docker 이미지 빌드
docker build -t love-simulator .

# 2. 컨테이너 실행
docker run -d \
  --name love-simulator \
  -p 8000:8000 \
  --env-file .env \
  --restart unless-stopped \
  love-simulator
```

### 환경변수 설정
프로덕션 배포 시 반드시 설정해야 할 환경변수:
- `SECRET_KEY`: Flask 비밀 키 (필수, 32자 이상)
- `DATABASE_URL`: 데이터베이스 URL
- `FLASK_ENV`: production (보안 강화)
- `ALLOWED_ORIGINS`: CORS 허용 도메인
- `LOG_LEVEL`: 로그 레벨 (INFO/WARNING/ERROR)

## 📝 라이선스

이 프로젝트는 개인 학습 목적으로 제작되었습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 개발팀

### 🏆 Core Team
- **신주용** ([@kimddong23](https://github.com/kimddong23)) - PM & Full-stack Developer
- **김현웅** ([@KimHW1999](https://github.com/KimHW1999)) - Data Engineer & AI Specialist
- **김남현** ([@KIMNAMHYEON](https://github.com/KIMNAMHYEON)) - Data Collector & Visual Designer
- **김동준** ([@djun604](https://github.com/djun604)) - Data Collector & Sound Designer

자세한 기여 내역은 [AUTHORS.md](./AUTHORS.md)를 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해 주세요.