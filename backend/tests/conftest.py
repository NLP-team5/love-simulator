"""
Pytest configuration and fixtures for Love Simulator tests
"""

import os
import sys

import pytest

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import Choice, Scenario, Scene
from app import app as flask_app
from app import db


@pytest.fixture
def app():
    """Create and configure a test instance of the app."""
    flask_app.config.update(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        }
    )

    with flask_app.app_context():
        db.create_all()

        # Seed test data
        scenarios = [
            Scenario(
                name="female-friend",
                title="친구에서 연인으로 (여사친)",
                description="실제 데이터를 기반으로 재구성된 10단계의 깊이 있는 관계 발전 시뮬레이션입니다.",
            ),
            Scenario(
                name="male-friend",
                title="친구에서 연인으로 (남사친)",
                description="실제 데이터를 기반으로 재구성된 10단계의 깊이 있는 관계 발전 시뮬레이션입니다.",
            ),
            Scenario(
                name="teacher",
                title="NLP반 김민수 강사님",
                description="데이터와 포켓몬을 사랑하는 괴짜 천재, 김민수 강사님의 최애 제자가 되기 위한 여정.",
            ),
        ]
        db.session.add_all(scenarios)

        # Add test scenes
        scene1 = Scene(
            sceneId=1,
            aiLine="Test scene",
            character_mood="happy",
            characterImage="test.png",
            scenario=scenarios[0],
        )
        choice1 = Choice(text="Choice 1", nextSceneId=2, favorability=10, scene=scene1)
        choice2 = Choice(text="Choice 2", nextSceneId=3, favorability=5, scene=scene1)
        choice3 = Choice(text="Choice 3", nextSceneId=4, favorability=0, scene=scene1)
        db.session.add_all([scene1, choice1, choice2, choice3])

        scene2 = Scene(
            sceneId=1,
            aiLine="Test scene",
            character_mood="happy",
            characterImage="test.png",
            scenario=scenarios[1],
        )
        db.session.add(scene2)

        scene3 = Scene(
            sceneId=1,
            aiLine="Test scene",
            character_mood="happy",
            characterImage="test.png",
            scenario=scenarios[2],
        )
        db.session.add(scene3)

        db.session.commit()

        yield flask_app
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()
