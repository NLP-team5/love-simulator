/**
 * 게임 상태 관리 모듈
 *
 * 중앙화된 상태 관리와 상태 변경 이벤트를 제공합니다.
 * Observer 패턴을 사용하여 상태 변경을 감지하고 반응합니다.
 *
 * @module GameState
 * @author shinjuyong
 * @version 1.0.0
 */

import { CONFIG } from './config.js';

/**
 * 게임 상태 관리 클래스
 * @class GameStateManager
 */
class GameStateManager {
    constructor() {
        this.state = this.getInitialState();
        this.listeners = new Map();
        this.history = [];
        this.maxHistorySize = 50;
    }

    /**
     * 초기 상태 반환
     * @returns {Object} 초기 게임 상태
     */
    getInitialState() {
        return {
            // 게임 진행 상태
            currentScenario: null,
            currentSceneId: 1,
            favorability: 50,

            // 플레이 기록
            playHistory: [],
            gameStartTime: null,

            // UI 상태
            isPaused: false,
            currentScreen: 'start',
            isLoading: false,

            // 설정
            settings: {
                soundEnabled: true,
                musicVolume: CONFIG.AUDIO.DEFAULT_VOLUME.BGM,
                sfxVolume: CONFIG.AUDIO.DEFAULT_VOLUME.SFX,
                textSpeed: CONFIG.UI.TYPEWRITER_SPEED,
                autoSave: true
            },

            // 통계
            statistics: {
                totalPlayTime: 0,
                scenariosCompleted: [],
                highestScore: 0,
                totalChoicesMade: 0
            }
        };
    }

    /**
     * 상태 변경 리스너 등록
     * @param {string} key - 감지할 상태 키
     * @param {Function} callback - 변경 시 호출될 콜백 함수
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    /**
     * 상태 변경 리스너 제거
     * @param {string} key - 상태 키
     * @param {Function} callback - 제거할 콜백 함수
     */
    unsubscribe(key, callback) {
        if (this.listeners.has(key)) {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 상태 변경 알림
     * @private
     * @param {string} key - 변경된 상태 키
     * @param {*} newValue - 새로운 값
     * @param {*} oldValue - 이전 값
     */
    notify(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state listener for ${key}:`, error);
                }
            });
        }
    }

    /**
     * 상태 값 조회
     * @param {string} key - 조회할 상태 키 (점 표기법 지원)
     * @returns {*} 상태 값
     */
    get(key) {
        return this.getNestedValue(this.state, key);
    }

    /**
     * 상태 값 설정
     * @param {string} key - 설정할 상태 키
     * @param {*} value - 설정할 값
     */
    set(key, value) {
        const oldValue = this.get(key);
        this.setNestedValue(this.state, key, value);

        // 히스토리 기록
        this.addToHistory(key, value, oldValue);

        // 리스너들에게 알림
        this.notify(key, value, oldValue);
        this.notify('*', { key, value, oldValue }, null); // 전체 변경 이벤트
    }

    /**
     * 상태 일괄 업데이트
     * @param {Object} updates - 업데이트할 상태들
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * 중첩된 객체에서 값 조회
     * @private
     * @param {Object} obj - 대상 객체
     * @param {string} path - 경로 (점 표기법)
     * @returns {*} 조회된 값
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * 중첩된 객체에 값 설정
     * @private
     * @param {Object} obj - 대상 객체
     * @param {string} path - 경로 (점 표기법)
     * @param {*} value - 설정할 값
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    /**
     * 히스토리에 변경사항 추가
     * @private
     * @param {string} key - 변경된 키
     * @param {*} newValue - 새 값
     * @param {*} oldValue - 이전 값
     */
    addToHistory(key, newValue, oldValue) {
        this.history.push({
            timestamp: Date.now(),
            key,
            newValue,
            oldValue
        });

        // 히스토리 크기 제한
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 게임 상태 초기화
     */
    reset() {
        const oldState = { ...this.state };
        this.state = this.getInitialState();
        this.history = [];
        this.notify('*', this.state, oldState);
    }

    /**
     * 상태를 로컬 스토리지에 저장
     */
    save() {
        try {
            const saveData = {
                state: this.state,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            localStorage.setItem(CONFIG.GAME.SAVE_KEY, JSON.stringify(saveData));
        } catch (error) {
            console.error('게임 저장 실패:', error);
        }
    }

    /**
     * 로컬 스토리지에서 상태 불러오기
     * @returns {boolean} 불러오기 성공 여부
     */
    load() {
        try {
            const savedData = localStorage.getItem(CONFIG.GAME.SAVE_KEY);
            if (!savedData) return false;

            const { state, timestamp, version } = JSON.parse(savedData);

            // 버전 호환성 검사
            if (version !== '1.0.0') {
                console.warn('저장된 데이터의 버전이 다릅니다.');
                return false;
            }

            // 24시간 이내 데이터만 유효
            if (Date.now() - timestamp > CONFIG.GAME.AUTO_SAVE_INTERVAL) {
                return false;
            }

            const oldState = { ...this.state };
            this.state = { ...this.getInitialState(), ...state };
            this.notify('*', this.state, oldState);
            return true;
        } catch (error) {
            console.error('게임 불러오기 실패:', error);
            return false;
        }
    }

    /**
     * 디버그 정보 출력
     */
    debug() {
        if (CONFIG.DEBUG.ENABLED) {
            console.group('🎮 Game State Debug');
            console.log('Current State:', this.state);
            console.log('History:', this.history.slice(-10)); // 최근 10개
            console.log('Listeners:', Array.from(this.listeners.keys()));
            console.groupEnd();
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const gameState = new GameStateManager();

// 전역 디버그 접근 (개발 환경에서만)
if (CONFIG.DEBUG.ENABLED) {
    window.gameState = gameState;
}

export default gameState;