// ===== 업적 시스템 =====

// 중복 로딩 방지
if (typeof window.AchievementSystem === 'undefined') {
    class AchievementSystem {
        constructor() {
            this.achievements = {
                // 첫 경험 업적
                'first_play': {
                    id: 'first_play',
                    title: '첫 만남',
                    description: '첫 게임을 시작했습니다',
                    icon: '🎮',
                    points: 10,
                    unlocked: false
                },
                'first_ending': {
                    id: 'first_ending',
                    title: '첫 엔딩',
                    description: '첫 엔딩을 봤습니다',
                    icon: '🎬',
                    points: 10,
                    unlocked: false
                },
                
                // 호감도 업적
                'perfect_score': {
                    id: 'perfect_score',
                    title: '완벽한 사랑',
                    description: '호감도 100을 달성했습니다',
                    icon: '💯',
                    points: 50,
                    unlocked: false
                },
                'heartbreaker': {
                    id: 'heartbreaker',
                    title: '차가운 사람',
                    description: '호감도 0으로 끝났습니다',
                    icon: '💔',
                    points: 30,
                    unlocked: false
                },
                'balanced': {
                    id: 'balanced',
                    title: '균형잡힌 관계',
                    description: '호감도 45-55로 끝났습니다',
                    icon: '⚖️',
                    points: 20,
                    unlocked: false
                },
                
                // 플레이 스타일 업적
                'speed_runner': {
                    id: 'speed_runner',
                    title: '스피드러너',
                    description: '3분 이내에 엔딩을 봤습니다',
                    icon: '⚡',
                    points: 30,
                    unlocked: false
                },
                'explorer': {
                    id: 'explorer',
                    title: '탐험가',
                    description: '한 시나리오의 모든 선택지를 경험했습니다',
                    icon: '🗺️',
                    points: 40,
                    unlocked: false
                },
                'consistent': {
                    id: 'consistent',
                    title: '일관된 선택',
                    description: '모든 선택에서 긍정적인 선택만 했습니다',
                    icon: '👍',
                    points: 25,
                    unlocked: false
                },
                
                // 시나리오별 업적
                'female_friend_master': {
                    id: 'female_friend_master',
                    title: '여사친 마스터',
                    description: '여사친 시나리오에서 90점 이상 달성',
                    icon: '👩',
                    points: 30,
                    unlocked: false
                },
                'male_friend_master': {
                    id: 'male_friend_master',
                    title: '남사친 마스터',
                    description: '남사친 시나리오에서 90점 이상 달성',
                    icon: '👨',
                    points: 30,
                    unlocked: false
                },
                'teacher_master': {
                    id: 'teacher_master',
                    title: '모범 학생',
                    description: '선생님 시나리오에서 90점 이상 달성',
                    icon: '👨‍🏫',
                    points: 30,
                    unlocked: false
                },
                
                // 특별 업적
                'perfectionist': {
                    id: 'perfectionist',
                    title: '완벽주의자',
                    description: '모든 시나리오에서 100점 달성',
                    icon: '🏆',
                    points: 100,
                    unlocked: false
                },
                'collector': {
                    id: 'collector',
                    title: '수집가',
                    description: '10개 이상의 업적 달성',
                    icon: '📚',
                    points: 50,
                    unlocked: false
                },
                'comeback': {
                    id: 'comeback',
                    title: '대역전',
                    description: '호감도 20 이하에서 80 이상으로 회복',
                    icon: '🔄',
                    points: 40,
                    unlocked: false
                }
            };
            
            this.loadProgress();
            this.setupUI();
        }
        
        // 진행 상황 로드
        loadProgress() {
            try {
                const saved = localStorage.getItem('loveSimulatorAchievements');
                if (saved) {
                    const data = JSON.parse(saved);
                    Object.keys(data).forEach(key => {
                        if (this.achievements[key]) {
                            this.achievements[key].unlocked = data[key].unlocked;
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to load achievements:', e);
            }
        }
        
        // 진행 상황 저장
        saveProgress() {
            try {
                localStorage.setItem('loveSimulatorAchievements', JSON.stringify(this.achievements));
            } catch (e) {
                console.warn('Failed to save achievements:', e);
            }
        }
        
        // 업적 달성 체크
        checkAchievement(achievementId, condition = true) {
            const achievement = this.achievements[achievementId];
            
            if (!achievement || achievement.unlocked) return false;
            
            if (condition) {
                achievement.unlocked = true;
                this.saveProgress();
                this.showAchievementNotification(achievement);
                return true;
            }
            
            return false;
        }
        
        // 게임 종료 시 업적 체크
        checkEndGameAchievements(gameData) {
            const { score, playTime, scenario, history } = gameData;
            
            this.checkAchievement('first_ending');
            this.checkAchievement('perfect_score', score === 100);
            this.checkAchievement('heartbreaker', score === 0);
            this.checkAchievement('balanced', score >= 45 && score <= 55);
            this.checkAchievement('speed_runner', playTime < 180);
            
            if (scenario === 'female-friend') {
                this.checkAchievement('female_friend_master', score >= 90);
            } else if (scenario === 'male-friend') {
                this.checkAchievement('male_friend_master', score >= 90);
            } else if (scenario === 'teacher') {
                this.checkAchievement('teacher_master', score >= 90);
            }
            
            if (history && history.length > 0) {
                const allPositive = history.every(choice => choice.favorability > 0);
                this.checkAchievement('consistent', allPositive);
                
                let lowestPoint = 50;
                let currentScore = 50;
                for (let choice of history) {
                    currentScore += choice.favorability;
                    lowestPoint = Math.min(lowestPoint, currentScore);
                }
                this.checkAchievement('comeback', lowestPoint <= 20 && score >= 80);
            }
            
            const unlockedCount = Object.values(this.achievements).filter(a => a.unlocked).length;
            this.checkAchievement('collector', unlockedCount >= 10);
        }
        
        // 업적 알림 표시
        showAchievementNotification(achievement) {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-content">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-unlocked">업적 달성!</div>
                        <div class="achievement-title">${achievement.title}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                        <div class="achievement-points">+${achievement.points} 포인트</div>
                    </div>
                </div>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: -400px;
                width: 350px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10001;
                transition: right 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.right = '20px';
            }, 100);
            
            setTimeout(() => {
                notification.style.right = '-400px';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }, 4000);
            
            this.createParticles(notification);
        }
        
        // 파티클 효과
        createParticles(element) {
            const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#98FB98'];
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const size = Math.random() * 10 + 5;
                
                particle.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    left: 50%;
                    top: 50%;
                    pointer-events: none;
                    animation: particle-explosion 1s ease-out forwards;
                    transform: translate(-50%, -50%);
                `;
                
                particle.style.setProperty('--tx', `${(Math.random() - 0.5) * 200}px`);
                particle.style.setProperty('--ty', `${(Math.random() - 0.5) * 200}px`);
                element.appendChild(particle);
                
                setTimeout(() => {
                    if (element.contains(particle)) {
                        particle.remove();
                    }
                }, 1000);
            }
        }
        
        // UI 설정
        setupUI() {
            this.addAchievementButton();
            this.createAchievementModal();
            this.addStyles();
        }
        
        // 업적 버튼 추가
        addAchievementButton() {
            if (document.getElementById('achievements-button')) return;
            
            const button = document.createElement('button');
            button.id = 'achievements-button';
            button.className = 'floating-button';
            button.innerHTML = '🏅';
            button.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                font-size: 24px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 999;
                transition: transform 0.3s ease;
            `;
            
            button.addEventListener('click', () => this.showAchievementModal());
            button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.1)');
            button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
            
            document.body.appendChild(button);
        }
        
        // 업적 모달 생성
        createAchievementModal() {
            if (document.getElementById('achievement-modal')) return;
            
            const modal = document.createElement('div');
            modal.id = 'achievement-modal';
            modal.className = 'achievement-modal hidden';
            modal.innerHTML = `
                <div class="achievement-modal-content">
                    <div class="achievement-modal-header">
                        <h2>🏆 업적 컬렉션</h2>
                        <button class="close-modal">✕</button>
                    </div>
                    <div class="achievement-stats">
                        <div class="stat-item">
                            <span class="stat-label">달성률</span>
                            <span class="stat-value" id="achievement-percentage">0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">총 포인트</span>
                            <span class="stat-value" id="total-points">0</span>
                        </div>
                    </div>
                    <div class="achievement-grid" id="achievement-grid"></div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.close-modal').addEventListener('click', () => this.hideAchievementModal());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideAchievementModal();
            });
        }
        
        // 업적 모달 표시
        showAchievementModal() {
            const modal = document.getElementById('achievement-modal');
            if (!modal) return;
            
            const grid = document.getElementById('achievement-grid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            let unlockedCount = 0;
            let totalPoints = 0;
            
            Object.values(this.achievements).forEach(achievement => {
                const item = document.createElement('div');
                item.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                
                if (achievement.unlocked) {
                    unlockedCount++;
                    totalPoints += achievement.points;
                }
                
                item.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-points">${achievement.points}P</div>
                    ${achievement.unlocked ? '<div class="achievement-check">✓</div>' : '<div class="achievement-lock">🔒</div>'}
                `;
                grid.appendChild(item);
            });
            
            const percentage = Math.round((unlockedCount / Object.keys(this.achievements).length) * 100);
            const percentageEl = document.getElementById('achievement-percentage');
            const pointsEl = document.getElementById('total-points');
            
            if (percentageEl) percentageEl.textContent = `${percentage}%`;
            if (pointsEl) pointsEl.textContent = totalPoints;
            
            modal.classList.remove('hidden');
        }
        
        // 업적 모달 숨기기
        hideAchievementModal() {
            const modal = document.getElementById('achievement-modal');
            if (modal) modal.classList.add('hidden');
        }
        
        // 스타일 추가
        addStyles() {
            if (document.getElementById('achievement-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'achievement-styles';
            style.textContent = `
                @keyframes particle-explosion {
                    to {
                        transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty)));
                        opacity: 0;
                    }
                }
                
                .achievement-notification .achievement-content {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .achievement-notification .achievement-icon {
                    font-size: 48px;
                }
                
                .achievement-notification .achievement-info {
                    flex: 1;
                }
                
                .achievement-notification .achievement-unlocked {
                    font-size: 12px;
                    opacity: 0.9;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .achievement-notification .achievement-title {
                    font-size: 20px;
                    font-weight: bold;
                    margin: 4px 0;
                }
                
                .achievement-notification .achievement-desc {
                    font-size: 14px;
                    opacity: 0.9;
                }
                
                .achievement-notification .achievement-points {
                    font-size: 14px;
                    margin-top: 4px;
                    color: #FFD700;
                }
                
                .achievement-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    backdrop-filter: blur(5px);
                }
                
                .achievement-modal.hidden {
                    display: none;
                }
                
                .achievement-modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .achievement-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .achievement-modal-header h2 {
                    margin: 0;
                    color: #333;
                }
                
                .close-modal {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    transition: color 0.3s;
                }
                
                .close-modal:hover {
                    color: #333;
                }
                
                .achievement-stats {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    color: white;
                }
                
                .stat-item {
                    text-align: center;
                }
                
                .stat-label {
                    display: block;
                    font-size: 14px;
                    opacity: 0.9;
                    margin-bottom: 5px;
                }
                
                .stat-value {
                    display: block;
                    font-size: 28px;
                    font-weight: bold;
                }
                
                .achievement-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                }
                
                .achievement-item {
                    background: #f5f5f5;
                    border-radius: 12px;
                    padding: 15px;
                    text-align: center;
                    position: relative;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .achievement-item.unlocked {
                    background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
                    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
                }
                
                .achievement-item.locked {
                    opacity: 0.6;
                }
                
                .achievement-item:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                }
                
                .achievement-item .achievement-icon {
                    font-size: 36px;
                    margin-bottom: 10px;
                }
                
                .achievement-item .achievement-name {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: #333;
                }
                
                .achievement-item .achievement-description {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 5px;
                }
                
                .achievement-item .achievement-points {
                    font-size: 12px;
                    color: #FF9800;
                    font-weight: bold;
                }
                
                .achievement-check,
                .achievement-lock {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    font-size: 16px;
                }
                
                .achievement-check {
                    color: #4CAF50;
                }
                
                @media (max-width: 768px) {
                    .achievement-grid {
                        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    }
                    
                    .achievement-modal-content {
                        padding: 20px;
                        width: 95%;
                    }
                    
                    .achievement-stats {
                        flex-direction: column;
                        gap: 20px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 게임 함수와 통합
        integrateWithGame() {
            if (typeof window.initializeGame === 'function') {
                const originalInitializeGame = window.initializeGame;
                window.initializeGame = (...args) => {
                    this.checkAchievement('first_play');
                    return originalInitializeGame.apply(window, args);
                };
            }

            if (typeof window.showResultScreen === 'function') {
                const originalShowResultScreen = window.showResultScreen;
                window.showResultScreen = (...args) => {
                    if (typeof window.GameState !== 'undefined') {
                        const gameData = {
                            score: window.GameState.favorability || 50,
                            playTime: window.GameState.gameStartTime ? 
                                Math.floor((Date.now() - window.GameState.gameStartTime) / 1000) : 0,
                            scenario: window.GameState.currentScenario || 'unknown',
                            history: window.GameState.playHistory || []
                        };
                        this.checkEndGameAchievements(gameData);
                    }
                    return originalShowResultScreen.apply(window, args);
                };
            }
        }
    }
    
    // 전역 인스턴스 생성
    window.AchievementSystem = AchievementSystem;
    window.achievementSystem = new AchievementSystem();
    
    // DOMContentLoaded 후 게임과 통합
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.achievementSystem && typeof window.achievementSystem.integrateWithGame === 'function') {
                window.achievementSystem.integrateWithGame();
                // console.log('Achievement System integrated with game!');
            }
        }, 100);
    });
    
    // console.log('Achievement System loaded!');
}