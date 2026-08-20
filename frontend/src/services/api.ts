import axios from 'axios';
import {
  TranslationResponse,
  TranslationHistoryResponse,
  FAQItem,
  FAQCreateInput,
  ChatQueryResponse,
  ChatSession,
  AnalyticsData,
  HealthCheckData,
  DetectionSession
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  health: {
    check: () => apiClient.get<HealthCheckData>('/health').then(r => r.data),
  },

  translation: {
    getLanguages: () => apiClient.get<Record<string, string>>('/translate/languages').then(r => r.data),
    translate: (text: string, sourceLang = 'auto', targetLang = 'es', provider?: string) =>
      apiClient.post<TranslationResponse>('/translate', {
        text,
        source_lang: sourceLang,
        target_lang: targetLang,
        provider
      }).then(r => r.data),
    getHistory: (q?: string, limit = 50, offset = 0) =>
      apiClient.get<TranslationHistoryResponse>('/translate/history', {
        params: { q, limit, offset }
      }).then(r => r.data),
    deleteHistoryItem: (id: number) =>
      apiClient.delete('/translate/history', { params: { item_id: id } }).then(r => r.data),
    clearHistory: () => apiClient.delete('/translate/history').then(r => r.data),
  },

  faq: {
    list: (q?: string, category?: string) =>
      apiClient.get<FAQItem[]>('/faqs', { params: { q, category } }).then(r => r.data),
    getCategories: () => apiClient.get<string[]>('/faqs/categories').then(r => r.data),
    create: (data: FAQCreateInput) => apiClient.post<FAQItem>('/faqs', data).then(r => r.data),
    update: (id: number, data: Partial<FAQCreateInput>) =>
      apiClient.put<FAQItem>(`/faqs/${id}`, data).then(r => r.data),
    delete: (id: number) => apiClient.delete(`/faqs/${id}`).then(r => r.data),
    rebuildIndex: () => apiClient.post('/faqs/rebuild-index').then(r => r.data),
  },

  chatbot: {
    createSession: (title?: string) =>
      apiClient.post<ChatSession>('/chatbot/sessions', { title }).then(r => r.data),
    getSessions: () => apiClient.get<ChatSession[]>('/chatbot/sessions').then(r => r.data),
    getSession: (sessionId: string) =>
      apiClient.get<ChatSession>(`/chatbot/sessions/${sessionId}`).then(r => r.data),
    deleteSession: (sessionId: string) =>
      apiClient.delete(`/chatbot/sessions/${sessionId}`).then(r => r.data),
    query: (sessionId: string, message: string, categoryFilter?: string) =>
      apiClient.post<ChatQueryResponse>('/chatbot/query', {
        session_id: sessionId,
        message,
        category_filter: categoryFilter
      }).then(r => r.data),
  },

  vision: {
    getWebcamStreamUrl: (conf = 0.5, cameraId = 0) =>
      `/api/v1/vision/stream/webcam?conf=${conf}&camera_id=${cameraId}`,
    getDemoStreamUrl: (conf = 0.5) =>
      `/api/v1/vision/stream/demo?conf=${conf}`,
    getVideoStreamUrl: (filename: string, conf = 0.5) =>
      `/api/v1/vision/stream/video/${filename}?conf=${conf}`,
    uploadVideo: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/vision/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    detectImage: (file: File, conf = 0.5) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post(`/vision/detect-image?conf=${conf}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(r => r.data);
    },
    getSessions: () => apiClient.get<DetectionSession[]>('/vision/sessions').then(r => r.data),
  },

  analytics: {
    get: () => apiClient.get<AnalyticsData>('/analytics').then(r => r.data),
  }
};
