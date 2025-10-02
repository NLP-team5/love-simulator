/**
 * 게임 엔진 모듈
 *
 * 게임의 핵심 로직과 상태 관리를 담당합니다.
 * 모든 게임 플레이 관련 기능을 중앙에서 관리합니다.
 *
 * @module GameEngine
 * @author shinjuyong
 * @version 1.0.0
 */

import { CONFIG } from './config.js';
import { gameState } from './gameState.js';
import { apiClient } from './apiClient.js';
import { EventUtils } from '../utils/dom.js';

/**
 * 게임 엔진 클래스
 * @class GameEngine
 */
class GameEngine {
    constructor() {
        this.isInitialized = false;
        this.eventEmitter = new EventTarget();
        this.setupEventListeners();
    }

    /**
     * 게임 엔진 초기화
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // 저장된 게임 상태 불러오기
            gameState.load();

            // 이벤트 리스너 설정
            this.setupGameStateListeners();

            this.isInitialized = true;
            this.emit('initialized');

            if (CONFIG.DEBUG.ENABLED) {
                console.log('🎮 Game Engine initialized');
            }
        } catch (error) {
            console.error('게임 엔진 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 새 게임 시작
     * @param {string} scenarioName - 시나리오 이름
     * @returns {Promise<void>}
     */
    async startNewGame(scenarioName) {
        try {
            this.emit('gameStarting', { scenario: scenarioName });

            // 게임 상태 초기화
            gameState.update({
                currentScenario: scenarioName,
                currentSceneId: 1,
                favorability: 50,
                playHistory: [],
                gameStartTime: Date.now(),
                isPaused: false,
                currentScreen: 'game'
            });

            // 첫 번째 장면 로드
            await this.loadScene(1);

            this.emit('gameStarted', { scenario: scenarioName });

            // 자동 저장 시작
            this.startAutoSave();

        } catch (error) {
            console.error('게임 시작 실패:', error);
            this.emit('error', { type: 'gameStart', error });
            throw error;
        }
    }

    /**
     * 장면 로드
     * @param {number} sceneId - 장면 ID
     * @returns {Promise<Object|null>} 장면 데이터
     */
    async loadScene(sceneId) {
        try {
            const scenario = gameState.get('currentScenario');
            if (!scenario) {
                throw new Error('시나리오가 선택되지 않았습니다.');
            }

            this.emit('sceneLoading', { sceneId, scenario });

            const sceneData = await apiClient.getScene(scenario, sceneId);

            if (!sceneData) {
                // 장면이 없으면 게임 종료
                await this.endGame();
                return null;
            }

            // 현재 장면 ID 업데이트
            gameState.set('currentSceneId', sceneId);

            this.emit('sceneLoaded', { sceneId, sceneData });
            return sceneData;

        } catch (error) {
            console.error('장면 로드 실패:', error);
            this.emit('error', { type: 'sceneLoad', error, sceneId });
            throw error;
        }
    }

    /**
     * 선택지 처리
     * @param {Object} choice - 선택된 선택지 데이터
     * @param {string} choice.text - 선택지 텍스트
     * @param {number} choice.favorability - 호감도 변화량
     * @param {number} choice.nextSceneId - 다음 장면 ID
     * @returns {Promise<void>}
     */
    async makeChoice(choice) {
        try {
            this.emit('choiceMaking', { choice });

            // 선택 기록 추가
            const currentSceneId = gameState.get('currentSceneId');
            const playHistory = gameState.get('playHistory');

            playHistory.push({
                sceneId: currentSceneId,
                text: choice.text,
                favorability: choice.favorability,
                timestamp: Date.now()
            });

            gameState.set('playHistory', playHistory);

            // 호감도 업데이트
            await this.updateFavorability(choice.favorability);

            this.emit('choiceMade', { choice });

            // 게임 진행 조건 확인
            const nextSceneId = this.determineNextScene(choice);
            if (nextSceneId) {
                // 다음 장면으로 이동
                setTimeout(async () => {
                    await this.loadScene(nextSceneId);
                }, 1000); // 1초 딜레이
            }

        } catch (error) {
            console.error('선택지 처리 실패:', error);
            this.emit('error', { type: 'choice', error, choice });
            throw error;
        }
    }

    /**
     * 다음 장면 ID 결정
     * @param {Object} choice - 선택지 데이터
     * @returns {number|null} 다음 장면 ID
     */
    determineNextScene(choice) {
        const favorability = gameState.get('favorability');

        // 호감도가 너무 낮으면 게임오버
        if (favorability < CONFIG.GAME.FAVORABILITY_THRESHOLDS.GAME_OVER) {
            return CONFIG.GAME.SCENE_IDS.GAME_OVER;
        }

        // 결정적 순간 분기점
        if (choice.nextSceneId === CONFIG.GAME.SCENE_IDS.DECISIVE_MOMENT) {
            return favorability >= CONFIG.GAME.FAVORABILITY_THRESHOLDS.PERFECT_ENDING
                ? CONFIG.GAME.SCENE_IDS.PERFECT_ENDING
                : CONFIG.GAME.SCENE_IDS.BAD_ENDING;
        }

        return choice.nextSceneId;
    }

    /**
     * 호감도 업데이트
     * @param {number} change - 호감도 변화량
     * @returns {Promise<void>}
     */
    async updateFavorability(change) {
        const currentFavorability = gameState.get('favorability');
        const newFavorability = Math.max(0, Math.min(100, currentFavorability + change));

        gameState.set('favorability', newFavorability);

        this.emit('favorabilityChanged', {
            old: currentFavorability,
            new: newFavorability,
            change
        });

        // 업적 확인
        this.checkAchievements(newFavorability);
    }

    /**
     * 업적 확인
     * @param {number} favorability - 현재 호감도
     */
    checkAchievements(favorability) {
        const achievements = [];

        if (favorability >= 100) {
            achievements.push('perfect_love');
        } else if (favorability >= 80) {
            achievements.push('love_master');
        }

        const playHistory = gameState.get('playHistory');
        if (playHistory.length === 1) {
            achievements.push('first_choice');
        }

        if (achievements.length > 0) {
            this.emit('achievementsUnlocked', { achievements });
        }
    }

    /**
     * 게임 종료
     * @returns {Promise<Object>} 게임 결과
     */
    async endGame() {
        try {
            this.emit('gameEnding');

            // 자동 저장 중지
            this.stopAutoSave();

            // 게임 결과 계산
            const result = this.calculateGameResult();

            // 통계 업데이트
            this.updateStatistics(result);

            // 화면 전환
            gameState.set('currentScreen', 'result');

            this.emit('gameEnded', { result });
            return result;

        } catch (error) {
            console.error('게임 종료 실패:', error);
            this.emit('error', { type: 'gameEnd', error });
            throw error;
        }
    }

    /**
     * 게임 결과 계산
     * @returns {Object} 게임 결과
     */
    calculateGameResult() {
        const favorability = gameState.get('favorability');
        const playHistory = gameState.get('playHistory');
        const gameStartTime = gameState.get('gameStartTime');
        const scenario = gameState.get('currentScenario');

        // 플레이 시간 계산
        const playTime = Math.floor((Date.now() - gameStartTime) / 1000);

        // 최고/최악 선택 분석
        const positiveChoices = playHistory.filter(choice => choice.favorability > 0);
        const negativeChoices = playHistory.filter(choice => choice.favorability < 0);

        const bestChoice = positiveChoices.length > 0
            ? positiveChoices.reduce((prev, current) =>
                prev.favorability > current.favorability ? prev : current)
            : null;

        const worstChoice = negativeChoices.length > 0
            ? negativeChoices.reduce((prev, current) =>
                prev.favorability < current.favorability ? prev : current)
            : null;

        // 결과 등급 결정
        let title, advice;
        if (favorability >= CONFIG.GAME.FAVORABILITY_THRESHOLDS.PERFECT_ENDING) {
            title = '💖 완벽한 엔딩! 💖';
            advice = '당신은 진정한 연애의 신! 상대방의 마음을 완벽하게 사로잡았습니다.';
        } else if (favorability >= CONFIG.GAME.FAVORABILITY_THRESHOLDS.GOOD_ENDING) {
            title = '💚 해피 엔딩! 💚';
            advice = '좋은 관계를 만들었네요! 조금만 더 노력하면 완벽한 관계가 될 수 있을 거예요.';
        } else if (favorability >= CONFIG.GAME.FAVORABILITY_THRESHOLDS.NEUTRAL_ENDING) {
            title = '💛 애매한 엔딩 💛';
            advice = '친구 이상 연인 미만의 관계네요. 상대방의 마음을 더 잘 이해하려고 노력해보세요.';
        } else {
            title = '💔 아쉬운 엔딩 💔';
            advice = '관계 개선이 필요해요. 상대방의 입장에서 생각해보고 다시 도전해보세요!';
        }

        return {
            score: favorability,
            title,
            advice,
            bestChoice,
            worstChoice,
            playTime,
            choicesCount: playHistory.length,
            scenario: CONFIG.SCENARIOS[scenario]?.title || scenario
        };
    }

    /**
     * 통계 업데이트
     * @param {Object} result - 게임 결과
     */
    updateStatistics(result) {
        const stats = gameState.get('statistics');
        const scenario = gameState.get('currentScenario');

        stats.totalPlayTime += result.playTime;
        stats.highestScore = Math.max(stats.highestScore, result.score);
        stats.totalChoicesMade += result.choicesCount;

        if (!stats.scenariosCompleted.includes(scenario)) {
            stats.scenariosCompleted.push(scenario);
        }

        gameState.set('statistics', stats);
    }

    /**
     * 랭킹 제출
     * @param {string} nickname - 닉네임
     * @returns {Promise<Object>} 제출 결과
     */
    async submitRanking(nickname) {
        try {
            const favorability = gameState.get('favorability');
            const playHistory = gameState.get('playHistory');
            const gameStartTime = gameState.get('gameStartTime');
            const scenario = gameState.get('currentScenario');

            const rankingData = {
                nickname,
                score: favorability,
                scenario_title: CONFIG.SCENARIOS[scenario]?.title || scenario,
                play_time: Math.floor((Date.now() - gameStartTime) / 1000),
                choices_count: playHistory.length
            };

            const result = await apiClient.submitRanking(rankingData);
            this.emit('rankingSubmitted', { result, rankingData });
            return result;

        } catch (error) {
            console.error('랭킹 제출 실패:', error);
            this.emit('error', { type: 'ranking', error });
            throw error;
        }
    }

    /**
     * 게임 일시정지
     */
    pauseGame() {
        gameState.set('isPaused', true);
        this.emit('gamePaused');
    }

    /**
     * 게임 재개
     */
    resumeGame() {
        gameState.set('isPaused', false);
        this.emit('gameResumed');
    }

    /**
     * 게임 상태 리셋
     */
    resetGame() {
        this.stopAutoSave();
        gameState.reset();
        this.emit('gameReset');
    }

    /**
     * 자동 저장 시작
     * @private
     */
    startAutoSave() {
        this.stopAutoSave(); // 기존 타이머 제거

        if (gameState.get('settings.autoSave')) {
            this.autoSaveInterval = setInterval(() => {
                gameState.save();
                if (CONFIG.DEBUG.ENABLED) {
                    console.log('🔄 Auto-saved game state');
                }
            }, 30000); // 30초마다 자동 저장
        }
    }

    /**
     * 자동 저장 중지
     * @private
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    /**
     * 게임 상태 이벤트 리스너 설정
     * @private
     */
    setupGameStateListeners() {
        // 호감도 변경 시 자동 저장
        gameState.subscribe('favorability', () => {
            gameState.save();
        });

        // 화면 전환 시 이벤트 발생
        gameState.subscribe('currentScreen', (newScreen) => {
            this.emit('screenChanged', { screen: newScreen });
        });
    }

    /**
     * 기본 이벤트 리스너 설정
     * @private
     */
    setupEventListeners() {
        // 브라우저 종료 시 자동 저장
        window.addEventListener('beforeunload', () => {
            gameState.save();
        });

        // 페이지 가시성 변경 시 처리
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
    }

    /**
     * 이벤트 발생
     * @private
     * @param {string} eventName - 이벤트 이름
     * @param {*} data - 이벤트 데이터
     */
    emit(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        this.eventEmitter.dispatchEvent(event);

        if (CONFIG.DEBUG.ENABLED) {
            console.log(`🎮 Game Event: ${eventName}`, data);
        }
    }

    /**
     * 이벤트 리스너 등록
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    on(eventName, callback) {
        this.eventEmitter.addEventListener(eventName, callback);
    }

    /**
     * 이벤트 리스너 제거
     * @param {string} eventName - 이벤트 이름
     * @param {Function} callback - 콜백 함수
     */
    off(eventName, callback) {
        this.eventEmitter.removeEventListener(eventName, callback);
    }

    /**
     * 게임 엔진 상태 정보
     * @returns {Object} 상태 정보
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentState: gameState.get('*'),
            hasAutoSave: !!this.autoSaveInterval
        };
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const gameEngine = new GameEngine();

// 전역 디버그 접근 (개발 환경에서만)
if (CONFIG.DEBUG.ENABLED) {
    window.gameEngine = gameEngine;
}

export default gameEngine;