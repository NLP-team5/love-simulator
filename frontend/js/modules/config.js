/**
 * 애플리케이션 설정 모듈
 *
 * 모든 설정값을 중앙에서 관리하며, 환경별로 다른 설정을 제공합니다.
 *
 * @module Config
 * @author shinjuyong
 * @version 1.0.0
 */

/**
 * 현재 환경을 감지하는 함수
 * @returns {string} 환경 타입 ('development' | 'production')
 */
const getEnvironment = () => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' ? 'development' : 'production';
};

/**
 * 애플리케이션 전역 설정
 * @namespace CONFIG
 */
export const CONFIG = {
    // 환경 설정
    ENVIRONMENT: getEnvironment(),

    // API 설정
    API: {
        BASE_URL: getEnvironment() === 'development'
            ? `http://${window.location.hostname}:8000`
            : window.location.origin,
        TIMEOUT: 10000, // 10초
        RETRY_ATTEMPTS: 3,
        ENDPOINTS: {
            SCENARIOS: '/api/scenarios',
            SCENE: '/api/{scenario}/{sceneId}',
            RANKINGS: '/api/rankings'
        }
    },

    // UI 설정
    UI: {
        TYPEWRITER_SPEED: 50,
        ANIMATION_DELAY: 300,
        TOAST_DURATION: 3000,
        MODAL_ANIMATION_DURATION: 300
    },

    // 게임 설정
    GAME: {
        AUTO_SAVE_INTERVAL: 24 * 60 * 60 * 1000, // 24시간
        SAVE_KEY: 'loveSimulatorSave',
        MAX_SAVE_SLOTS: 3,

        // 호감도 임계값
        FAVORABILITY_THRESHOLDS: {
            GAME_OVER: 30,
            PERFECT_ENDING: 70,
            GOOD_ENDING: 60,
            NEUTRAL_ENDING: 40
        },

        // 특수 장면 ID
        SCENE_IDS: {
            GAME_OVER: 99,
            PERFECT_ENDING: 31,
            BAD_ENDING: 100,
            DECISIVE_MOMENT: 999
        }
    },

    // 유효성 검사
    VALIDATION: {
        NICKNAME: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 20,
            PATTERN: /^[가-힣a-zA-Z0-9_\s]+$/
        }
    },

    // 오디오 설정
    AUDIO: {
        DEFAULT_VOLUME: {
            BGM: 0.3,
            SFX: 0.8,
            SUCCESS: 0.7
        },
        FADE_DURATION: 1000
    },

    // 시나리오 메타데이터
    SCENARIOS: {
        'female-friend': {
            title: '여사친에게 다가가기',
            character: '수진',
            difficulty: 3,
            description: '친구에서 연인으로 발전하는 세심한 관계 시뮬레이션'
        },
        'male-friend': {
            title: '남사친에게 다가가기',
            character: '준호',
            difficulty: 3,
            description: '남성 친구와의 관계 발전 스토리'
        },
        'teacher': {
            title: '김민수 선생님의 최애가 되기',
            character: '김민수 선생님',
            difficulty: 3,
            description: 'NLP반 천재 강사님의 마음을 사로잡는 여정'
        }
    },

    // 성능 설정
    PERFORMANCE: {
        IMAGE_LAZY_LOADING: true,
        DEBOUNCE_DELAY: 300,
        THROTTLE_DELAY: 100
    },

    // 디버그 설정
    DEBUG: {
        ENABLED: getEnvironment() === 'development',
        LOG_LEVEL: getEnvironment() === 'development' ? 'DEBUG' : 'ERROR',
        SHOW_PERFORMANCE_METRICS: getEnvironment() === 'development'
    }
};

/**
 * 환경별 설정 오버라이드
 */
if (CONFIG.ENVIRONMENT === 'production') {
    // 프로덕션 환경에서는 더 엄격한 설정
    CONFIG.API.TIMEOUT = 5000;
    CONFIG.UI.TYPEWRITER_SPEED = 30; // 더 빠른 타이핑
    CONFIG.GAME.AUTO_SAVE_INTERVAL = 12 * 60 * 60 * 1000; // 12시간
}

export default CONFIG;