/**
 * API 클라이언트 모듈
 *
 * 백엔드 API와의 모든 통신을 담당합니다.
 * 재시도 로직, 에러 핸들링, 타임아웃 처리를 포함합니다.
 *
 * @module ApiClient
 * @author shinjuyong
 * @version 1.0.0
 */

import { CONFIG } from './config.js';

/**
 * API 에러 클래스
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.response = response;
    }
}

/**
 * API 클라이언트 클래스
 * @class ApiClient
 */
class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.retryAttempts = CONFIG.API.RETRY_ATTEMPTS;
    }

    /**
     * HTTP 요청 실행
     * @private
     * @param {string} url - 요청 URL
     * @param {Object} options - fetch 옵션
     * @returns {Promise<Response>} 응답 객체
     */
    async request(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: controller.signal,
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData
                );
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new ApiError('요청 시간이 초과되었습니다.', 408);
            }

            throw error;
        }
    }

    /**
     * 재시도 로직을 포함한 요청
     * @private
     * @param {string} url - 요청 URL
     * @param {Object} options - fetch 옵션
     * @param {number} attempt - 현재 시도 횟수
     * @returns {Promise<any>} 응답 데이터
     */
    async requestWithRetry(url, options = {}, attempt = 1) {
        try {
            const response = await this.request(url, options);
            return await response.json();
        } catch (error) {
            // 클라이언트 에러(4xx)는 재시도하지 않음
            if (error.status >= 400 && error.status < 500) {
                throw error;
            }

            // 최대 재시도 횟수 확인
            if (attempt >= this.retryAttempts) {
                throw error;
            }

            // 지수 백오프로 재시도
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await this.sleep(delay);

            console.warn(`API 요청 재시도 ${attempt}/${this.retryAttempts}: ${url}`);
            return this.requestWithRetry(url, options, attempt + 1);
        }
    }

    /**
     * 지연 함수
     * @private
     * @param {number} ms - 지연 시간 (밀리초)
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * GET 요청
     * @param {string} url - 요청 URL
     * @param {Object} options - 요청 옵션
     * @returns {Promise<any>} 응답 데이터
     */
    async get(url, options = {}) {
        return this.requestWithRetry(url, {
            method: 'GET',
            ...options
        });
    }

    /**
     * POST 요청
     * @param {string} url - 요청 URL
     * @param {Object} data - 전송할 데이터
     * @param {Object} options - 요청 옵션
     * @returns {Promise<any>} 응답 데이터
     */
    async post(url, data, options = {}) {
        return this.requestWithRetry(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    /**
     * 모든 시나리오 조회
     * @returns {Promise<Array>} 시나리오 목록
     */
    async getScenarios() {
        try {
            return await this.get(CONFIG.API.ENDPOINTS.SCENARIOS);
        } catch (error) {
            console.error('시나리오 조회 실패:', error);
            throw new Error('시나리오를 불러올 수 없습니다. 나중에 다시 시도해주세요.');
        }
    }

    /**
     * 특정 장면 조회
     * @param {string} scenario - 시나리오 이름
     * @param {number} sceneId - 장면 ID
     * @returns {Promise<Object>} 장면 데이터
     */
    async getScene(scenario, sceneId) {
        try {
            const url = CONFIG.API.ENDPOINTS.SCENE
                .replace('{scenario}', scenario)
                .replace('{sceneId}', sceneId);
            return await this.get(url);
        } catch (error) {
            if (error.status === 404) {
                // 장면이 없으면 게임 종료
                return null;
            }
            console.error('장면 조회 실패:', error);
            throw new Error('장면을 불러올 수 없습니다.');
        }
    }

    /**
     * 랭킹 목록 조회
     * @returns {Promise<Array>} 랭킹 목록
     */
    async getRankings() {
        try {
            return await this.get(CONFIG.API.ENDPOINTS.RANKINGS);
        } catch (error) {
            console.error('랭킹 조회 실패:', error);
            throw new Error('랭킹을 불러올 수 없습니다.');
        }
    }

    /**
     * 랭킹 등록
     * @param {Object} rankingData - 랭킹 데이터
     * @param {string} rankingData.nickname - 닉네임
     * @param {number} rankingData.score - 점수
     * @param {string} rankingData.scenario_title - 시나리오 제목
     * @param {number} rankingData.play_time - 플레이 시간
     * @param {number} rankingData.choices_count - 선택 횟수
     * @returns {Promise<Object>} 등록 결과
     */
    async submitRanking(rankingData) {
        try {
            // 유효성 검사
            this.validateRankingData(rankingData);
            return await this.post(CONFIG.API.ENDPOINTS.RANKINGS, rankingData);
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            console.error('랭킹 등록 실패:', error);
            throw new Error('랭킹 등록에 실패했습니다.');
        }
    }

    /**
     * 랭킹 데이터 유효성 검사
     * @private
     * @param {Object} data - 랭킹 데이터
     */
    validateRankingData(data) {
        const { nickname, score, scenario_title } = data;

        if (!nickname || !score || !scenario_title) {
            throw new Error('필수 데이터가 누락되었습니다.');
        }

        if (nickname.length < CONFIG.VALIDATION.NICKNAME.MIN_LENGTH ||
            nickname.length > CONFIG.VALIDATION.NICKNAME.MAX_LENGTH) {
            throw new Error(`닉네임은 ${CONFIG.VALIDATION.NICKNAME.MIN_LENGTH}자에서 ${CONFIG.VALIDATION.NICKNAME.MAX_LENGTH}자 사이여야 합니다.`);
        }

        if (!CONFIG.VALIDATION.NICKNAME.PATTERN.test(nickname)) {
            throw new Error('닉네임에는 한글, 영문, 숫자, 밑줄, 공백만 사용 가능합니다.');
        }

        if (typeof score !== 'number' || score < 0 || score > 100) {
            throw new Error('점수는 0과 100 사이의 숫자여야 합니다.');
        }
    }

    /**
     * 네트워크 상태 확인
     * @returns {Promise<boolean>} 연결 상태
     */
    async checkConnection() {
        try {
            await this.request('/api/health', { method: 'HEAD' });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * API 클라이언트 상태 정보
     * @returns {Object} 상태 정보
     */
    getStatus() {
        return {
            baseURL: this.baseURL,
            timeout: this.timeout,
            retryAttempts: this.retryAttempts,
            isOnline: navigator.onLine
        };
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const apiClient = new ApiClient();

// 전역 디버그 접근 (개발 환경에서만)
if (CONFIG.DEBUG.ENABLED) {
    window.apiClient = apiClient;
}

export { ApiError };
export default apiClient;