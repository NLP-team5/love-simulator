"""
Love Simulator Backend API

연애 시뮬레이션 게임의 백엔드 서버입니다.
Flask를 사용하여 RESTful API를 제공하며, SQLite 데이터베이스를 사용합니다.

주요 기능:
- 시나리오 및 장면 데이터 관리
- 랭킹 시스템
- CORS 및 Rate Limiting 보안 기능
- 정적 파일 서빙

API 엔드포인트:
- GET /api/scenarios: 모든 시나리오 목록 조회
- GET /api/<scenario>/<scene_id>: 특정 장면 데이터 조회
- GET /api/rankings: 랭킹 목록 조회
- POST /api/rankings: 랭킹 등록

작성자: shinjuyong
라이선스: MIT
"""

import os
import logging
from datetime import datetime, timezone
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask 앱 초기화
app = Flask(__name__, static_folder='../frontend', static_url_path='')

# CORS 설정 - 보안성 개선
if os.environ.get('FLASK_ENV') == 'production':
    # 프로덕션에서는 특정 도메인만 허용
    CORS(app, origins=['https://yourdomain.com'])
else:
    # 개발환경에서는 localhost 허용
    CORS(app, origins=['http://localhost:*', 'http://127.0.0.1:*'])

# 데이터베이스 경로를 절대 경로로 명확하게 지정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
instance_path = os.path.join(BASE_DIR, 'instance')
os.makedirs(instance_path, exist_ok=True)
db_path = os.path.join(instance_path, 'game.db')

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', f'sqlite:///{db_path}')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# 프로덕션 환경에서 보안 경고
if os.environ.get('FLASK_ENV') == 'production' and app.config['SECRET_KEY'] == 'dev-secret-key-change-in-production':
    logger.warning("🚨 SECURITY WARNING: Using default SECRET_KEY in production! Set SECRET_KEY environment variable.")

# Rate limiting 설정 - 개발환경에서는 여유롭게 설정
if os.environ.get('FLASK_ENV') == 'production':
    # 프로덕션에서는 엄격한 제한
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["1000 per day", "200 per hour"],
        storage_uri="memory://"
    )
else:
    # 개발환경에서는 느슨한 제한
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["10000 per day", "1000 per hour"],
        storage_uri="memory://"
    )

# 데이터베이스 초기화
db = SQLAlchemy(app)

# ===== 데이터베이스 모델 =====
class Scenario(db.Model):
    """시나리오 테이블 모델

    각 연애 시뮬레이션 시나리오의 기본 정보를 저장합니다.
    여러 개의 Scene을 가질 수 있는 1:N 관계입니다.
    """
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(500))
    difficulty = db.Column(db.Integer, default=2)
    scenes = db.relationship('Scene', backref='scenario', lazy='dynamic', cascade='all, delete-orphan')

class Scene(db.Model):
    """장면 테이블 모델

    각 시나리오의 개별 장면 데이터를 저장합니다.
    AI 대사, 캐릭터 감정, 이미지 정보 등을 포함하며,
    여러 개의 Choice를 가질 수 있습니다.
    """
    id = db.Column(db.Integer, primary_key=True)
    sceneId = db.Column(db.Integer, nullable=False)
    aiLine = db.Column(db.Text, nullable=False)
    character_mood = db.Column(db.String(50))
    characterImage = db.Column(db.String(100))
    scenario_name = db.Column(db.String(80), db.ForeignKey('scenario.name'), nullable=False, index=True)
    choices = db.relationship('Choice', backref='scene', lazy='select', cascade='all, delete-orphan')
    __table_args__ = (db.Index('idx_scenario_scene', 'scenario_name', 'sceneId'),)

    def to_dict(self):
        return {
            'sceneId': self.sceneId,
            'aiLine': self.aiLine,
            'characterMood': self.character_mood,
            'characterImage': self.characterImage,
            'userCards': [choice.to_dict() for choice in self.choices]
        }

class Choice(db.Model):
    """선택지 테이블 모델

    각 장면에서 플레이어가 선택할 수 있는 옵션들을 저장합니다.
    호감도 변화량과 다음 장면 ID를 포함합니다.
    """
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    nextSceneId = db.Column(db.Integer, nullable=False)
    favorability = db.Column(db.Integer, nullable=False)
    scene_id = db.Column(db.Integer, db.ForeignKey('scene.id'), nullable=False, index=True)

    def to_dict(self):
        return { 'text': self.text, 'nextSceneId': self.nextSceneId, 'favorability': self.favorability }

class Ranking(db.Model):
    """랭킹 테이블 모델

    플레이어들의 게임 결과와 점수를 저장합니다.
    랭킹 시스템과 리더보드 기능을 제공합니다.
    """
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(80), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False, index=True)
    scenario_title = db.Column(db.String(120), nullable=False, index=True)
    play_time = db.Column(db.Integer)
    choices_count = db.Column(db.Integer)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    ip_address = db.Column(db.String(45))

# ===== API 엔드포인트 =====
@app.route('/api/scenarios')
def get_scenarios():
    """모든 시나리오 목록 조회

    Returns:
        JSON: 시나리오 목록 (name, title, description)
    """
    scenarios = Scenario.query.all()
    return jsonify([{'name': s.name, 'title': s.title, 'description': s.description} for s in scenarios])

@app.route('/api/<scenario_name>/<int:scene_id>')
def get_scene(scenario_name, scene_id):
    """특정 장면 데이터 조회

    Args:
        scenario_name (str): 시나리오 이름
        scene_id (int): 장면 ID

    Returns:
        JSON: 장면 데이터 (AI 대사, 선택지 등)

    Raises:
        404: 장면을 찾을 수 없는 경우
    """
    scene_data = Scene.query.filter_by(scenario_name=scenario_name, sceneId=scene_id).options(db.joinedload(Scene.choices)).first()
    if not scene_data:
        abort(404, description="장면을 찾을 수 없습니다.")
    return jsonify(scene_data.to_dict())

@app.route('/api/rankings', methods=['GET'])
def get_rankings():
    """랭킹 목록 조회

    점수 내림차순으로 정렬된 랭킹 목록을 반환합니다.
    최대 100개까지 제한됩니다.

    Returns:
        JSON: 랭킹 목록 (nickname, score, scenario_title)
    """
    rankings = Ranking.query.order_by(Ranking.score.desc(), Ranking.timestamp.asc()).limit(100).all()
    return jsonify([{
        'nickname': r.nickname,
        'score': r.score,
        'scenario_title': r.scenario_title,
    } for r in rankings])

@app.route('/api/rankings', methods=['POST'])
@limiter.limit("50 per minute")
def add_ranking():
    """랭킹 등록

    새로운 랭킹 데이터를 등록합니다.
    Rate Limiting: 분당 5개 요청으로 제한

    Request Body:
        nickname (str): 닉네임 (2-20자)
        score (int): 점수 (0-100)
        scenario_title (str): 시나리오 제목
        play_time (int, optional): 플레이 시간(초)
        choices_count (int, optional): 선택 횟수

    Returns:
        JSON: 등록 성공 메시지와 순위

    Raises:
        400: 유효성 검사 실패
        500: 서버 오류
    """
    try:
        data = request.json
        if not data or not all(k in data for k in ['nickname', 'score', 'scenario_title']):
            abort(400, description="필수 데이터(nickname, score, scenario_title)가 누락되었습니다.")
        
        nickname = data['nickname'].strip()
        if not (2 <= len(nickname) <= 20):
            abort(400, description="닉네임은 2자에서 20자 사이여야 합니다.")

        # 닉네임 유효성 검사 (특수문자 제한)
        import re
        if not re.match(r'^[가-힣a-zA-Z0-9_\s]+$', nickname):
            abort(400, description="닉네임에는 한글, 영문, 숫자, 밑줄, 공백만 사용 가능합니다.")

        # 점수 유효성 검사
        score = int(data['score'])
        if not (0 <= score <= 100):
            abort(400, description="점수는 0과 100 사이여야 합니다.")
        
        new_ranking = Ranking(
            nickname=nickname,
            score=score,
            scenario_title=data['scenario_title'],
            play_time=data.get('play_time'),
            choices_count=data.get('choices_count'),
            ip_address=get_remote_address()
        )
        db.session.add(new_ranking)
        db.session.commit()
        
        rank_count = Ranking.query.filter(Ranking.score > new_ranking.score, Ranking.scenario_title == data['scenario_title']).count() + 1
        
        return jsonify({'message': '랭킹이 등록되었습니다!', 'rank': rank_count}), 201
    except (ValueError, TypeError):
        abort(400, description="잘못된 데이터 형식입니다.")
    except Exception as e:
        db.session.rollback()
        logger.error(f"Ranking submission error: {e}", exc_info=True)
        abort(500)

# ===== 메인 HTML 및 정적 파일 서빙 =====
# Flask 생성자에서 static_folder를 올바르게 지정했으므로,
# Flask가 자동으로 / 경로 요청 시 frontend/index.html 파일을 찾아 제공하고,
# style.css, script.js, images/ 등 다른 모든 정적 파일도 자동으로 처리합니다.
@app.errorhandler(404)
def not_found_error(e):
    """404 에러 핸들러

    API 요청이 아닌 경우 index.html을 반환하여 SPA 라우팅을 지원합니다.
    """
    if not request.path.startswith('/api/'):
        return app.send_static_file('index.html')
    return jsonify(error="Not Found", message="요청한 API 리소스를 찾을 수 없습니다."), 404

@app.errorhandler(Exception)
def handle_error(e):
    if isinstance(e, HTTPException):
        return jsonify(error=e.name, message=e.description), e.code
    
    logger.error(f"Unexpected error: {str(e)}", exc_info=True)
    return jsonify(error="Internal Server Error", message="서버 내부 오류가 발생했습니다."), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='127.0.0.1', port=8000, debug=True)