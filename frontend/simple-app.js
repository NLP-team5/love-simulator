/**
 * 간단한 Love Simulator 앱
 * 복잡한 모듈 구조 대신 단순한 구현으로 확실한 작동 보장
 */

/**
 * Love Simulator - 연애 시뮬레이션 게임
 *
 * 이 파일은 연애 시뮬레이션 게임의 메인 로직을 담당합니다.
 * 사용자 선택에 따른 스토리 진행, 호감도 계산, 사운드 관리 등의
 * 핵심 기능들을 포함하고 있습니다.
 *
 * @author shinjuyong
 * @version 1.0.0
 * @since 2025-09-19
 */

class SimpleLoveSimulator {
    /**
     * 게임 애플리케이션 초기화
     * 게임 상태, 오디오 설정, 이벤트 리스너 등을 설정합니다.
     */
    constructor() {
        // 게임 상태 관리
        this.currentScreen = 'start';
        this.currentScene = null;
        this.favorability = 50;
        this.gameData = null;
        this.soundEnabled = true;
        this.choiceHistory = []; // 선택 기록 저장

        // 사운드 시스템 초기화
        this.bgmAudio = null;
        this.selectAudio = null;
        this.successAudio = null;

        this.init();
    }

    init() {
        console.log('🚀 Love Simulator 초기화 중...');

        // DOM 요소 확인
        const screens = document.querySelectorAll('.screen');
        console.log(`📺 발견된 화면들: ${screens.length}개`);
        screens.forEach(screen => {
            console.log(`  - ${screen.id}: ${screen.classList.contains('active') ? '활성' : '비활성'}`);
        });

        this.setupEventListeners();
        this.initializeSounds();
        this.showScreen('start');

        console.log('✅ Love Simulator 초기화 완료');
    }

    initializeSounds() {
        try {
            console.log('🔊 사운드 시스템 초기화 중...');

            // 배경음악 (게임 중 루프 재생)
            this.bgmAudio = new Audio('sounds/bgm.mp3');
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.3;

            // 선택 효과음 (클릭 시 짧게 재생)
            this.selectAudio = new Audio('sounds/select.mp3');
            this.selectAudio.volume = 0.6;

            // 성공 효과음 (엔딩 시 재생)
            this.successAudio = new Audio('sounds/success.mp3');
            this.successAudio.volume = 0.8;

            // Web Audio API로 간단한 클릭음 생성
            this.createClickSound();

            console.log('✅ 사운드 시스템 초기화 완료');
        } catch (error) {
            console.error('❌ 사운드 초기화 실패:', error);
        }
    }

    createClickSound() {
        try {
            // Web Audio API를 사용한 간단한 클릭음 생성
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('🔇 Web Audio API 지원하지 않음');
        }
    }

    playClickSound() {
        if (this.soundEnabled && this.audioContext) {
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
            } catch (error) {
                // Web Audio API 실패 시 기본 select.mp3 사용
                this.playSelectSound();
            }
        }
    }

    playBGM() {
        if (this.soundEnabled && this.bgmAudio) {
            try {
                this.bgmAudio.currentTime = 0;
                const playPromise = this.bgmAudio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('🔇 배경음악 자동재생이 차단됨 (사용자 상호작용 필요)');
                    });
                }
            } catch (error) {
                console.error('❌ 배경음악 재생 실패:', error);
            }
        }
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
        }
    }

    stopAllSounds() {
        // 모든 사운드 정지
        this.stopBGM();
        if (this.selectAudio) {
            this.selectAudio.pause();
            this.selectAudio.currentTime = 0;
        }
        if (this.successAudio && !this.successAudio.paused) {
            // Success 음악이 재생 중이면 즉시 정지
            this.successAudio.pause();
            this.successAudio.currentTime = 0;
        }
    }

    stopAllSoundsImmediately() {
        // 즉시 모든 사운드 정지 (페이드 아웃 없이)
        this.stopBGM();
        if (this.selectAudio) {
            this.selectAudio.pause();
            this.selectAudio.currentTime = 0;
        }
        if (this.successAudio) {
            this.successAudio.pause();
            this.successAudio.currentTime = 0;
        }
    }

    playSelectSound() {
        if (this.soundEnabled && this.selectAudio) {
            try {
                this.selectAudio.currentTime = 0;
                this.selectAudio.play().catch(error => {
                    console.log('🔇 효과음 재생 실패:', error);
                });
            } catch (error) {
                console.error('❌ 선택 효과음 재생 실패:', error);
            }
        }
    }

    playSuccessSound() {
        if (this.soundEnabled && this.successAudio) {
            try {
                this.successAudio.currentTime = 0;
                this.successAudio.volume = 0.6;
                this.successAudio.loop = true; // 무한 반복 설정
                const playPromise = this.successAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('🎵 성공 음악 무한 반복 시작');
                    }).catch(error => {
                        console.log('🔇 성공 효과음 재생 실패:', error);
                    });
                }
            } catch (error) {
                console.error('❌ 성공 효과음 재생 실패:', error);
            }
        }
    }


    setupEventListeners() {
        // 시나리오 카드 클릭 이벤트
        document.addEventListener('click', (e) => {
            console.log('🖱️ 클릭 이벤트 감지:', e.target, 'classes:', e.target.classList.toString());
            // 시나리오 카드 클릭
            const scenarioCard = e.target.closest('.scenario-card');
            if (scenarioCard) {
                const scenario = scenarioCard.getAttribute('data-scenario');
                if (scenario) {
                    // 시나리오 선택 시에는 바로 게임으로 전환 (BGM이 시작됨)
                    this.startGame(scenario);
                }
                return;
            }

            // 선택지 클릭
            const choice = e.target.closest('.choice-card');
            if (choice) {
                console.log('🎯 선택지 카드 클릭됨:', choice);
                const choiceText = choice.getAttribute('data-value');
                console.log('📝 선택지 텍스트:', choiceText);
                if (choiceText) {
                    this.playClickSound(); // 짧은 클릭음 재생
                    this.makeChoice(choiceText);
                } else {
                    console.error('❌ 선택지 텍스트가 없음');
                }
                return;
            }

            // 랭킹 보기 버튼
            if (e.target.id === 'show-ranking-button') {
                this.showRankingScreen();
                return;
            }

            // 메인으로 돌아가기 버튼들
            if (e.target.id === 'back-to-main-button' || e.target.id === 'back-to-main-result') {
                this.stopAllSounds(); // 모든 사운드 정지
                this.showScreen('start');
                return;
            }

            // 랭킹 제출 버튼
            if (e.target.id === 'submit-ranking-button') {
                this.playClickSound();
                this.submitRanking();
                return;
            }

            // 다시하기 버튼
            if (e.target.id === 'restart-scenario') {
                if (this.gameData && this.gameData.scenario) {
                    this.startGame(this.gameData.scenario);
                }
                return;
            }

            // 일시정지 버튼
            if (e.target.id === 'pause-button' || e.target.closest('#pause-button')) {
                this.togglePause();
                return;
            }

            // 사운드 토글 버튼
            if (e.target.id === 'sound-toggle-button' || e.target.closest('#sound-toggle-button')) {
                this.toggleSound();
                return;
            }

            // 일시정지 메뉴 버튼들
            if (e.target.id === 'resume-game') {
                this.togglePause();
                return;
            }

            if (e.target.id === 'restart-game') {
                if (this.gameData && this.gameData.scenario) {
                    this.startGame(this.gameData.scenario);
                    this.togglePause(); // 일시정지 해제
                }
                return;
            }

            if (e.target.id === 'back-to-main') {
                this.stopAllSounds(); // 모든 사운드 정지
                this.showScreen('start');
                this.togglePause(); // 일시정지 해제
                return;
            }

            // 랭킹 탭 버튼
            if (e.target.classList.contains('tab-button')) {
                console.log('🔷 탭 버튼 클릭됨:', e.target);
                const tab = e.target.getAttribute('data-tab');
                console.log('📂 선택된 탭:', tab);
                this.switchRankingTab(tab, e.target);
                return;
            }
        });
    }

    async fetchWithRetry(url, maxRetries = 3, delay = 1000, options = {}) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);

                // 429 오류가 아니면 바로 반환
                if (response.status !== 429) {
                    return response;
                }

                // 마지막 시도이면 에러 던지기
                if (attempt === maxRetries) {
                    throw new Error(`Max retries reached. Last status: ${response.status}`);
                }

                // 429 오류이면 대기 후 재시도
                console.log(`⏳ Rate limit 도달. ${delay}ms 후 재시도... (${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // 지수적 백오프

            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.log(`🔄 요청 실패. ${delay}ms 후 재시도... (${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            }
        }
    }

    async startGame(scenarioName) {
        console.log(`🎮 게임 시작: ${scenarioName}`);

        try {
            // API에서 첫 번째 장면 불러오기 (재시도 로직 포함)
            console.log(`📡 API 요청: /api/${scenarioName}/1`);
            const response = await this.fetchWithRetry(`/api/${scenarioName}/1`, 3);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.gameData = await response.json();
            console.log(`📦 게임 데이터 로드 완료:`, this.gameData);

            this.gameData.scenario = scenarioName; // 시나리오 이름 저장
            this.favorability = 50;
            this.currentScene = 1;
            this.choiceHistory = []; // 선택 기록 초기화

            console.log(`🎯 게임 화면으로 전환 시도`);
            this.showGameScreen();

            console.log(`🎭 장면 업데이트 시도`);
            this.updateScene();

        } catch (error) {
            console.error('❌ 게임 시작 오류:', error);
            alert('게임을 시작할 수 없습니다. 다시 시도해주세요.');
        }
    }

    async makeChoice(choiceText) {
        console.log(`✅ makeChoice 호출됨: ${choiceText}`);

        if (!this.gameData || !this.gameData.userCards) {
            console.error('❌ 게임 데이터가 없음:', this.gameData);
            return;
        }

        // 선택지 찾기
        console.log('🔍 사용 가능한 선택지들:', this.gameData.userCards);
        const selectedChoice = this.gameData.userCards.find(c =>
            c.text === choiceText || c.text.includes(choiceText)
        );
        console.log('🎯 찾은 선택지:', selectedChoice);

        if (selectedChoice) {
            // 선택 기록 저장
            const choiceRecord = {
                scene: this.currentScene,
                choice: selectedChoice,
                choiceText: choiceText,
                favorabilityChange: selectedChoice.favorability
            };
            this.choiceHistory.push(choiceRecord);
            console.log(`📝 선택 기록 저장:`, choiceRecord);

            // 호감도 업데이트
            this.favorability += selectedChoice.favorability;
            this.favorability = Math.max(0, Math.min(100, this.favorability));

            this.updateFavorabilityUI();

            // 다음 장면으로
            this.currentScene = selectedChoice.nextSceneId;

            if (this.currentScene === 'end' || this.currentScene === null) {
                this.showResultScreen();
            } else {
                await this.loadNextScene();
            }
        }
    }

    async loadNextScene() {
        try {
            // 999는 엔딩을 나타내는 특별한 scene ID
            if (this.currentScene === 999) {
                console.log('🏁 엔딩 Scene ID (999) 감지 - 결과 화면으로 이동');
                this.showResultScreen();
                return;
            }

            const scenarioName = this.gameData.scenario;
            const response = await this.fetchWithRetry(`/api/${scenarioName}/${this.currentScene}`, 3);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.gameData = await response.json();
            this.gameData.scenario = scenarioName; // 시나리오 이름 보존
            this.updateScene();

        } catch (error) {
            console.error('장면 로딩 오류:', error);
            this.showResultScreen();
        }
    }

    updateScene() {
        console.log(`🎭 updateScene 시작 - Scene ${this.currentScene}`);

        const dialogueElement = document.getElementById('ai-line');
        const choicesElement = document.getElementById('user-cards');
        const sceneNumberElement = document.getElementById('scene-number');
        const characterNameElement = document.getElementById('character-name');
        const characterImageElement = document.getElementById('character-image');
        const characterMoodElement = document.getElementById('character-mood');

        console.log(`🔍 DOM 요소 확인:`);
        console.log(`  - dialogue: ${dialogueElement ? '✅' : '❌'}`);
        console.log(`  - choices: ${choicesElement ? '✅' : '❌'}`);
        console.log(`  - sceneNumber: ${sceneNumberElement ? '✅' : '❌'}`);
        console.log(`  - characterName: ${characterNameElement ? '✅' : '❌'}`);
        console.log(`  - characterImage: ${characterImageElement ? '✅' : '❌'}`);
        console.log(`  - characterMood: ${characterMoodElement ? '✅' : '❌'}`);

        if (dialogueElement) {
            dialogueElement.textContent = this.gameData.aiLine;
            console.log(`💬 대화 텍스트 설정: ${this.gameData.aiLine}`);
        }

        if (sceneNumberElement) {
            sceneNumberElement.textContent = `Scene ${this.currentScene}`;
        }

        if (characterNameElement) {
            characterNameElement.textContent = this.gameData.characterName || '상대방';
        }

        if (characterImageElement && this.gameData.characterImage) {
            characterImageElement.src = this.gameData.characterImage;
            console.log(`🖼️ 캐릭터 이미지 설정: ${this.gameData.characterImage}`);
        }

        if (characterMoodElement && this.gameData.characterMood) {
            const moodEmojis = {
                'happy': '😊',
                'sad': '😢',
                'angry': '😠',
                'surprised': '😲',
                'worried': '😟',
                'frustrated': '😤',
                'neutral': '😐',
                'love': '😍'
            };
            characterMoodElement.textContent = moodEmojis[this.gameData.characterMood] || '😐';
            console.log(`😊 감정 설정: ${this.gameData.characterMood} -> ${moodEmojis[this.gameData.characterMood] || '😐'}`);
        }

        // 엔딩 조건 체크: userCards가 없거나 빈 배열이면 엔딩
        if (!this.gameData.userCards || this.gameData.userCards.length === 0) {
            console.log('🏁 엔딩 조건 감지: 선택지가 없음');
            this.showResultScreen();
            return;
        }

        if (choicesElement && this.gameData.userCards) {
            console.log(`🎯 선택지 생성 시작 - ${this.gameData.userCards.length}개`);
            choicesElement.innerHTML = '';

            this.gameData.userCards.forEach((choice, index) => {
                console.log(`  ${index + 1}. ${choice.text} (호감도: ${choice.favorability})`);

                const card = document.createElement('div');
                card.className = 'choice-card';
                card.setAttribute('data-value', choice.text);
                card.setAttribute('data-favorability', choice.favorability);
                card.setAttribute('data-next-scene', choice.nextSceneId);

                // 선택지 번호
                const numberElement = document.createElement('div');
                numberElement.className = 'choice-card-number';
                numberElement.textContent = index + 1;

                // 선택지 텍스트
                const textElement = document.createElement('div');
                textElement.className = 'choice-text';
                textElement.textContent = choice.text;

                card.appendChild(numberElement);
                card.appendChild(textElement);
                choicesElement.appendChild(card);
            });

            console.log(`✅ 선택지 생성 완료`);
        } else {
            console.log(`❌ 선택지 생성 실패 - choicesElement: ${choicesElement ? '✅' : '❌'}, userCards: ${this.gameData.userCards ? '✅' : '❌'}`);
        }

        console.log(`🎭 updateScene 완료`);
    }

    updateFavorabilityUI() {
        const bar = document.getElementById('favorability-bar');
        const score = document.getElementById('favorability-score');
        const progressBar = document.querySelector('.favorability-bar-background');

        console.log(`💖 호감도 UI 업데이트: ${this.favorability}%`);

        if (bar) {
            bar.style.width = `${this.favorability}%`;
            console.log(`✅ 호감도 바 업데이트 완료`);
        } else {
            console.log(`❌ favorability-bar 요소를 찾을 수 없음`);
        }

        if (score) {
            score.textContent = this.favorability;
            console.log(`✅ 호감도 점수 업데이트 완료`);
        } else {
            console.log(`❌ favorability-score 요소를 찾을 수 없음`);
        }

        if (progressBar) {
            progressBar.setAttribute('aria-valuenow', this.favorability);
            console.log(`✅ 접근성 속성 업데이트 완료`);
        }
    }

    showScreen(screenName) {
        console.log(`🖥️ 화면 전환: ${screenName}`);

        // 모든 화면 숨기기
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 화면 ID 매핑
        const screenMapping = {
            'start': 'start-screen',
            'game': 'game-container',
            'result': 'result-screen',
            'ranking': 'ranking-screen'
        };

        const screenId = screenMapping[screenName] || `${screenName}-screen`;
        const targetScreen = document.getElementById(screenId);

        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            console.log(`✅ 화면 전환 성공: ${screenId}`);
        } else {
            console.error(`❌ 화면을 찾을 수 없음: ${screenId}`);
        }
    }

    showGameScreen() {
        this.showScreen('game');
        this.stopAllSoundsImmediately(); // 이전 사운드들 즉시 정리

        // 잠시 대기 후 BGM만 재생
        setTimeout(() => {
            this.playBGM();
        }, 100);
    }

    async showRankingScreen() {
        this.showScreen('ranking');

        // 탭 버튼에 직접 이벤트 리스너 추가
        setTimeout(() => {
            const tabButtons = document.querySelectorAll('.tab-button');
            console.log('🔍 탭 버튼 찾음:', tabButtons.length, '개');
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    console.log('🔷 직접 이벤트 리스너 - 탭 클릭:', e.target);
                    const tab = e.target.getAttribute('data-tab');
                    this.switchRankingTab(tab, e.target);
                });
            });
        }, 100);

        try {
            const response = await this.fetchWithRetry('/api/rankings', 3);
            const rankings = await response.json();

            const rankingItems = document.getElementById('ranking-items');
            if (rankingItems) {
                rankingItems.innerHTML = '';

                rankings.forEach((ranking, index) => {
                    const item = document.createElement('div');
                    item.className = 'ranking-item';
                    item.innerHTML = `
                        <span class="rank">${index + 1}</span>
                        <span class="name">${ranking.nickname}</span>
                        <span class="scenario">${ranking.scenario_title}</span>
                        <span class="score">${ranking.score}</span>
                    `;
                    rankingItems.appendChild(item);
                });
            }
        } catch (error) {
            console.error('랭킹 로딩 오류:', error);
        }
    }

    switchRankingTab(tab, button) {
        // 모든 탭 버튼에서 active 클래스 제거
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        // 클릭된 버튼에 active 클래스 추가
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');

        // 해당 탭의 랭킹 로드
        this.loadRankingsByTab(tab);
    }

    async loadRankingsByTab(tab) {
        try {
            const response = await this.fetchWithRetry('/api/rankings', 3);
            const allRankings = await response.json();

            // 탭에 따라 랭킹 필터링
            let filteredRankings = allRankings;
            if (tab !== 'all') {
                const scenarioTitles = {
                    'female-friend': '친구에서 연인으로 (여사친)',
                    'male-friend': '친구에서 연인으로 (남사친)',
                    'teacher': 'NLP반 김민수 강사님'
                };
                const targetTitle = scenarioTitles[tab];
                filteredRankings = allRankings.filter(ranking => ranking.scenario_title === targetTitle);
            }

            // 랭킹 표시
            const rankingItems = document.getElementById('ranking-items');
            if (rankingItems) {
                rankingItems.innerHTML = '';

                filteredRankings.forEach((ranking, index) => {
                    const item = document.createElement('div');
                    item.className = 'ranking-item';
                    item.innerHTML = `
                        <span class="rank">${index + 1}</span>
                        <span class="name">${ranking.nickname}</span>
                        <span class="scenario">${ranking.scenario_title}</span>
                        <span class="score">${ranking.score}</span>
                    `;
                    rankingItems.appendChild(item);
                });

                // 랭킹이 없을 때 메시지 표시
                if (filteredRankings.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-ranking-message';
                    emptyMessage.textContent = '아직 등록된 랭킹이 없습니다.';
                    rankingItems.appendChild(emptyMessage);
                }
            }
        } catch (error) {
            console.error('랭킹 로딩 오류:', error);
        }
    }

    showResultScreen() {
        this.showScreen('result');
        this.stopAllSounds(); // 모든 사운드 정지

        // 잠시 대기 후 success 사운드만 재생
        setTimeout(() => {
            this.playSuccessSound(); // 결과 효과음 재생
        }, 200);

        console.log('🏆 결과 화면 표시 시작');

        // 결과 화면 업데이트
        const finalScore = document.getElementById('final-score');
        const resultMessage = document.getElementById('final-advice');
        const scoreCircle = document.getElementById('score-circle');
        const scoreRingFill = document.getElementById('score-ring-fill');

        // 최종 점수 표시
        if (finalScore) {
            finalScore.textContent = this.favorability;
            console.log(`✅ 최종 점수 설정: ${this.favorability}`);
        }

        // 원형 게이지 업데이트
        if (scoreRingFill) {
            const circumference = 100; // SVG 원의 둘레
            const strokeDasharray = `${this.favorability}, ${circumference}`;
            scoreRingFill.setAttribute('stroke-dasharray', strokeDasharray);
            console.log(`✅ 원형 게이지 업데이트: ${strokeDasharray}`);
        }

        // 점수별 색상 클래스 추가
        if (scoreCircle) {
            scoreCircle.classList.remove('perfect', 'great', 'good', 'poor');
            if (this.favorability >= 80) {
                scoreCircle.classList.add('perfect');
            } else if (this.favorability >= 60) {
                scoreCircle.classList.add('great');
            } else if (this.favorability >= 40) {
                scoreCircle.classList.add('good');
            } else {
                scoreCircle.classList.add('poor');
            }
            console.log(`✅ 점수 색상 클래스 적용`);
        }

        // 결과 메시지
        if (resultMessage) {
            let message = '수고하셨습니다!';
            if (this.favorability >= 80) {
                message = '훌륭한 선택이었습니다! 💕';
            } else if (this.favorability >= 60) {
                message = '좋은 선택들이었어요! 😊';
            } else if (this.favorability >= 40) {
                message = '조금 더 신중한 선택이 필요해요! 😅';
            } else {
                message = '다음엔 더 나은 선택을 해보세요! 😢';
            }
            resultMessage.textContent = message;
            console.log(`✅ 결과 메시지 설정: ${message}`);
        }

        // 좋은/아쉬운 선택 분석
        this.analyzeChoices();

        console.log('🏆 결과 화면 표시 완료');
    }

    analyzeChoices() {
        console.log('📊 선택 분석 시작');

        if (this.choiceHistory.length === 0) {
            console.log('❌ 선택 기록이 없음');
            return;
        }

        // 좋은 선택과 아쉬운 선택 찾기
        const bestChoice = this.choiceHistory.reduce((best, current) =>
            current.favorabilityChange > best.favorabilityChange ? current : best
        );

        const worstChoice = this.choiceHistory.reduce((worst, current) =>
            current.favorabilityChange < worst.favorabilityChange ? current : worst
        );

        console.log('✨ 좋은 선택:', bestChoice);
        console.log('😔 아쉬운 선택:', worstChoice);

        // 좋은 선택 표시
        const bestChoiceText = document.getElementById('best-choice-text');
        const bestChoiceScore = document.getElementById('best-choice-score');

        if (bestChoiceText && bestChoiceScore) {
            bestChoiceText.textContent = `"${bestChoice.choiceText}"`;
            bestChoiceScore.textContent = `+${bestChoice.favorabilityChange}점`;
            console.log('✅ 좋은 선택 UI 업데이트 완료');
        }

        // 아쉬운 선택 표시
        const worstChoiceText = document.getElementById('worst-choice-text');
        const worstChoiceScore = document.getElementById('worst-choice-score');

        if (worstChoiceText && worstChoiceScore) {
            worstChoiceText.textContent = `"${worstChoice.choiceText}"`;
            worstChoiceScore.textContent = `${worstChoice.favorabilityChange}점`;
            console.log('✅ 아쉬운 선택 UI 업데이트 완료');
        }

        console.log('📊 선택 분석 완료');
    }

    togglePause() {
        const pauseMenu = document.getElementById('pause-menu');
        const isPaused = pauseMenu && !pauseMenu.classList.contains('hidden');

        if (pauseMenu) {
            if (isPaused) {
                pauseMenu.classList.add('hidden');
                console.log('⏸️ 게임 재개');
            } else {
                pauseMenu.classList.remove('hidden');
                console.log('⏸️ 게임 일시정지');
            }
        }
    }

    toggleSound() {
        const soundButton = document.getElementById('sound-toggle-button');
        const soundIcon = soundButton?.querySelector('span');

        // 사운드 토글
        this.soundEnabled = !this.soundEnabled;

        if (soundIcon) {
            soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
        }

        // 사운드가 꺼지면 모든 사운드 즉시 정지
        if (!this.soundEnabled) {
            this.stopAllSoundsImmediately();
        }
        // 사운드가 켜지면 게임 화면에서만 배경음악 재생
        else if (this.soundEnabled && this.currentScreen === 'game') {
            this.playBGM();
        }

        console.log(`🔊 사운드 ${this.soundEnabled ? '켜짐' : '꺼짐'}`);
    }

    async submitRanking() {
        const nicknameInput = document.getElementById('nickname-input');
        const submitButton = document.getElementById('submit-ranking-button');

        if (!nicknameInput || !nicknameInput.value.trim()) {
            alert('닉네임을 입력해주세요.');
            nicknameInput?.focus();
            return;
        }

        // 버튼 비활성화 및 로딩 상태 표시
        if (submitButton) {
            submitButton.disabled = true;
            const originalText = submitButton.querySelector('span').textContent;
            submitButton.querySelector('span').textContent = '등록 중...';
            submitButton.style.opacity = '0.6';
        }

        console.log('🏆 랭킹 등록 시도...');

        try {
            // 시나리오 이름을 제목으로 변환
            const scenarioTitles = {
                'female-friend': '친구에서 연인으로 (여사친)',
                'male-friend': '친구에서 연인으로 (남사친)',
                'teacher': 'NLP반 김민수 강사님'
            };

            const rankingData = {
                nickname: nicknameInput.value.trim(),
                score: this.favorability,
                scenario_title: scenarioTitles[this.gameData?.scenario] || '알 수 없는 시나리오',
                choices_count: this.choiceHistory.length
            };

            console.log('📤 랭킹 데이터:', rankingData);

            const response = await this.fetchWithRetry('/api/rankings', 3, 1000, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rankingData)
            });

            console.log('📥 응답 상태:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ 랭킹 등록 성공:', result);

                // 성공 피드백
                if (submitButton) {
                    submitButton.querySelector('span').textContent = '등록 완료!';
                    submitButton.style.background = 'var(--success-color, #28a745)';
                }

                alert(`랭킹에 등록되었습니다! (${result.rank}위)`);
                this.showRankingScreen();
            } else {
                const errorText = await response.text();
                console.error('❌ 랭킹 등록 실패:', response.status, errorText);
                throw new Error(`랭킹 등록 실패: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ 랭킹 등록 오류:', error);
            alert('랭킹 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
            // 버튼 복원
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.querySelector('span').textContent = '랭킹 등록';
                submitButton.style.opacity = '1';
                submitButton.style.background = '';
            }
        }
    }
}

// 페이지 로드 시 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    window.loveSimulator = new SimpleLoveSimulator();
});