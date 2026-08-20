export interface TranslationResponse {
  id?: number;
  source_text: str;
  translated_text: str;
  source_lang: str;
  target_lang: str;
  detected_source?: string;
  provider: str;
  char_count: number;
  created_at: string;
}

export interface TranslationHistoryResponse {
  items: TranslationResponse[];
  total: number;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  keywords?: string;
  created_at: string;
  updated_at: string;
}

export interface FAQCreateInput {
  question: string;
  answer: string;
  category: string;
  keywords?: string;
}

export interface RelatedFAQ {
  id: number;
  question: string;
  category: string;
  similarity: number;
}

export interface ChatQueryResponse {
  session_id: string;
  user_message: string;
  bot_response: string;
  confidence: number;
  intent_category?: string;
  matched_faq_id?: number;
  related_faqs: RelatedFAQ[];
  is_fallback: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: number;
  session_id: string;
  sender: 'user' | 'bot';
  message: string;
  confidence?: number;
  intent_category?: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface DetectionSession {
  id: number;
  source_type: string;
  duration_seconds: number;
  total_frames: number;
  total_objects_tracked: number;
  class_counts: Record<string, number>;
  created_at: string;
}

export interface AnalyticsData {
  total_translations: number;
  total_chat_sessions: number;
  total_chat_messages: number;
  total_faqs: number;
  faq_match_rate: number;
  unmatched_query_count: number;
  total_detection_sessions: number;
  top_faq_categories: Record<string, number>;
  top_detected_classes: Record<string, number>;
}

export interface HealthCheckData {
  status: string;
  environment: string;
  version: string;
  database: string;
  nlp_engine_ready: boolean;
  vision_model_ready: boolean;
  timestamp: string;
}
