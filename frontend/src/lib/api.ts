// src/lib/api.ts — Typed fetch wrappers for the ASCEND FastAPI backend

import type { SyllabusResponse } from '../types';

const BASE_URL = 'http://localhost:8000';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface UploadResponse {
    status: string;
    source: 'vault' | 'ai_inference';
    filename: string;
    total_subjects_found?: number;
    data: SyllabusResponse[];
    golden_syllabus_id: string | null;
}

export interface RefineRequest {
    raw_text: string;
    previous_json: Record<string, unknown>;
    user_feedback: string;
}

export interface RefineResponse {
    status: string;
    refined_module: {
        module_number: string;
        title: string;
        topics: { title: string; estimated_hours?: string }[];
    };
}

export interface ConfirmRequest {
    user_id: string;
    golden_syllabus_id: string;
    customized_data: unknown[];
    is_edited: boolean;
}

export interface QuizGenerateRequest {
    user_proficiency_map: Record<string, number>;
    target_topics_md: string;
    num_questions?: number;
}

export interface QuizGenerateResponse {
    questions: {
        question_text: string;
        options: { option_letter: string; option_text: string; misconception_addressed?: string | null }[];
        correct_option: string;
        explanation: string;
        primary_concept: string;
        secondary_concepts: string[];
        difficulty_level: number;
        blooms_taxonomy_level: string;
        question_format: string;
        estimated_time_seconds: number;
    }[];
}

// ─── Error Helper ─────────────────────────────────────────────────────────────

class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiError(response.status, body.detail || 'An unexpected error occurred.');
    }
    return response.json() as Promise<T>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /syllabus/upload
 * Uploads a PDF syllabus. Uses FormData (multipart/form-data).
 */
export async function uploadSyllabus(
    file: File,
    departmentCode: string = 'Unknown',
    onProgress?: (data: { progress: number; step: number; message: string }) => void
): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department_code', departmentCode);

    const response = await fetch(`${BASE_URL}/syllabus/upload`, {
        method: 'POST',
        body: formData,
        // NOTE: Do NOT set Content-Type header — the browser sets it with the correct boundary
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiError(response.status, body.detail || 'An unexpected error occurred.');
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new ApiError(500, 'Server response is not a readable stream.');
    }

    const decoder = new TextDecoder();
    let result: UploadResponse | null = null;
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last part in the buffer if it doesn't end with a newline
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const data = JSON.parse(line);

                if (data.error) {
                    throw new ApiError(500, data.error);
                }

                if (data.progress !== undefined && onProgress) {
                    onProgress({
                        progress: data.progress,
                        step: data.step,
                        message: data.message
                    });
                }

                if (data.result) {
                    result = data.result;
                }
            } catch (e) {
                if (e instanceof ApiError) throw e;
                console.error("Failed to parse stream chunk:", line);
            }
        }
    }

    if (!result) throw new ApiError(500, 'No result returned from parsing stream.');
    return result;
}

/**
 * POST /syllabus/refine
 * Sends user feedback to correct a single AI-extracted module.
 */
export async function refineSyllabus(payload: RefineRequest): Promise<RefineResponse> {
    const response = await fetch(`${BASE_URL}/syllabus/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return handleResponse<RefineResponse>(response);
}

/**
 * POST /syllabus/confirm
 * Saves the user's approved syllabus to their Sandbox in Supabase.
 */
export async function confirmSyllabus(payload: ConfirmRequest): Promise<{ status: string; message: string }> {
    const response = await fetch(`${BASE_URL}/syllabus/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return handleResponse<{ status: string; message: string }>(response);
}

/**
 * POST /quiz/generate
 * Generates an adaptive quiz based on the user's proficiency vector.
 */
export async function generateQuiz(payload: QuizGenerateRequest): Promise<QuizGenerateResponse> {
    const response = await fetch(`${BASE_URL}/quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return handleResponse<QuizGenerateResponse>(response);
}

// ─── User Profile & Status ────────────────────────────────────────────────────

export interface UserStatusResponse {
    has_profile: boolean;
    has_roadmap: boolean;
}

export interface SaveProfileRequest {
    user_id: string;
    full_name: string;
    university: string;
}

/**
 * GET /users/{userId}/status
 * Checks if a user has a profile and an active roadmap.
 */
export async function getUserStatus(userId: string): Promise<UserStatusResponse> {
    const response = await fetch(`${BASE_URL}/users/${userId}/status`, {
        method: 'GET',
    });

    return handleResponse<UserStatusResponse>(response);
}

/**
 * POST /users/profile
 * Creates or updates a user profile.
 */
export async function saveUserProfile(payload: SaveProfileRequest): Promise<{ status: string; message: string }> {
    const response = await fetch(`${BASE_URL}/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return handleResponse<{ status: string; message: string }>(response);
}

export interface RoadmapProgressState {
    [topic_title: string]: string; // "pending", "ongoing", "skipped", "done"
}

export interface UserRoadmap {
    id: string;
    golden_syllabus_id: string;
    customized_syllabus: SyllabusResponse; // The confirmed syllabus data
    progress_state: RoadmapProgressState;
    created_at: string;
}

/**
 * GET /users/{userId}/roadmaps
 * Fetches all active study plans for a given user.
 */
export async function getUserRoadmaps(userId: string): Promise<{ status: string; data: UserRoadmap[] }> {
    const response = await fetch(`${BASE_URL}/users/${userId}/roadmaps`, {
        method: 'GET',
    });
    return handleResponse<{ status: string; data: UserRoadmap[] }>(response);
}

export interface UpdateTopicStatusRequest {
    topic_title: string;
    status: string; // "pending", "ongoing", "skipped", "done"
}

/**
 * POST /users/{userId}/roadmaps/{planId}/progress
 * Updates the user's progress status for a specific topic.
 */
export async function updateTopicProgress(
    userId: string,
    planId: string,
    payload: UpdateTopicStatusRequest
): Promise<{ status: string; progress_state: RoadmapProgressState }> {
    const response = await fetch(`${BASE_URL}/users/${userId}/roadmaps/${planId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<{ status: string; progress_state: RoadmapProgressState }>(response);
}

// ─── Adaptive RAG Quiz ────────────────────────────────────────────────────────

import type { QuizQuestion, BloomLevel } from '../types';

export interface RawQuizQuestion {
    id: string;
    question_text: string;
    options: { option_letter: string; option_text: string; misconception_addressed: string | null }[];
    correct_option: string;
    explanation: string;
    metadata: { difficulty: number; format: string; bloom: string };
    primary_concept: string;
}

export async function getAdaptiveQuiz(userId: string, planId: string, topicName: string): Promise<{ questions: QuizQuestion[], source: string }> {
    const params = new URLSearchParams({
        user_id: userId,
        plan_id: planId,
        topic_name: topicName
    });

    const response = await fetch(`${BASE_URL}/quiz/adaptive?${params.toString()}`);
    const data = await handleResponse<{ questions: RawQuizQuestion[], source: string }>(response);

    // Transform backend objects into the flat arrays the UI expects
    const transformed: QuizQuestion[] = data.questions.map(q => {
        const optionTexts = q.options.map(opt => opt.option_text);
        const correctIdx = q.options.findIndex(opt => opt.option_letter === q.correct_option);

        return {
            id: q.id,
            cluster_id: q.primary_concept,
            text: q.question_text,
            options: optionTexts,
            correct_index: correctIdx !== -1 ? correctIdx : 0,
            explanation: q.explanation,
            difficulty: q.metadata.difficulty,
            bloom_level: q.metadata.bloom as BloomLevel
        };
    });

    return { questions: transformed, source: data.source };
}

export interface QuizSubmission {
    user_id: string;
    subject_id: string;
    topic_name: string;
    question_difficulty: number;
    is_correct: boolean;
}

export async function submitQuizAnswer(payload: QuizSubmission): Promise<any> {
    const response = await fetch(`${BASE_URL}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse<any>(response);
}
