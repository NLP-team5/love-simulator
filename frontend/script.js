// ===== 전역 상태 관리 =====
const GameState = {
    currentScenario: null,
    currentSceneId: 1,
    favorability: 50,
    playHistory: [],
    gameStartTime: null,
    isPaused: false,
    soundEnabled: true,
    scenarioTitles: {
        'female-friend': '여사친에게 다가가기',
        'male-friend': '남사친에게 다가가기',
        'teacher': '김민수 선생님의 최애가 되기'
    },
    characterNames: {
        'female-friend': '수진',
        'male-friend': '준호',
        'teacher': '김민수 선생님'
    }
};

// ===== 애플리케이션 설정 =====
const CONFIG = {
    // API 설정
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:8000`
        : window.location.origin,

    // 애니메이션 설정
    TYPEWRITER_SPEED: 50,
    ANIMATION_DELAY: 300,

    // 저장 설정
    AUTO_SAVE_INTERVAL: 24 * 60 * 60 * 1000, // 24시간
    SAVE_KEY: 'loveSimulatorSave',

    // 유효성 검사
    MAX_NICKNAME_LENGTH: 20,
    MIN_NICKNAME_LENGTH: 2,

    // 호감도 임계값
    FAVORABILITY_THRESHOLDS: {
        GAME_OVER: 30,
        PERFECT_ENDING: 70,
        GOOD_ENDING: 60,
        NEUTRAL_ENDING: 40
    },

    // 장면 ID
    SCENE_IDS: {
        GAME_OVER: 99,
        PERFECT_ENDING: 31,
        BAD_ENDING: 100,
        DECISIVE_MOMENT: 999
    }
};

// ===== DOM 요소 캐싱 =====
let DOM = {};

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    initializeEventListeners();
    initializeSoundSystem();
    checkSavedProgress();

    // 디버그 모드 활성화
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setupDebugMode();
    }
});

// ===== DOM 요소 초기화 =====
function initializeDOMElements() {
    DOM = {
        screens: {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-container'),
            ranking: document.getElementById('ranking-screen'),
            result: document.getElementById('result-screen'),
            loading: document.getElementById('loading-screen')
        },
        game: {
            aiLine: document.getElementById('ai-line'),
            userCards: document.getElementById('user-cards'),
            characterImage: document.getElementById('character-image'),
            characterName: document.getElementById('character-name'),
            characterMood: document.getElementById('character-mood'),
            favorabilityBar: document.getElementById('favorability-bar'),
            favorabilityScore: document.getElementById('favorability-score'),
            sceneNumber: document.getElementById('scene-number'),
            pauseMenu: document.getElementById('pause-menu')
        },
        ranking: {
            items: document.getElementById('ranking-items'),
            tabs: document.querySelectorAll('.tab-button')
        },
        result: {
            title: document.getElementById('result-title'),
            finalScore: document.getElementById('final-score'),
            bestChoice: document.getElementById('best-choice-text'),
            bestScore: document.getElementById('best-choice-score'),
            worstChoice: document.getElementById('worst-choice-text'),
            worstScore: document.getElementById('worst-choice-score'),
            advice: document.getElementById('final-advice'),
            nicknameInput: document.getElementById('nickname-input'),
            scoreRingFill: document.getElementById('score-ring-fill')
        }
    };
}

// ===== 이벤트 리스너 설정 =====
function initializeEventListeners() {
    // 랭킹 버튼
    const showRankingBtn = document.getElementById('show-ranking-button');
    const backToMainBtn = document.getElementById('back-to-main-button');
    
    if (showRankingBtn) {
        showRankingBtn.addEventListener('click', showRankingScreen);
    }
    
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', backToMain);
    }
    
    // 일시정지 버튼
    const pauseBtn = document.getElementById('pause-button');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', togglePause);
    }
    
    // 랭킹 제출
    const submitRankingBtn = document.getElementById('submit-ranking-button');
    if (submitRankingBtn) {
        submitRankingBtn.addEventListener('click', submitRanking);
    }
    
    // 랭킹 탭
    if (DOM.ranking && DOM.ranking.tabs) {
        DOM.ranking.tabs.forEach(tab => {
            tab.addEventListener('click', (e) => filterRankings(e.target.dataset.tab));
        });
    }
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyPress);
}

// ===== 사운드 시스템 =====
function initializeSoundSystem() {
    window.sounds = {
        bgm: new Audio('sounds/bgm.mp3'),
        select: new Audio('sounds/select.mp3'),
        success: new Audio('sounds/success.mp3')
    };

    window.sounds.bgm.loop = true;
    window.sounds.success.loop = true;
    window.sounds.bgm.volume = 0.3;
    window.sounds.success.volume = 0.7;
    window.sounds.select.volume = 0.8;
}

function stopAllLoopSounds() {
    if (window.sounds) {
        window.sounds.bgm.pause();
        window.sounds.success.pause();
        window.sounds.bgm.currentTime = 0;
        window.sounds.success.currentTime = 0;
    }
}

// ===== 게임 시작 =====
window.initializeGame = async function(scenarioName) {
    showLoading();
    
    try {
        stopAllLoopSounds();
        if (GameState.soundEnabled) {
            window.sounds.bgm.play().catch(e => console.error("BGM 재생 오류:", e));
        }

        // 상태 초기화
        GameState.currentScenario = scenarioName;
        GameState.currentSceneId = 1;
        GameState.favorability = 50;
        GameState.playHistory = [];
        GameState.gameStartTime = Date.now();
        GameState.isPaused = false;
        
        // 화면 전환
        transitionToScreen('game');
        
        // 캐릭터 설정
        setupCharacter(scenarioName);
        
        // 첫 장면 로드
        await fetchNextScene(1);
        
    } catch (error) {
        console.error('게임 시작 실패:', error);
        showError('게임을 시작할 수 없습니다. 다시 시도해주세요.');
    } finally {
        hideLoading();
    }
};

// ===== 캐릭터 설정 =====
function setupCharacter(scenario) {
    const characterImages = {
        'female-friend': 'images/female_friend_main.png',
        'male-friend': 'images/male_friend_main.jpg',
        'teacher': 'images/teacher_main0.png'
    };
    
    if (DOM.game.characterImage) {
        DOM.game.characterImage.src = characterImages[scenario];
        DOM.game.characterImage.onerror = function() {
            console.warn('Failed to load character image:', this.src);
            this.src = `https://via.placeholder.com/200x200/FF6B9D/FFFFFF?text=${encodeURIComponent(GameState.characterNames[scenario])}`;
        };
    }
    
    if (DOM.game.characterName) {
        DOM.game.characterName.textContent = GameState.characterNames[scenario] || '김민수 강사님';
    }
    
    updateCharacterMood(50);
    updateFavorabilityUI();
}

// ===== 장면 불러오기 =====
async function fetchNextScene(sceneId) {
    try {

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/${GameState.currentScenario}/${sceneId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showResultScreen();
                return;
            }
            throw new Error(`서버 응답 오류: ${response.status}`);
        }
        
        const sceneData = await response.json();
        
        if (sceneData.error) {
            throw new Error(sceneData.message || '장면 로드 실패');
        }
        
        updateScene(sceneData);
        
        if (DOM.game.sceneNumber) {
            DOM.game.sceneNumber.textContent = `Scene ${sceneId}`;
        }
        GameState.currentSceneId = sceneId;
        
        saveProgress();
        
    } catch (error) {
        console.error('장면 로드 실패:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            showError('서버와 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
        } else {
            showError('장면을 불러오는데 실패했습니다.');
        }
        
        setTimeout(() => {
            showResultScreen();
        }, 2000);
    }
}

// ===== 장면 업데이트 =====
function updateScene(sceneData) {
    if (DOM.game.userCards) DOM.game.userCards.innerHTML = '';
    if (DOM.game.aiLine) DOM.game.aiLine.textContent = '';
    
    // 이미지 변경 기능
    if (sceneData.characterImage && DOM.game.characterImage) {
        DOM.game.characterImage.style.opacity = '0';
        
        setTimeout(() => {
            DOM.game.characterImage.src = sceneData.characterImage;
            DOM.game.characterImage.onload = () => {
                DOM.game.characterImage.style.opacity = '1';
            };
        }, 200);
    }

    if (sceneData.sceneType) {
        setSceneAtmosphere(sceneData.sceneType);
    }
    
    if (sceneData.characterMood) {
        updateCharacterMoodByScene(sceneData.characterMood);
    }
    
    typeWriter(sceneData.aiLine, () => {
        if (!sceneData.userCards || sceneData.userCards.length === 0) {
            setTimeout(() => showResultScreen(), 2000);
        } else {
            displayChoiceCards(sceneData.userCards);
        }
    });
}

// ===== 장면 분위기 설정 =====
function setSceneAtmosphere(sceneType) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    gameContainer.className = gameContainer.className.replace(/scene-\S+/g, '');
    gameContainer.classList.add(`scene-${sceneType}`);
}

// ===== 캐릭터 감정 업데이트 (장면별) =====
function updateCharacterMoodByScene(mood) {
    const moodEmojis = {
        'curious': '🤔',
        'shy': '☺️',
        'relaxed': '😌',
        'nervous': '😰',
        'disappointed': '😞',
        'flustered': '😳',
        'hurt': '😢',
        'interested': '👀',
        'vulnerable': '🥺',
        'melancholic': '😔',
        'excited': '😄',
        'shocked': '😱',
        'angry': '😠',
        'love': '🥰',
        'sad': '😭',
        'neutral': '😐',
        'happy': '😊',
        'surprised': '😮',
        'touched': '🥹',
        'emotional': '😭',
        'proud': '😊',
        'warm': '🥰',
        'confident': '😎',
        'hopeful': '🤗'
    };
    
    if (DOM.game.characterMood && moodEmojis[mood]) {
        DOM.game.characterMood.textContent = moodEmojis[mood];
        
        DOM.game.characterMood.style.animation = 'moodChange 0.5s ease';
        setTimeout(() => {
            if (DOM.game.characterMood) {
                DOM.game.characterMood.style.animation = '';
            }
        }, 500);
    }
}

// ===== 타이핑 애니메이션 =====
function typeWriter(text, callback) {
    if (!DOM.game.aiLine || !text) return;
    
    let index = 0;
    const speed = CONFIG.TYPEWRITER_SPEED;
    
    DOM.game.aiLine.textContent = '';
    
    function type() {
        if (index < text.length) {
            DOM.game.aiLine.textContent += text.charAt(index);
            index++;
            setTimeout(type, speed);
        } else {
            if (callback) callback();
        }
    }
    
    type();
}

// ===== 선택지 카드 표시 =====
function displayChoiceCards(cards) {
    if (!DOM.game.userCards || !cards || cards.length === 0) return;
    
    setTimeout(() => {
        cards.forEach((card, index) => {
            const cardElement = createChoiceCard(card, index + 1);
            DOM.game.userCards.appendChild(cardElement);

            setTimeout(() => {
                cardElement.style.animationDelay = `${index * 0.15}s`;
                cardElement.classList.add('show');
            }, 50);
        });
    }, CONFIG.ANIMATION_DELAY);
}

// ===== 선택지 카드 생성 =====
function createChoiceCard(cardData, cardNumber) {
    const card = document.createElement('div');
    card.className = 'choice-card';
    
    if (cardData.tone) {
        card.classList.add(`tone-${cardData.tone}`);
    }
    
    let favorabilityHint = '';
    if (Math.abs(cardData.favorability) >= 20) {
        favorabilityHint = cardData.favorability > 0 ? '💖' : '💔';
    } else if (Math.abs(cardData.favorability) >= 10) {
        favorabilityHint = cardData.favorability > 0 ? '💕' : '😟';
    }
    
    card.innerHTML = `
        <span class="choice-card-number">${cardNumber}</span>
        <p class="choice-text">${cardData.text}</p>
        ${favorabilityHint ? `<span class="choice-hint">${favorabilityHint}</span>` : ''}
    `;
    
    card.addEventListener('click', () => selectChoice(card, cardData));
    
    return card;
}

// ===== 선택지 선택 =====
window.selectChoice = function(cardElement, cardData) {
    if (cardElement.classList.contains('selected')) return;
    
    if (GameState.soundEnabled) {
        window.sounds.select.currentTime = 0;
        window.sounds.select.play();
    }
    
    cardElement.classList.add('selected');
    const allCards = DOM.game.userCards.querySelectorAll('.choice-card');
    allCards.forEach(card => {
        if (card !== cardElement) { 
            card.classList.add('discarded'); 
        }
    });
    
    GameState.playHistory.push({
        text: cardData.text,
        favorability: cardData.favorability,
        sceneId: GameState.currentSceneId
    });
    
    updateFavorability(cardData.favorability);
    
    if (GameState.favorability < CONFIG.FAVORABILITY_THRESHOLDS.GAME_OVER) {
        setTimeout(() => fetchNextScene(CONFIG.SCENE_IDS.GAME_OVER), 1000);
        return;
    }
    
    if (cardData.nextSceneId === CONFIG.SCENE_IDS.DECISIVE_MOMENT) {
        const nextId = GameState.favorability >= CONFIG.FAVORABILITY_THRESHOLDS.PERFECT_ENDING
            ? CONFIG.SCENE_IDS.PERFECT_ENDING
            : CONFIG.SCENE_IDS.BAD_ENDING;
        setTimeout(() => fetchNextScene(nextId), 1000);
        return;
    }
    
    setTimeout(() => {
        fetchNextScene(cardData.nextSceneId);
    }, 1000);
};

// ===== 호감도 업데이트 =====
function updateFavorability(change) {
    const oldFavorability = GameState.favorability;
    GameState.favorability = Math.max(0, Math.min(100, GameState.favorability + change));
    
    // 애니메이션 효과
    animateFavorabilityChange(oldFavorability, GameState.favorability);
    
    // 캐릭터 감정 업데이트
    updateCharacterMood(GameState.favorability);
    
    // UI 업데이트
    updateFavorabilityUI();
}

// ===== 호감도 애니메이션 =====
function animateFavorabilityChange(from, to) {
    const duration = 1000;
    const startTime = Date.now();
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = easeOutCubic(progress);
        const current = from + (to - from) * easeProgress;
        
        if (DOM.game.favorabilityScore) {
            DOM.game.favorabilityScore.textContent = Math.round(current);
        }
        if (DOM.game.favorabilityBar) {
            DOM.game.favorabilityBar.style.width = `${current}%`;
        }
        
        updateFavorabilityColor(current);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// ===== 이징 함수 =====
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// ===== 호감도 색상 업데이트 =====
function updateFavorabilityColor(value) {
    if (!DOM.game.favorabilityBar) return;
    
    let gradient;
    if (value < 30) {
        gradient = 'linear-gradient(90deg, #F44336, #E91E63)';
    } else if (value < 70) {
        gradient = 'linear-gradient(90deg, #FFC107, #FF9800)';
    } else {
        gradient = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
    }
    DOM.game.favorabilityBar.style.background = gradient;
}

// ===== 호감도 UI 업데이트 =====
function updateFavorabilityUI() {
    if (DOM.game.favorabilityScore) {
        DOM.game.favorabilityScore.textContent = GameState.favorability;
    }
    if (DOM.game.favorabilityBar) {
        DOM.game.favorabilityBar.style.width = `${GameState.favorability}%`;
    }
    updateFavorabilityColor(GameState.favorability);
}

// ===== 캐릭터 감정 업데이트 =====
function updateCharacterMood(favorability) {
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
    
    if (DOM.game.characterMood) {
        DOM.game.characterMood.textContent = mood;
    }
    
    // 캐릭터 이미지 효과
    if (DOM.game.characterImage) {
        if (favorability >= 80) {
            DOM.game.characterImage.style.filter = 'brightness(1.1)';
        } else if (favorability < 30) {
            DOM.game.characterImage.style.filter = 'brightness(0.8)';
        } else {
            DOM.game.characterImage.style.filter = 'brightness(1)';
        }
    }
}

// ===== 결과 화면 표시 =====
window.showResultScreen = function() {
    
    stopAllLoopSounds();
    if (GameState.soundEnabled) {
        window.sounds.success.play().catch(e => console.error("성공(엔딩) 음악 재생 오류:", e));
    }

    // 결과 계산
    const result = calculateResult();
    
    // 화면 전환
    transitionToScreen('result');
    
    // 결과 표시
    displayResult(result);
};

// ===== 결과 계산 =====
function calculateResult() {
    const finalScore = GameState.favorability;
    
    // 베스트/워스트 선택 찾기
    let bestChoice = null;
    let worstChoice = null;
    
    if (GameState.playHistory.length > 0) {
        const positiveChoices = GameState.playHistory.filter(choice => choice.favorability > 0);
        if (positiveChoices.length > 0) {
            bestChoice = positiveChoices.reduce((prev, current) => 
                (prev.favorability > current.favorability) ? prev : current
            );
        }
        
        const negativeChoices = GameState.playHistory.filter(choice => choice.favorability < 0);
        if (negativeChoices.length > 0) {
            worstChoice = negativeChoices.reduce((prev, current) => 
                (prev.favorability < current.favorability) ? prev : current
            );
        }
    }
    
    // 타이틀과 조언 결정
    let title, advice;
    if (finalScore >= CONFIG.FAVORABILITY_THRESHOLDS.PERFECT_ENDING) {
        title = '💖 완벽한 엔딩! 💖';
        advice = '당신은 진정한 연애의 신! 상대방의 마음을 완벽하게 사로잡았습니다.';
    } else if (finalScore >= CONFIG.FAVORABILITY_THRESHOLDS.GOOD_ENDING) {
        title = '💚 해피 엔딩! 💚';
        advice = '좋은 관계를 만들었네요! 조금만 더 노력하면 완벽한 관계가 될 수 있을 거예요.';
    } else if (finalScore >= CONFIG.FAVORABILITY_THRESHOLDS.NEUTRAL_ENDING) {
        title = '💛 애매한 엔딩 💛';
        advice = '친구 이상 연인 미만의 관계네요. 상대방의 마음을 더 잘 이해하려고 노력해보세요.';
    } else {
        title = '💔 아쉬운 엔딩 💔';
        advice = '관계 개선이 필요해요. 상대방의 입장에서 생각해보고 다시 도전해보세요!';
    }
    
    return {
        score: finalScore,
        title,
        advice,
        bestChoice,
        worstChoice,
        playTime: Math.floor((Date.now() - GameState.gameStartTime) / 1000),
        choicesCount: GameState.playHistory.length
    };
}

// ===== 결과 표시 =====
window.displayResult = function(result) {
    // 타이틀과 점수
    if (DOM.result.title) DOM.result.title.textContent = result.title;
    
    // 점수 애니메이션
    if (DOM.result.finalScore) {
        let currentScore = 0;
        const targetScore = result.score;
        const increment = targetScore / 50;
        const timer = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(timer);
                
                // 점수별 특수 효과
                const scoreCircle = document.getElementById('score-circle');
                if (scoreCircle) {
                    if (targetScore >= 80) {
                        scoreCircle.classList.add('perfect');
                    } else if (targetScore >= 60) {
                        scoreCircle.classList.add('great');
                    } else if (targetScore >= 40) {
                        scoreCircle.classList.add('good');
                    } else {
                        scoreCircle.classList.add('poor');
                    }
                }
            }
            DOM.result.finalScore.textContent = Math.round(currentScore);
        }, 30);
    }
    
    // 베스트 선택 표시
    const bestCard = document.querySelector('.analysis-card.best');
    if (result.bestChoice && DOM.result.bestChoice && bestCard) {
        DOM.result.bestChoice.textContent = `"${result.bestChoice.text}"`;
        if (DOM.result.bestScore) {
            DOM.result.bestScore.textContent = `+${result.bestChoice.favorability}점`;
        }
        bestCard.style.display = 'block';
    } else if (bestCard) {
        bestCard.style.display = 'none';
    }
    
    // 워스트 선택 표시
    const worstCard = document.querySelector('.analysis-card.worst');
    if (result.worstChoice && DOM.result.worstChoice && worstCard) {
        DOM.result.worstChoice.textContent = `"${result.worstChoice.text}"`;
        if (DOM.result.worstScore) {
            DOM.result.worstScore.textContent = `${result.worstChoice.favorability}점`;
        }
        worstCard.style.display = 'block';
    } else if (worstCard) {
        worstCard.style.display = 'none';
    }
    
    // 조언
    if (DOM.result.advice) {
        DOM.result.advice.textContent = result.advice;
    }
    
    // 닉네임 입력 초기화
    if (DOM.result.nicknameInput) {
        DOM.result.nicknameInput.value = '';
    }
};

// ===== 랭킹 제출 =====
async function submitRanking() {
    const nickname = DOM.result.nicknameInput ? DOM.result.nicknameInput.value.trim() : '';
    
    if (nickname.length < CONFIG.MIN_NICKNAME_LENGTH) {
        showToast(`닉네임은 ${CONFIG.MIN_NICKNAME_LENGTH}자 이상 입력해주세요!`, 'warning');
        return;
    }

    if (nickname.length > CONFIG.MAX_NICKNAME_LENGTH) {
        showToast(`닉네임은 ${CONFIG.MAX_NICKNAME_LENGTH}자 이하로 입력해주세요!`, 'warning');
        return;
    }
    
    const rankingData = {
        nickname: nickname,
        score: GameState.favorability,
        scenario_title: GameState.scenarioTitles[GameState.currentScenario],
        play_time: Math.floor((Date.now() - GameState.gameStartTime) / 1000),
        choices_count: GameState.playHistory.length
    };
    
    try {
        showLoading();
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/rankings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rankingData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '랭킹 등록 실패');
        }
        
        const result = await response.json();
        showToast(`랭킹 등록 완료! 현재 ${result.rank}위입니다!`, 'success');
        
        setTimeout(() => {
            showRankingScreen();
        }, 1000);
        
    } catch (error) {
        console.error('랭킹 등록 오류:', error);
        showToast(error.message || '랭킹 등록에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

// ===== 랭킹 화면 표시 =====
async function showRankingScreen() {
    transitionToScreen('ranking');
    await loadRankings('all');
}

// ===== 랭킹 로드 =====
async function loadRankings(filter = 'all') {
    try {
        showLoading();
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/rankings`);
        
        if (!response.ok) {
            throw new Error('랭킹 로드 실패');
        }
        
        let rankings = await response.json();
        
        // 필터링
        if (filter !== 'all') {
            const filterTitle = GameState.scenarioTitles[filter];
            rankings = rankings.filter(r => r.scenario_title === filterTitle);
        }
        
        displayRankings(rankings);
        
    } catch (error) {
        console.error('랭킹 로드 오류:', error);
        showError('랭킹을 불러오는데 실패했습니다.');
    } finally {
        hideLoading();
    }
}

// ===== 랭킹 표시 =====
function displayRankings(rankings) {
    if (!DOM.ranking.items) return;
    
    DOM.ranking.items.innerHTML = '';
    
    if (rankings.length === 0) {
        DOM.ranking.items.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7F8C8D;">
                아직 등록된 랭킹이 없습니다!<br>
                첫 번째 랭커가 되어보세요!
            </div>
        `;
        return;
    }
    
    rankings.forEach((rank, index) => {
        const rankItem = createRankingItem(rank, index + 1);
        DOM.ranking.items.appendChild(rankItem);
        
        setTimeout(() => {
            rankItem.style.animationDelay = `${index * 0.05}s`;
        }, 10);
    });
}

// ===== 랭킹 아이템 생성 =====
function createRankingItem(rank, position) {
    const item = document.createElement('div');
    item.className = 'ranking-item';
    
    let rankDisplay;
    if (position <= 3) {
        const medals = ['🥇', '🥈', '🥉'];
        rankDisplay = `<span class="rank-medal">${medals[position - 1]}</span>`;
    } else {
        rankDisplay = `<span class="rank-number">${position}</span>`;
    }
    
    item.innerHTML = `
        ${rankDisplay}
        <span>${rank.nickname}</span>
        <span>${rank.scenario_title}</span>
        <span style="font-weight: bold; color: var(--primary-color);">${rank.score}점</span>
    `;
    
    return item;
}

// ===== 랭킹 필터링 =====
function filterRankings(tab) {
    DOM.ranking.tabs.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadRankings(tab);
}

// ===== 화면 전환 =====
function transitionToScreen(screenName) {
    Object.values(DOM.screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    setTimeout(() => {
        if (DOM.screens[screenName]) {
            DOM.screens[screenName].classList.add('active');
        }
    }, 300);
}

// ===== 메인 화면으로 =====
window.backToMain = function() {
    transitionToScreen('start');
    stopAllLoopSounds();
    
    // 상태 초기화
    GameState.currentScenario = null;
    GameState.favorability = 50;
    GameState.playHistory = [];
};

// ===== 시나리오 다시 시작 =====
window.restartScenario = function() {
    if (GameState.currentScenario) {
        hidePauseMenu();
        initializeGame(GameState.currentScenario);
    }
};

// ===== 게임 재개 =====
window.resumeGame = function() {
    GameState.isPaused = false;
    hidePauseMenu();
};

// ===== 일시정지 토글 =====
function togglePause() {
    if (GameState.isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// ===== 게임 일시정지 =====
function pauseGame() {
    GameState.isPaused = true;
    if (DOM.game.pauseMenu) {
        DOM.game.pauseMenu.classList.remove('hidden');
    }
}

// ===== 일시정지 메뉴 숨기기 =====
function hidePauseMenu() {
    if (DOM.game.pauseMenu) {
        DOM.game.pauseMenu.classList.add('hidden');
    }
}

// ===== 진행 상황 저장 =====
function saveProgress() {
    const saveData = {
        scenario: GameState.currentScenario,
        sceneId: GameState.currentSceneId,
        favorability: GameState.favorability,
        history: GameState.playHistory,
        timestamp: Date.now()
    };
    
    localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(saveData));
}

// ===== 저장된 진행 상황 확인 =====
function checkSavedProgress() {
    const saved = localStorage.getItem(CONFIG.SAVE_KEY);
    
    if (saved) {
        const saveData = JSON.parse(saved);
        
        if (Date.now() - saveData.timestamp < CONFIG.AUTO_SAVE_INTERVAL) {
            // 24시간 이내 저장 데이터 존재
        }
    }
}

// ===== 키보드 단축키 =====
function handleKeyPress(e) {
    if (DOM.screens.game && DOM.screens.game.classList.contains('active')) {
        if (e.key === 'Escape') {
            togglePause();
        }
        
        if (DOM.game.userCards) {
            const choiceCards = DOM.game.userCards.querySelectorAll('.choice-card:not(.discarded)');
            if (e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (choiceCards[index]) {
                    choiceCards[index].click();
                }
            }
        }
    }
}

// ===== 로딩 표시 =====
function showLoading() {
    if (DOM.screens.loading) {
        DOM.screens.loading.classList.remove('hidden');
    }
}

// ===== 로딩 숨기기 =====
function hideLoading() {
    if (DOM.screens.loading) {
        setTimeout(() => {
            DOM.screens.loading.classList.add('hidden');
        }, 300);
    }
}

// ===== 토스트 메시지 =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            ${getToastIcon(type)}
            <span>${message}</span>
        </div>
    `;
    
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: white; padding: 15px 25px; border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;
        animation: toastSlideUp 0.3s ease; display: flex;
        align-items: center; gap: 10px;
    `;
    
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
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return `<span style="font-weight: bold; font-size: 1.2em;">${icons[type]}</span>`;
}

function showError(message) {
    showToast(message, 'error');
}

// ===== 디버그 모드 설정 =====
function setupDebugMode() {
    window.DEBUG = {
        setFavorability: (value) => {
            GameState.favorability = value;
            updateFavorabilityUI();
            updateCharacterMood(value);
        },
        skipToEnd: () => {
            showResultScreen();
        },
        testToast: () => {
            showToast('Success message!', 'success');
            setTimeout(() => showToast('Warning message!', 'warning'), 500);
            setTimeout(() => showToast('Error message!', 'error'), 1000);
        },
        getState: () => GameState,
        resetGame: () => {
            backToMain();
        }
    };
}

// ===== CSS 애니메이션 추가 =====
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    
    @keyframes toastSlideDown {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(20px); }
    }
    
    @keyframes moodChange {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
    
    .choice-card.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .choice-card {
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
    }
    
    .choice-card.selected {
        background: linear-gradient(135deg, #FFF5F8, #FFFFFF);
        border-color: var(--primary-color);
        transform: scale(1.05);
    }
    
    .choice-card.discarded {
        opacity: 0;
        transform: translateY(20px) scale(0.9);
        pointer-events: none;
    }
`;
document.head.appendChild(style);