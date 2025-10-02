// ===== 고급 애니메이션 시스템 =====

class AnimationSystem {
    constructor() {
        this.init();
    }
    
    init() {
        this.addStyles();
        this.setupHeartAnimation();
        this.setupConfetti();
        this.setupScreenShake();
        this.enhanceTransitions();
    }
    
    // ===== 하트 애니메이션 =====
    createFloatingHeart(x, y, value) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerHTML = value > 0 ? '❤️' : '💔';
        heart.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${20 + Math.abs(value)}px;
            z-index: 9999;
            pointer-events: none;
            animation: float-up 2s ease-out forwards;
            color: ${value > 0 ? '#FF6B9D' : '#666'};
        `;
        
        // 숫자 표시
        const number = document.createElement('span');
        number.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 3px rgba(0,0,0,0.5);
        `;
        number.textContent = value > 0 ? `+${value}` : value;
        heart.appendChild(number);
        
        document.body.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, 2000);
    }
    
    setupHeartAnimation() {
        // 선택 시 하트 애니메이션
        document.addEventListener('choice-selected', (e) => {
            const { element, favorability } = e.detail;
            const rect = element.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            this.createFloatingHeart(x, y, favorability);
            
            // 여러 개의 작은 하트 생성
            if (Math.abs(favorability) > 10) {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const offsetX = x + (Math.random() - 0.5) * 50;
                        const offsetY = y + (Math.random() - 0.5) * 50;
                        this.createMiniHeart(offsetX, offsetY);
                    }, i * 100);
                }
            }
        });
    }
    
    createMiniHeart(x, y) {
        const heart = document.createElement('div');
        heart.innerHTML = '💕';
        heart.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: 16px;
            z-index: 9998;
            pointer-events: none;
            animation: mini-float 1.5s ease-out forwards;
        `;
        
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1500);
    }
    
    // ===== 콘페티 효과 =====
    setupConfetti() {
        this.confettiColors = ['#FF6B9D', '#C66FBC', '#7C4DFF', '#FFD700', '#00CED1'];
    }
    
    triggerConfetti() {
        const confettiCount = 50;
        const container = document.createElement('div');
        container.className = 'confetti-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
            const size = Math.random() * 10 + 5;
            const startX = Math.random() * window.innerWidth;
            const endX = startX + (Math.random() - 0.5) * 200;
            const duration = Math.random() * 3 + 2;
            
            confetti.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size * 0.6}px;
                background: ${color};
                left: ${startX}px;
                top: -20px;
                border-radius: 2px;
                animation: confetti-fall ${duration}s ease-out forwards;
                --end-x: ${endX}px;
                --rotation: ${Math.random() * 720 - 360}deg;
            `;
            
            container.appendChild(confetti);
        }
        
        document.body.appendChild(container);
        
        setTimeout(() => {
            container.remove();
        }, 5000);
    }
    
    // ===== 화면 흔들기 효과 =====
    setupScreenShake() {
        this.shakeIntensity = {
            light: 2,
            medium: 5,
            heavy: 10
        };
    }
    
    shakeScreen(intensity = 'light', duration = 300) {
        const wrapper = document.querySelector('.main-container') || document.body;
        const shakeAmount = this.shakeIntensity[intensity] || 2;
        
        wrapper.style.animation = `shake ${duration}ms ease-in-out`;
        wrapper.style.setProperty('--shake-amount', `${shakeAmount}px`);
        
        setTimeout(() => {
            wrapper.style.animation = '';
        }, duration);
    }
    
    // ===== 화면 전환 효과 강화 =====
    enhanceTransitions() {
        // 페이지 전환 시 효과
        this.addPageTransition();
        
        // 캐릭터 등장 애니메이션
        this.addCharacterAnimation();
        
        // 선택지 카드 3D 효과
        this.enhance3DCards();
    }
    
    addPageTransition() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList.contains('active') && target.classList.contains('screen')) {
                        this.animatePageIn(target);
                    }
                }
            });
        });
        
        document.querySelectorAll('.screen').forEach(screen => {
            observer.observe(screen, { attributes: true });
        });
    }
    
    animatePageIn(element) {
        element.style.animation = 'page-slide-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        // 내부 요소들 순차 애니메이션
        const children = element.querySelectorAll('*');
        children.forEach((child, index) => {
            if (index < 10) { // 처음 10개 요소만
                child.style.animation = `fade-in-up 0.5s ease-out ${index * 0.05}s both`;
            }
        });
    }
    
    addCharacterAnimation() {
        const characterImage = document.getElementById('character-image');
        if (characterImage) {
            // 호버 효과
            characterImage.addEventListener('mouseenter', () => {
                characterImage.style.animation = 'character-bounce 0.5s ease';
            });
            
            characterImage.addEventListener('animationend', () => {
                characterImage.style.animation = '';
            });
            
            // 클릭 효과
            characterImage.addEventListener('click', () => {
                this.createHeartBurst(characterImage);
            });
        }
    }
    
    createHeartBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 100;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            const heart = document.createElement('div');
            heart.innerHTML = '💖';
            heart.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                font-size: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: burst-out 1s ease-out forwards;
                --end-x: ${x - centerX}px;
                --end-y: ${y - centerY}px;
            `;
            
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1000);
        }
    }
    
    enhance3DCards() {
        // 마우스 움직임에 따른 3D 틸트 효과
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.choice-card:not(.discarded)');
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const angleX = (e.clientY - centerY) / 30;
                const angleY = (centerX - e.clientX) / 30;
                
                card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            });
        });
    }
    
    // ===== 특수 효과 =====
    
    // 글리치 효과
    glitchEffect(element, duration = 1000) {
        element.classList.add('glitch');
        element.setAttribute('data-text', element.textContent);
        
        setTimeout(() => {
            element.classList.remove('glitch');
        }, duration);
    }
    
    // 타이핑 커서 효과
    addTypingCursor(element) {
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.textContent = '|';
        element.appendChild(cursor);
        
        return cursor;
    }
    
    // 펄스 효과
    pulseElement(element, color = '#FF6B9D') {
        const pulse = document.createElement('div');
        pulse.className = 'pulse-effect';
        pulse.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            border: 2px solid ${color};
            border-radius: inherit;
            transform: translate(-50%, -50%);
            animation: pulse-ring 1s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.appendChild(pulse);
        
        setTimeout(() => pulse.remove(), 1000);
    }
    
    // 리플 효과
    createRipple(e, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple-effect 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // ===== 스타일 추가 =====
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float-up {
                0% {
                    transform: translateY(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) scale(1.5);
                    opacity: 0;
                }
            }
            
            @keyframes mini-float {
                0% {
                    transform: translate(0, 0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--random-x, 30px), -50px) rotate(360deg);
                    opacity: 0;
                }
            }
            
            @keyframes confetti-fall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(var(--end-x)) rotate(var(--rotation));
                    opacity: 0;
                }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-1 * var(--shake-amount))); }
                20%, 40%, 60%, 80% { transform: translateX(var(--shake-amount)); }
            }
            
            @keyframes page-slide-in {
                0% {
                    transform: translateX(100%);
                    opacity: 0;
                }
                100% {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fade-in-up {
                0% {
                    transform: translateY(20px);
                    opacity: 0;
                }
                100% {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes character-bounce {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            @keyframes burst-out {
                0% {
                    transform: translate(0, 0) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--end-x), var(--end-y)) scale(1);
                    opacity: 0;
                }
            }
            
            @keyframes pulse-ring {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1.5);
                    opacity: 0;
                }
            }
            
            @keyframes ripple-effect {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .typing-cursor {
                display: inline-block;
                animation: blink 1s infinite;
                font-weight: bold;
                color: var(--primary-color);
            }
            
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            
            .glitch {
                position: relative;
                color: var(--text-primary);
                animation: glitch-skew 1s infinite linear alternate-reverse;
            }
            
            .glitch::before,
            .glitch::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            .glitch::before {
                animation: glitch-1 0.2s infinite;
                color: #FF6B9D;
                z-index: -1;
            }
            
            .glitch::after {
                animation: glitch-2 0.2s infinite;
                color: #7C4DFF;
                z-index: -2;
            }
            
            @keyframes glitch-1 {
                0%, 100% { clip-path: inset(0 0 0 0); }
                20% { clip-path: inset(30% 0 40% 0); transform: translate(-2px, 2px); }
                40% { clip-path: inset(10% 0 80% 0); transform: translate(2px, -2px); }
                60% { clip-path: inset(50% 0 20% 0); transform: translate(-2px, 2px); }
                80% { clip-path: inset(70% 0 10% 0); transform: translate(2px, -2px); }
            }
            
            @keyframes glitch-2 {
                0%, 100% { clip-path: inset(0 0 0 0); }
                20% { clip-path: inset(60% 0 20% 0); transform: translate(2px, 2px); }
                40% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, -2px); }
                60% { clip-path: inset(80% 0 10% 0); transform: translate(2px, 2px); }
                80% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, -2px); }
            }
            
            @keyframes glitch-skew {
                0%, 100% { transform: skew(0deg); }
                20% { transform: skew(2deg); }
                40% { transform: skew(-2deg); }
                60% { transform: skew(1deg); }
                80% { transform: skew(-1deg); }
            }
            
            /* 3D 카드 효과 */
            .choice-card {
                transition: transform 0.1s ease;
                transform-style: preserve-3d;
            }
            
            .choice-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.5) 45%, transparent 50%);
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .choice-card:hover::before {
                opacity: 1;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// 전역 인스턴스 생성
window.animationSystem = new AnimationSystem();

// 기존 선택 함수와 통합
const originalSelectChoice = window.selectChoice;
window.selectChoice = function(cardElement, cardData) {
    // 선택 이벤트 발생
    const event = new CustomEvent('choice-selected', {
        detail: {
            element: cardElement,
            favorability: cardData.favorability
        }
    });
    document.dispatchEvent(event);
    
    // 효과 추가
    if (Math.abs(cardData.favorability) >= 15) {
        window.animationSystem.shakeScreen('medium');
    }
    
    // 원래 함수 실행
    return originalSelectChoice.call(this, cardElement, cardData);
};

// 결과 화면에서 콘페티 효과
const originalDisplayResult = window.displayResult;
window.displayResult = function(result) {
    const ret = originalDisplayResult.call(this, result);
    
    if (result.score >= 80) {
        setTimeout(() => {
            window.animationSystem.triggerConfetti();
        }, 500);
    }
    
    return ret;
};

// console.log('Advanced Animation System loaded! ✨');