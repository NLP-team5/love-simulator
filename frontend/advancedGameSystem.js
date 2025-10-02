// ===== 고급 게임 시스템 =====

// 사운드 관리 시스템
class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = {
            master: 0.7,
            bgm: 0.3,
            sfx: 0.8
        };
        this.enabled = true;
        this.init();
    }

    init() {
        this.loadSounds();
        this.setupVolumeControls();
    }

    loadSounds() {
        const soundFiles = {
            bgm: 'sounds/bgm.mp3',
            select: 'sounds/select.mp3',
            success: 'sounds/success.mp3',
            notification: 'sounds/notification.mp3',
            heartbeat: 'sounds/heartbeat.mp3'
        };

        Object.entries(soundFiles).forEach(([name, path]) => {
            try {
                this.sounds[name] = new Audio(path);
                this.sounds[name].onerror = () => {
                    console.warn(`Sound file not found: ${path}`);
                };
            } catch (error) {
                console.warn(`Failed to load sound: ${name}`, error);
            }
        });

        if (this.sounds.bgm) {
            this.sounds.bgm.loop = true;
            this.sounds.bgm.volume = this.volume.bgm * this.volume.master;
        }
    }

    play(soundName, options = {}) {
        if (!this.enabled || !this.sounds[soundName]) return;

        const sound = this.sounds[soundName];
        const volume = options.volume ||
            (soundName === 'bgm' ? this.volume.bgm : this.volume.sfx);

        sound.volume = volume * this.volume.master;
        sound.currentTime = 0;

        sound.play().catch(error => {
            console.warn(`Failed to play sound: ${soundName}`, error);
        });
    }

    stop(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].pause();
            this.sounds[soundName].currentTime = 0;
        }
    }

    setVolume(type, value) {
        this.volume[type] = Math.max(0, Math.min(1, value));
        this.updateAllVolumes();
    }

    updateAllVolumes() {
        Object.entries(this.sounds).forEach(([name, sound]) => {
            const baseVolume = name === 'bgm' ? this.volume.bgm : this.volume.sfx;
            sound.volume = baseVolume * this.volume.master;
        });
    }

    setupVolumeControls() {
        // 음량 조절 UI가 있다면 연결
        const soundToggle = document.getElementById('sound-toggle-button');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                this.enabled = !this.enabled;
                soundToggle.textContent = this.enabled ? '🔊' : '🔇';

                if (!this.enabled) {
                    Object.values(this.sounds).forEach(sound => sound.pause());
                }
            });
        }
    }
}

// 테마 관리 시스템
class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: '기본',
                colors: {
                    primary: '#FF6B9D',
                    secondary: '#C66FBC',
                    background: '#F8F9FA',
                    surface: '#FFFFFF'
                }
            },
            dark: {
                name: '다크',
                colors: {
                    primary: '#FF6B9D',
                    secondary: '#C66FBC',
                    background: '#1A1A1A',
                    surface: '#2D2D2D'
                }
            },
            romantic: {
                name: '로맨틱',
                colors: {
                    primary: '#FF69B4',
                    secondary: '#DA70D6',
                    background: '#FFF0F5',
                    surface: '#FFFAFF'
                }
            }
        };

        this.currentTheme = 'default';
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.createThemeSelector();
    }

    loadSavedTheme() {
        const saved = localStorage.getItem('loveSimulatorTheme');
        if (saved && this.themes[saved]) {
            this.applyTheme(saved);
        }
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([property, value]) => {
            root.style.setProperty(`--${property}-color`, value);
        });

        this.currentTheme = themeName;
        localStorage.setItem('loveSimulatorTheme', themeName);
    }

    createThemeSelector() {
        // 테마 선택 UI 생성 (필요시)
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle';
        themeButton.textContent = '🎨';
        themeButton.title = '테마 변경';

        themeButton.style.cssText = `
            position: fixed;
            bottom: 160px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--primary-color);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 999;
            transition: transform 0.3s ease;
        `;

        themeButton.addEventListener('click', () => this.showThemeSelector());
        themeButton.addEventListener('mouseenter', () => {
            themeButton.style.transform = 'scale(1.1)';
        });
        themeButton.addEventListener('mouseleave', () => {
            themeButton.style.transform = 'scale(1)';
        });

        document.body.appendChild(themeButton);
    }

    showThemeSelector() {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';

        const themes = Object.entries(this.themes).map(([key, theme]) =>
            `<button class="theme-option ${key === this.currentTheme ? 'active' : ''}"
                     data-theme="${key}">${theme.name}</button>`
        ).join('');

        selector.innerHTML = `
            <div class="theme-popup">
                <h3>테마 선택</h3>
                <div class="theme-options">${themes}</div>
                <button class="close-theme-selector">닫기</button>
            </div>
        `;

        selector.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        selector.addEventListener('click', (e) => {
            if (e.target.classList.contains('theme-option')) {
                this.applyTheme(e.target.dataset.theme);
                document.body.removeChild(selector);
            } else if (e.target.classList.contains('close-theme-selector') || e.target === selector) {
                document.body.removeChild(selector);
            }
        });

        document.body.appendChild(selector);
    }
}

// 통계 시스템
class GameStatistics {
    constructor() {
        this.stats = {
            totalGamesPlayed: 0,
            totalPlayTime: 0,
            scenariosCompleted: {},
            bestScores: {},
            averageScore: 0,
            achievements: 0
        };
        this.init();
    }

    init() {
        this.loadStats();
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('loveSimulatorStats');
            if (saved) {
                this.stats = { ...this.stats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load statistics:', error);
        }
    }

    saveStats() {
        try {
            localStorage.setItem('loveSimulatorStats', JSON.stringify(this.stats));
        } catch (error) {
            console.warn('Failed to save statistics:', error);
        }
    }

    recordGame(gameData) {
        this.stats.totalGamesPlayed++;
        this.stats.totalPlayTime += gameData.playTime || 0;

        if (gameData.scenario) {
            this.stats.scenariosCompleted[gameData.scenario] =
                (this.stats.scenariosCompleted[gameData.scenario] || 0) + 1;

            const currentBest = this.stats.bestScores[gameData.scenario] || 0;
            if (gameData.score > currentBest) {
                this.stats.bestScores[gameData.scenario] = gameData.score;
            }
        }

        this.updateAverageScore();
        this.saveStats();
    }

    updateAverageScore() {
        const scores = Object.values(this.stats.bestScores);
        if (scores.length > 0) {
            this.stats.averageScore = Math.round(
                scores.reduce((sum, score) => sum + score, 0) / scores.length
            );
        }
    }

    getStats() {
        return { ...this.stats };
    }
}

// 시스템 초기화
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // 시스템들을 전역에서 접근 가능하게 설정
        window.soundManager = new SoundManager();
        window.themeManager = new ThemeManager();
        window.gameStatistics = new GameStatistics();

        // console.log('Advanced Game Systems loaded!');

        // 기존 게임 함수와 통합
        setTimeout(() => {
            if (typeof window.showResultScreen === 'function') {
                const originalShowResult = window.showResultScreen;
                window.showResultScreen = function(...args) {
                    // 통계 기록
                    if (window.GameState && window.gameStatistics) {
                        const gameData = {
                            score: window.GameState.favorability || 50,
                            playTime: window.GameState.gameStartTime ?
                                Math.floor((Date.now() - window.GameState.gameStartTime) / 1000) : 0,
                            scenario: window.GameState.currentScenario
                        };
                        window.gameStatistics.recordGame(gameData);
                    }

                    return originalShowResult.apply(this, args);
                };
            }
        }, 100);
    });
}

// CSS 스타일 추가
const advancedStyles = document.createElement('style');
advancedStyles.textContent = `
    .theme-popup {
        background: white;
        border-radius: 15px;
        padding: 25px;
        min-width: 250px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    .theme-popup h3 {
        margin: 0 0 20px 0;
        text-align: center;
        color: #333;
    }

    .theme-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
    }

    .theme-option {
        padding: 12px 20px;
        border: 2px solid #ddd;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
    }

    .theme-option:hover {
        border-color: var(--primary-color);
        background: #f8f9fa;
    }

    .theme-option.active {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: white;
    }

    .close-theme-selector {
        width: 100%;
        padding: 12px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s ease;
    }

    .close-theme-selector:hover {
        background: #5a6268;
    }
`;

if (typeof document !== 'undefined') {
    document.head.appendChild(advancedStyles);
}