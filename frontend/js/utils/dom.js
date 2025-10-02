/**
 * DOM 유틸리티 모듈
 *
 * DOM 조작, 이벤트 처리, 애니메이션 등의 유틸리티 함수들을 제공합니다.
 *
 * @module DOMUtils
 * @author shinjuyong
 * @version 1.0.0
 */

import { CONFIG } from '../modules/config.js';

/**
 * DOM 요소 선택기 유틸리티
 * @namespace DOMSelector
 */
export const DOMSelector = {
    /**
     * 단일 요소 선택
     * @param {string} selector - CSS 선택자
     * @param {Element} context - 검색 컨텍스트 (기본값: document)
     * @returns {Element|null} 선택된 요소
     */
    select(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * 여러 요소 선택
     * @param {string} selector - CSS 선택자
     * @param {Element} context - 검색 컨텍스트 (기본값: document)
     * @returns {NodeList} 선택된 요소들
     */
    selectAll(selector, context = document) {
        return context.querySelectorAll(selector);
    },

    /**
     * ID로 요소 선택
     * @param {string} id - 요소 ID
     * @returns {Element|null} 선택된 요소
     */
    byId(id) {
        return document.getElementById(id);
    },

    /**
     * 클래스명으로 요소들 선택
     * @param {string} className - 클래스명
     * @param {Element} context - 검색 컨텍스트 (기본값: document)
     * @returns {HTMLCollection} 선택된 요소들
     */
    byClass(className, context = document) {
        return context.getElementsByClassName(className);
    }
};

/**
 * DOM 조작 유틸리티
 * @namespace DOMManipulator
 */
export const DOMManipulator = {
    /**
     * 요소에 클래스 추가
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {...string} classNames - 추가할 클래스명들
     */
    addClass(element, ...classNames) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) el.classList.add(...classNames);
    },

    /**
     * 요소에서 클래스 제거
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {...string} classNames - 제거할 클래스명들
     */
    removeClass(element, ...classNames) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) el.classList.remove(...classNames);
    },

    /**
     * 클래스 토글
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} className - 토글할 클래스명
     * @returns {boolean} 토글 후 클래스 존재 여부
     */
    toggleClass(element, className) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        return el ? el.classList.toggle(className) : false;
    },

    /**
     * 클래스 존재 여부 확인
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} className - 확인할 클래스명
     * @returns {boolean} 클래스 존재 여부
     */
    hasClass(element, className) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        return el ? el.classList.contains(className) : false;
    },

    /**
     * 요소 내용 설정
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} content - 설정할 내용
     * @param {boolean} isHTML - HTML 여부 (기본값: false)
     */
    setContent(element, content, isHTML = false) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) {
            if (isHTML) {
                el.innerHTML = content;
            } else {
                el.textContent = content;
            }
        }
    },

    /**
     * 요소 속성 설정
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string|Object} attr - 속성명 또는 속성 객체
     * @param {string} value - 속성값 (attr이 문자열인 경우)
     */
    setAttr(element, attr, value) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (!el) return;

        if (typeof attr === 'object') {
            Object.entries(attr).forEach(([key, val]) => {
                el.setAttribute(key, val);
            });
        } else {
            el.setAttribute(attr, value);
        }
    },

    /**
     * 요소 스타일 설정
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string|Object} style - 스타일 속성명 또는 스타일 객체
     * @param {string} value - 스타일값 (style이 문자열인 경우)
     */
    setStyle(element, style, value) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (!el) return;

        if (typeof style === 'object') {
            Object.entries(style).forEach(([key, val]) => {
                el.style[key] = val;
            });
        } else {
            el.style[style] = value;
        }
    }
};

/**
 * 이벤트 처리 유틸리티
 * @namespace EventUtils
 */
export const EventUtils = {
    /**
     * 이벤트 리스너 추가
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {boolean|Object} options - 이벤트 옵션
     */
    on(element, event, handler, options = false) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) el.addEventListener(event, handler, options);
    },

    /**
     * 이벤트 리스너 제거
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {boolean|Object} options - 이벤트 옵션
     */
    off(element, event, handler, options = false) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) el.removeEventListener(event, handler, options);
    },

    /**
     * 일회성 이벤트 리스너
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    once(element, event, handler) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (el) {
            const onceHandler = (e) => {
                handler(e);
                el.removeEventListener(event, onceHandler);
            };
            el.addEventListener(event, onceHandler);
        }
    },

    /**
     * 이벤트 위임
     * @param {Element|string} container - 컨테이너 요소 또는 선택자
     * @param {string} selector - 이벤트 대상 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     */
    delegate(container, selector, event, handler) {
        const el = typeof container === 'string' ? DOMSelector.select(container) : container;
        if (el) {
            el.addEventListener(event, (e) => {
                if (e.target.matches(selector)) {
                    handler(e);
                }
            });
        }
    },

    /**
     * 디바운스된 이벤트 리스너
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {number} delay - 디바운스 지연 시간 (기본값: CONFIG에서 가져옴)
     */
    debounce(element, event, handler, delay = CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
        let timeoutId;
        this.on(element, event, (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => handler(e), delay);
        });
    },

    /**
     * 스로틀된 이벤트 리스너
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {number} delay - 스로틀 지연 시간 (기본값: CONFIG에서 가져옴)
     */
    throttle(element, event, handler, delay = CONFIG.PERFORMANCE.THROTTLE_DELAY) {
        let lastTime = 0;
        this.on(element, event, (e) => {
            const now = Date.now();
            if (now - lastTime >= delay) {
                handler(e);
                lastTime = now;
            }
        });
    }
};

/**
 * 애니메이션 유틸리티
 * @namespace AnimationUtils
 */
export const AnimationUtils = {
    /**
     * 페이드 인 애니메이션
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {number} duration - 애니메이션 지속 시간 (밀리초)
     * @returns {Promise<void>} 애니메이션 완료 Promise
     */
    fadeIn(element, duration = CONFIG.UI.MODAL_ANIMATION_DURATION) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (!el) return Promise.resolve();

        return new Promise(resolve => {
            el.style.opacity = '0';
            el.style.display = 'block';

            const animation = el.animate([
                { opacity: 0 },
                { opacity: 1 }
            ], {
                duration,
                easing: 'ease-out'
            });

            animation.onfinish = () => {
                el.style.opacity = '1';
                resolve();
            };
        });
    },

    /**
     * 페이드 아웃 애니메이션
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {number} duration - 애니메이션 지속 시간 (밀리초)
     * @returns {Promise<void>} 애니메이션 완료 Promise
     */
    fadeOut(element, duration = CONFIG.UI.MODAL_ANIMATION_DURATION) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (!el) return Promise.resolve();

        return new Promise(resolve => {
            const animation = el.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], {
                duration,
                easing: 'ease-in'
            });

            animation.onfinish = () => {
                el.style.display = 'none';
                el.style.opacity = '0';
                resolve();
            };
        });
    },

    /**
     * 슬라이드 업 애니메이션
     * @param {Element|string} element - 대상 요소 또는 선택자
     * @param {number} duration - 애니메이션 지속 시간 (밀리초)
     * @returns {Promise<void>} 애니메이션 완료 Promise
     */
    slideUp(element, duration = CONFIG.UI.MODAL_ANIMATION_DURATION) {
        const el = typeof element === 'string' ? DOMSelector.select(element) : element;
        if (!el) return Promise.resolve();

        return new Promise(resolve => {
            const animation = el.animate([
                { transform: 'translateY(20px)', opacity: 0 },
                { transform: 'translateY(0)', opacity: 1 }
            ], {
                duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            animation.onfinish = resolve;
        });
    }
};

/**
 * DOM 요소 캐싱 관리자
 * @class DOMCache
 */
export class DOMCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * 요소를 캐시에 추가
     * @param {string} key - 캐시 키
     * @param {string} selector - CSS 선택자
     * @returns {Element|null} 캐시된 요소
     */
    add(key, selector) {
        const element = DOMSelector.select(selector);
        this.cache.set(key, element);
        return element;
    }

    /**
     * 캐시에서 요소 조회
     * @param {string} key - 캐시 키
     * @returns {Element|null} 캐시된 요소
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * 캐시 초기화
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 특정 키의 캐시 제거
     * @param {string} key - 제거할 캐시 키
     */
    remove(key) {
        this.cache.delete(key);
    }

    /**
     * 모든 캐시된 요소들을 객체로 반환
     * @returns {Object} 캐시된 요소들
     */
    getAll() {
        const result = {};
        this.cache.forEach((element, key) => {
            result[key] = element;
        });
        return result;
    }
}

// 전역 DOM 캐시 인스턴스
export const domCache = new DOMCache();

export default {
    DOMSelector,
    DOMManipulator,
    EventUtils,
    AnimationUtils,
    DOMCache,
    domCache
};