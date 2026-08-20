import re
import string
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.utils.logger import logger
from app.config import settings

STOP_WORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can",
    "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't",
    "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself",
    "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
    "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through",
    "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
    "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who",
    "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves"
}

class NLPEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2))
        self.faq_list: List[Dict[str, Any]] = []
        self.faq_matrix = None
        self.is_built = False

    def preprocess_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(f"[{re.escape(string.punctuation)}]", " ", text)
        tokens = text.split()
        cleaned_tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
        return " ".join(cleaned_tokens) if cleaned_tokens else text

    def build_index(self, faqs: List[Dict[str, Any]]) -> bool:
        if not faqs:
            self.faq_list = []
            self.faq_matrix = None
            self.is_built = False
            return False

        self.faq_list = faqs
        corpus = []
        for item in faqs:
            combined = f"{item['question']} {item['question']} {item.get('keywords', '') or ''} {item['category']}"
            processed = self.preprocess_text(combined)
            corpus.append(processed if processed.strip() else combined.lower())

        try:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 3), sublinear_tf=True)
            self.faq_matrix = self.vectorizer.fit_transform(corpus)
            self.is_built = True
            logger.info(f"NLP Engine index successfully built with {len(faqs)} FAQs")
            return True
        except Exception as e:
            logger.error(f"Failed to build NLP vector index: {str(e)}")
            self.is_built = False
            return False

    def match_question(
        self,
        query: str,
        category_filter: Optional[str] = None,
        threshold: Optional[float] = None
    ) -> Tuple[Optional[Dict[str, Any]], float, List[Dict[str, Any]], bool]:
        if not self.is_built or self.faq_matrix is None or not self.faq_list:
            return None, 0.0, [], True

        actual_threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD
        processed_query = self.preprocess_text(query)
        if not processed_query.strip():
            processed_query = query.lower()

        try:
            query_vector = self.vectorizer.transform([processed_query])
            similarities = cosine_similarity(query_vector, self.faq_matrix).flatten()

            candidate_indices = list(range(len(self.faq_list)))
            if category_filter and category_filter.strip():
                candidate_indices = [
                    i for i in candidate_indices
                    if self.faq_list[i].get("category", "").lower() == category_filter.strip().lower()
                ]

            if not candidate_indices:
                candidate_indices = list(range(len(self.faq_list)))

            scores = [(i, similarities[i]) for i in candidate_indices]
            scores.sort(key=lambda x: x[1], reverse=True)

            top_index, top_score = scores[0]
            top_faq = self.faq_list[top_index]

            related_faqs = []
            for idx, score in scores[1:4]:
                related_faqs.append({
                    "id": self.faq_list[idx]["id"],
                    "question": self.faq_list[idx]["question"],
                    "category": self.faq_list[idx]["category"],
                    "similarity": round(float(score), 4)
                })

            is_fallback = top_score < 0.05
            return top_faq, round(float(top_score), 4), related_faqs, is_fallback
        except Exception as e:
            logger.error(f"Error during FAQ question matching: {str(e)}")
            return None, 0.0, [], True

nlp_engine = NLPEngine()
