/**
 * 메인 애플리케이션 모듈
 *
 * 애플리케이션의 진입점이며, 모든 모듈을 초기화하고 조율합니다.
 * UI 컨트롤러 역할을 수행합니다.
 *
 * @module App
 * @author shinjuyong
 * @version 1.0.0
 */

import { CONFIG } from './modules/config.js';
import { gameState } from './modules/gameState.js';
import { gameEngine } from './modules/gameEngine.js';
import { apiClient } from './modules/apiClient.js';
import { DOMSelector, DOMManipulator, EventUtils, AnimationUtils, domCache } from './utils/dom.js';

/**
 * 메인 애플리케이션 클래스
 * @class App
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.currentScreen = 'start';
        this.ui = {};
    }

    /**
     * 애플리케이션 초기화
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Love Simulator 시작 중...');

            // DOM 요소 캐싱
            this.cacheElements();

            // 게임 엔진 초기화
            await gameEngine.initialize();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // UI 초기화
            this.initializeUI();

            // 서비스 워커 등록 (프로덕션에서만)
            if (CONFIG.ENVIRONMENT === 'production') {
                this.registerServiceWorker();
            }

            this.isInitialized = true;
            console.log('✅ Love Simulator 초기화 완료');

            // 저장된 게임이 있으면 복구 제안
            this.checkSavedGame();

        } catch (error) {
            console.error('애플리케이션 초기화 실패:', error);
            this.showError('게임을 시작할 수 없습니다. 페이지를 새로고침해주세요.');
        }
    }

    /**
     * DOM 요소 캐싱
     * @private
     */
    cacheElements() {
        // 화면 요소들
        domCache.add('startScreen', '#start-screen');
        domCache.add('gameScreen', '#game-container');
        domCache.add('resultScreen', '#result-screen');
        domCache.add('rankingScreen', '#ranking-screen');
        domCache.add('loadingScreen', '#loading-screen');

        // 게임 UI 요소들
        domCache.add('characterImage', '#character-image');
        domCache.add('characterName', '#character-name');
        domCache.add('characterMood', '#character-mood');
        domCache.add('aiLine', '#ai-line');
        domCache.add('userCards', '#user-cards');
        domCache.add('favorabilityBar', '#favorability-bar');
        domCache.add('favorabilityScore', '#favorability-score');
        domCache.add('sceneNumber', '#scene-number');
        domCache.add('pauseMenu', '#pause-menu');

        // 결과 화면 요소들
        domCache.add('resultTitle', '#result-title');
        domCache.add('finalScore', '#final-score');
        domCache.add('finalAdvice', '#final-advice');
        domCache.add('bestChoiceText', '#best-choice-text');
        domCache.add('bestChoiceScore', '#best-choice-score');
        domCache.add('worstChoiceText', '#worst-choice-text');
        domCache.add('worstChoiceScore', '#worst-choice-score');
        domCache.add('nicknameInput', '#nickname-input');

        // 랭킹 요소들
        domCache.add('rankingItems', '#ranking-items');
        domCache.add('rankingTabs', '.tab-button');

        // 버튼들
        domCache.add('showRankingButton', '#show-ranking-button');
        domCache.add('backToMainButton', '#back-to-main-button');
        domCache.add('pauseButton', '#pause-button');
        domCache.add('submitRankingButton', '#submit-ranking-button');
        domCache.add('soundToggleButton', '#sound-toggle-button');

        this.ui = domCache.getAll();
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    setupEventListeners() {
        // 게임 엔진 이벤트
        gameEngine.on('sceneLoaded', (event) => {
            this.handleSceneLoaded(event.detail);
        });

        gameEngine.on('favorabilityChanged', (event) => {
            this.updateFavorabilityUI(event.detail);
        });

        gameEngine.on('gameEnded', (event) => {
            this.showResultScreen(event.detail.result);
        });

        gameEngine.on('error', (event) => {
            this.handleError(event.detail);
        });

        // UI 이벤트
        EventUtils.on(this.ui.showRankingButton, 'click', () => this.showRankingScreen());
        EventUtils.on(this.ui.backToMainButton, 'click', () => this.showStartScreen());
        EventUtils.on(this.ui.pauseButton, 'click', () => this.togglePause());
        EventUtils.on(this.ui.submitRankingButton, 'click', () => this.submitRanking());
        EventUtils.on(this.ui.soundToggleButton, 'click', () => this.toggleSound());

        // 시나리오 카드 클릭 이벤트 (이벤트 위임)
        EventUtils.delegate(document, '.scenario-card', 'click', (event) => {
            const scenarioCard = event.target.closest('.scenario-card');
            const scenario = scenarioCard.getAttribute('data-scenario');
            if (scenario) {
                this.startGame(scenario);
            }
        });

        // 플레이 버튼 클릭 이벤트 (이벤트 위임)
        EventUtils.delegate(document, '.play-button', 'click', (event) => {
            event.stopPropagation(); // 카드 클릭 이벤트 중복 방지
            const scenarioCard = event.target.closest('.scenario-card');
            const scenario = scenarioCard.getAttribute('data-scenario');
            if (scenario) {
                this.startGame(scenario);
            }
        });

        // 랭킹 탭 클릭 이벤트
        EventUtils.delegate(document, '.tab-button', 'click', (event) => {
            const tab = event.target.dataset.tab;
            this.filterRankings(tab);
        });

        // 키보드 단축키
        EventUtils.on(document, 'keydown', (event) => {
            this.handleKeyPress(event);
        });

        // 일시정지 메뉴 버튼들
        EventUtils.on('#resume-game', 'click', () => this.resumeGame());
        EventUtils.on('#restart-game', 'click', () => this.restartGame());
        EventUtils.on('#back-to-main', 'click', () => this.showStartScreen());

        // 결과 화면 버튼들
        EventUtils.on('#restart-scenario', 'click', () => this.restartGame());
        EventUtils.on('#back-to-main-result', 'click', () => this.showStartScreen());
    }

    /**
     * UI 초기화
     * @private
     */
    initializeUI() {
        // 초기 화면 설정
        this.showStartScreen();

        // 사운드 시스템 초기화
        this.initializeAudio();

        // 툴팁 초기화
        this.initializeTooltips();

        // 반응형 UI 설정
        this.setupResponsiveUI();
    }

    /**
     * 오디오 시스템 초기화
     * @private
     */
    initializeAudio() {
        this.audio = {
            bgm: new Audio('sounds/bgm.mp3'),
            select: new Audio('sounds/select.mp3'),
            success: new Audio('sounds/success.mp3')
        };

        this.audio.bgm.loop = true;
        this.audio.success.loop = true;

        // 볼륨 설정
        this.audio.bgm.volume = CONFIG.AUDIO.DEFAULT_VOLUME.BGM;
        this.audio.select.volume = CONFIG.AUDIO.DEFAULT_VOLUME.SFX;
        this.audio.success.volume = CONFIG.AUDIO.DEFAULT_VOLUME.SUCCESS;

        // 오디오 로드 에러 처리
        Object.entries(this.audio).forEach(([key, audio]) => {
            audio.addEventListener('error', (e) => {
                console.warn(`오디오 로드 실패: ${key}`, e);
            });
        });
    }

    /**
     * 게임 시작
     * @param {string} scenario - 시나리오 이름
     * @returns {Promise<void>}
     */
    async startGame(scenario) {
        try {
            this.showLoading();

            // BGM 재생
            if (gameState.get('settings.soundEnabled')) {
                this.playAudio('bgm');
            }

            await gameEngine.startNewGame(scenario);
            this.showGameScreen();

        } catch (error) {
            console.error('게임 시작 실패:', error);
            this.showError('게임을 시작할 수 없습니다. 다시 시도해주세요.');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * 장면 로드 처리
     * @param {Object} sceneData - 장면 데이터
     * @private
     */
    async handleSceneLoaded(sceneData) {
        const { sceneId, sceneData: data } = sceneData;

        // 장면 번호 업데이트
        DOMManipulator.setContent(this.ui.sceneNumber, `Scene ${sceneId}`);

        // 캐릭터 이미지 변경
        if (data.characterImage) {
            await this.updateCharacterImage(data.characterImage);
        }

        // 캐릭터 감정 업데이트
        if (data.characterMood) {
            this.updateCharacterMood(data.characterMood);
        }

        // AI 대사 타이핑 애니메이션
        await this.typeWriterText(data.aiLine);

        // 선택지 표시
        if (data.userCards && data.userCards.length > 0) {
            this.displayChoices(data.userCards);
        } else {
            // 선택지가 없으면 게임 종료
            setTimeout(() => gameEngine.endGame(), 2000);
        }
    }

    /**
     * 타이핑 애니메이션
     * @param {string} text - 표시할 텍스트
     * @returns {Promise<void>}
     */
    async typeWriterText(text) {
        return new Promise(resolve => {
            const element = this.ui.aiLine;
            DOMManipulator.setContent(element, '');

            let index = 0;
            const speed = gameState.get('settings.textSpeed');

            const type = () => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };

            type();
        });
    }

    /**
     * 선택지 표시
     * @param {Array} choices - 선택지 배열
     * @private
     */
    displayChoices(choices) {
        const container = this.ui.userCards;
        DOMManipulator.setContent(container, '');

        setTimeout(() => {
            choices.forEach((choice, index) => {
                const card = this.createChoiceCard(choice, index + 1);
                container.appendChild(card);

                // 순차적 애니메이션
                setTimeout(() => {
                    AnimationUtils.slideUp(card);
                }, index * 150);
            });
        }, CONFIG.UI.ANIMATION_DELAY);
    }

    /**
     * 선택지 카드 생성
     * @param {Object} choice - 선택지 데이터
     * @param {number} cardNumber - 카드 번호
     * @returns {HTMLElement} 생성된 카드 요소
     * @private
     */
    createChoiceCard(choice, cardNumber) {
        const card = document.createElement('div');
        card.className = 'choice-card';

        // 호감도 힌트
        let hint = '';
        if (Math.abs(choice.favorability) >= 20) {
            hint = choice.favorability > 0 ? '💖' : '💔';
        } else if (Math.abs(choice.favorability) >= 10) {
            hint = choice.favorability > 0 ? '💕' : '😟';
        }

        card.innerHTML = `
            <span class="choice-card-number">${cardNumber}</span>
            <p class="choice-text">${choice.text}</p>
            ${hint ? `<span class="choice-hint">${hint}</span>` : ''}
        `;

        // 클릭 이벤트
        EventUtils.on(card, 'click', () => this.selectChoice(card, choice));

        return card;
    }

    /**
     * 선택지 선택 처리
     * @param {HTMLElement} cardElement - 선택된 카드 요소
     * @param {Object} choice - 선택지 데이터
     * @private
     */
    async selectChoice(cardElement, choice) {
        if (DOMManipulator.hasClass(cardElement, 'selected')) return;

        // 사운드 재생
        if (gameState.get('settings.soundEnabled')) {
            this.playAudio('select');
        }

        // 카드 선택 애니메이션
        DOMManipulator.addClass(cardElement, 'selected');

        const allCards = DOMSelector.selectAll('.choice-card');
        allCards.forEach(card => {
            if (card !== cardElement) {
                DOMManipulator.addClass(card, 'discarded');
            }
        });

        // 게임 엔진에 선택 전달
        await gameEngine.makeChoice(choice);
    }

    /**
     * 호감도 UI 업데이트
     * @param {Object} data - 호감도 변경 데이터
     * @private
     */
    updateFavorabilityUI(data) {
        const { old: oldValue, new: newValue } = data;

        // 애니메이션으로 호감도 바 업데이트
        this.animateFavorabilityChange(oldValue, newValue);

        // 캐릭터 감정 업데이트
        this.updateCharacterMoodByFavorability(newValue);
    }

    /**
     * 호감도 애니메이션
     * @param {number} from - 시작 값
     * @param {number} to - 끝 값
     * @private
     */
    animateFavorabilityChange(from, to) {
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = from + (to - from) * this.easeOutCubic(progress);

            DOMManipulator.setContent(this.ui.favorabilityScore, Math.round(current));
            DOMManipulator.setStyle(this.ui.favorabilityBar, 'width', `${current}%`);

            this.updateFavorabilityColor(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 이징 함수
     * @param {number} t - 진행 비율 (0-1)
     * @returns {number} 이징된 값
     * @private
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * 호감도 색상 업데이트
     * @param {number} value - 호감도 값
     * @private
     */
    updateFavorabilityColor(value) {
        let gradient;
        if (value < 30) {
            gradient = 'linear-gradient(90deg, #F44336, #E91E63)';
        } else if (value < 70) {
            gradient = 'linear-gradient(90deg, #FFC107, #FF9800)';
        } else {
            gradient = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        }
        DOMManipulator.setStyle(this.ui.favorabilityBar, 'background', gradient);
    }

    /**
     * 캐릭터 감정 업데이트 (호감도 기반)
     * @param {number} favorability - 호감도
     * @private
     */
    updateCharacterMoodByFavorability(favorability) {
        const moods = {
            0: '💔',    // 0-19
            20: '😰',   // 20-39
            40: '😐',   // 40-59
            60: '🙂',   // 60-79
            80: '😊',   // 80-99
            100: '🥰'   // 100+
        };

        let mood = '😐';
        for (let threshold in moods) {
            if (favorability >= threshold) {
                mood = moods[threshold];
            }
        }

        DOMManipulator.setContent(this.ui.characterMood, mood);

        // 캐릭터 이미지 효과
        if (favorability >= 80) {
            DOMManipulator.setStyle(this.ui.characterImage, 'filter', 'brightness(1.1)');
        } else if (favorability < 30) {
            DOMManipulator.setStyle(this.ui.characterImage, 'filter', 'brightness(0.8)');
        } else {
            DOMManipulator.setStyle(this.ui.characterImage, 'filter', 'brightness(1)');
        }
    }

    /**
     * 화면 전환
     * @param {string} screenName - 전환할 화면 이름
     * @private
     */
    async transitionToScreen(screenName) {
        // 현재 화면 숨기기
        const currentScreen = DOMSelector.select('.screen.active');
        if (currentScreen) {
            await AnimationUtils.fadeOut(currentScreen);
            DOMManipulator.removeClass(currentScreen, 'active');
        }

        // 새 화면 표시
        const newScreen = domCache.get(`${screenName}Screen`);
        if (newScreen) {
            DOMManipulator.addClass(newScreen, 'active');
            await AnimationUtils.fadeIn(newScreen);
        }

        this.currentScreen = screenName;
        gameState.set('currentScreen', screenName);
    }

    /**
     * 시작 화면 표시
     */
    async showStartScreen() {
        this.stopAllAudio();
        await this.transitionToScreen('start');
    }

    /**
     * 게임 화면 표시
     */
    async showGameScreen() {
        await this.transitionToScreen('game');
    }

    /**
     * 결과 화면 표시
     * @param {Object} result - 게임 결과
     */
    async showResultScreen(result) {
        this.stopAllAudio();

        if (gameState.get('settings.soundEnabled')) {
            this.playAudio('success');
        }

        await this.transitionToScreen('result');
        this.displayResult(result);
    }

    /**
     * 랭킹 화면 표시
     */
    async showRankingScreen() {
        await this.transitionToScreen('ranking');
        await this.loadRankings();
    }

    /**
     * 로딩 표시
     */
    showLoading() {
        DOMManipulator.removeClass(this.ui.loadingScreen, 'hidden');
    }

    /**
     * 로딩 숨기기
     */
    hideLoading() {
        setTimeout(() => {
            DOMManipulator.addClass(this.ui.loadingScreen, 'hidden');
        }, 300);
    }

    /**
     * 오디오 재생
     * @param {string} type - 오디오 타입
     * @private
     */
    playAudio(type) {
        if (this.audio[type]) {
            this.audio[type].currentTime = 0;
            this.audio[type].play().catch(e => {
                console.warn(`오디오 재생 실패: ${type}`, e);
            });
        }
    }

    /**
     * 모든 오디오 정지
     * @private
     */
    stopAllAudio() {
        Object.values(this.audio).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }

    /**
     * 에러 표시
     * @param {string} message - 에러 메시지
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 ('success', 'error', 'warning', 'info')
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                ${this.getToastIcon(type)}
                <span>${message}</span>
            </div>
        `;

        // 스타일 설정
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '15px 25px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            animation: 'toastSlideUp 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        });

        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        toast.style.borderLeft = `4px solid ${colors[type]}`;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideDown 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, CONFIG.UI.TOAST_DURATION);
    }

    /**
     * 토스트 아이콘 반환
     * @param {string} type - 토스트 타입
     * @returns {string} 아이콘 HTML
     * @private
     */
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return `<span style="font-weight: bold; font-size: 1.2em;">${icons[type]}</span>`;
    }

    /**
     * 키보드 입력 처리
     * @param {KeyboardEvent} event - 키보드 이벤트
     * @private
     */
    handleKeyPress(event) {
        if (this.currentScreen === 'game') {
            if (event.key === 'Escape') {
                this.togglePause();
            }

            // 숫자 키로 선택지 선택
            if (event.key >= '1' && event.key <= '9') {
                const index = parseInt(event.key) - 1;
                const choices = DOMSelector.selectAll('.choice-card:not(.discarded)');
                if (choices[index]) {
                    choices[index].click();
                }
            }
        }
    }

    /**
     * 일시정지 토글
     */
    togglePause() {
        const isPaused = gameState.get('isPaused');
        if (isPaused) {
            gameEngine.resumeGame();
            DOMManipulator.addClass(this.ui.pauseMenu, 'hidden');
        } else {
            gameEngine.pauseGame();
            DOMManipulator.removeClass(this.ui.pauseMenu, 'hidden');
        }
    }

    /**
     * 게임 재시작
     */
    async restartGame() {
        const scenario = gameState.get('currentScenario');
        if (scenario) {
            await this.startGame(scenario);
        }
    }

    /**
     * 게임 재개
     */
    resumeGame() {
        gameEngine.resumeGame();
        DOMManipulator.addClass(this.ui.pauseMenu, 'hidden');
    }

    /**
     * 사운드 토글
     */
    toggleSound() {
        const soundEnabled = gameState.get('settings.soundEnabled');
        gameState.set('settings.soundEnabled', !soundEnabled);

        if (!soundEnabled) {
            DOMManipulator.setContent(this.ui.soundToggleButton, '🔊');
            if (this.currentScreen === 'game') {
                this.playAudio('bgm');
            }
        } else {
            DOMManipulator.setContent(this.ui.soundToggleButton, '🔇');
            this.stopAllAudio();
        }
    }

    /**
     * 서비스 워커 등록
     * @private
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker 등록 성공');
            } catch (error) {
                console.warn('Service Worker 등록 실패:', error);
            }
        }
    }

    /**
     * 저장된 게임 확인
     * @private
     */
    checkSavedGame() {
        const saved = localStorage.getItem(CONFIG.GAME.SAVE_KEY);
        if (saved) {
            try {
                const saveData = JSON.parse(saved);
                if (Date.now() - saveData.timestamp < CONFIG.GAME.AUTO_SAVE_INTERVAL) {
                    this.showToast('저장된 게임을 발견했습니다!', 'info');
                }
            } catch (error) {
                console.warn('저장된 게임 데이터 파싱 실패:', error);
            }
        }
    }

    /**
     * 반응형 UI 설정
     * @private
     */
    setupResponsiveUI() {
        // 뷰포트 크기에 따른 UI 조정
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            const root = document.documentElement;

            if (isMobile) {
                root.style.setProperty('--card-size', '90%');
                root.style.setProperty('--font-size-base', '14px');
            } else {
                root.style.setProperty('--card-size', '300px');
                root.style.setProperty('--font-size-base', '16px');
            }
        };

        EventUtils.throttle(window, 'resize', handleResize);
        handleResize(); // 초기 실행
    }

    /**
     * 툴팁 초기화
     * @private
     */
    initializeTooltips() {
        // 호감도 바 툴팁
        EventUtils.on(this.ui.favorabilityBar, 'mouseenter', () => {
            const favorability = gameState.get('favorability');
            this.showTooltip(`현재 호감도: ${favorability}점`, this.ui.favorabilityBar);
        });
    }

    /**
     * 툴팁 표시
     * @param {string} text - 툴팁 텍스트
     * @param {HTMLElement} target - 대상 요소
     * @private
     */
    showTooltip(text, target) {
        // 툴팁 구현 (간단한 title 속성 사용)
        target.title = text;
    }

    /**
     * 에러 처리
     * @param {Object} errorData - 에러 데이터
     * @private
     */
    handleError(errorData) {
        const { type, error } = errorData;
        console.error(`Game Error [${type}]:`, error);

        let message = '오류가 발생했습니다.';
        if (error.message) {
            message = error.message;
        }

        this.showError(message);
    }

    // ... (다른 메서드들은 길이 제한으로 생략, 필요시 별도 파일로 분리)
}

// 애플리케이션 인스턴스 생성 및 초기화
const app = new App();

// DOM 로드 완료 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// 전역 접근 (개발 환경에서만)
if (CONFIG.DEBUG.ENABLED) {
    window.app = app;
}

export default app;