import re
import io
import requests
from typing import Dict, Any, Tuple, Optional
from app.utils.logger import logger

SUPPORTED_LANGUAGES: Dict[str, str] = {
    "auto": "Auto Detect",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "nl": "Dutch",
    "ru": "Russian",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "tr": "Turkish",
    "pl": "Polish",
    "uk": "Ukrainian",
    "sv": "Swedish",
    "no": "Norwegian",
    "fi": "Finnish",
    "da": "Danish",
    "cs": "Czech",
    "el": "Greek",
    "he": "Hebrew",
    "id": "Indonesian",
    "vi": "Vietnamese",
    "th": "Thai",
    "ro": "Romanian",
    "hu": "Hungarian"
}

COMMON_ENGLISH_WORDS = {
    "hello", "hi", "hey", "how", "are", "you", "what", "is", "where", "why", "who", "when",
    "good", "morning", "afternoon", "evening", "thank", "thanks", "please", "welcome",
    "yes", "no", "friend", "love", "life", "world", "peace", "people", "time", "day"
}

def _map_lang_code(code: str) -> str:
    if code == "zh":
        return "zh-CN"
    return code

class TranslationService:
    def __init__(self):
        self.supported_languages = SUPPORTED_LANGUAGES

    def get_supported_languages(self) -> Dict[str, str]:
        return self.supported_languages

    def detect_language(self, text: str) -> str:
        if not text or not text.strip():
            return "en"

        clean_text = text.lower().strip()
        words = re.findall(r"\b[a-z]+\b", clean_text)
        if words and any(w in COMMON_ENGLISH_WORDS for w in words):
            return "en"

        if re.search(r"[\u0900-\u097F]", text):
            return "hi"
        if re.search(r"[\u4E00-\u9FFF]", text):
            return "zh"
        if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", text):
            return "ja"
        if re.search(r"[\uAC00-\uD7AF]", text):
            return "ko"
        if re.search(r"[\u0600-\u06FF]", text):
            return "ar"
        if re.search(r"[\u0400-\u04FF]", text):
            return "ru"
        if re.search(r"[\u0E00-\u0E7F]", text):
            return "th"
        if re.search(r"[\u0370-\u03FF]", text):
            return "el"
        if re.search(r"[\u0590-\u05FF]", text):
            return "he"

        try:
            from langdetect import detect
            det = detect(text)
            if det and det in self.supported_languages:
                return str(det)
            if det in ["zh-cn", "zh-tw"]:
                return "zh"
        except Exception:
            pass

        return "en"

    def synthesize_speech(self, text: str, lang: str = "en") -> Optional[bytes]:
        if not text or not text.strip():
            return None

        clean_lang = _map_lang_code(lang if lang in self.supported_languages and lang != "auto" else "en")

        try:
            from gtts import gTTS
            tts = gTTS(text=text.strip(), lang=clean_lang, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as e:
            logger.error(f"gTTS audio synthesis failed: {str(e)}")
            return None

    def translate(self, text: str, source_lang: str = "auto", target_lang: str = "es", provider: str = "deep_translator") -> Tuple[str, str, str]:
        if not text or not text.strip():
            return "", source_lang, provider

        actual_source = source_lang
        if source_lang == "auto":
            actual_source = self.detect_language(text)

        if actual_source == target_lang and actual_source != "auto":
            return text, actual_source, "identity"

        src_code = _map_lang_code(actual_source)
        tgt_code = _map_lang_code(target_lang)

        translated_text = ""
        used_provider = provider

        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source=src_code, target=tgt_code)
            translated_text = translator.translate(text.strip())
            used_provider = "GoogleTranslator"

            if translated_text.strip().lower() == text.strip().lower() and actual_source != target_lang:
                auto_translator = GoogleTranslator(source="auto", target=tgt_code)
                translated_text = auto_translator.translate(text.strip())
                used_provider = "GoogleTranslatorAuto"
        except Exception as e1:
            logger.warning(f"GoogleTranslator failed: {str(e1)}, trying MyMemory fallback")
            try:
                from deep_translator import MyMemoryTranslator
                translator = MyMemoryTranslator(source=src_code, target=tgt_code)
                translated_text = translator.translate(text.strip())
                used_provider = "MyMemoryTranslator"
            except Exception as e2:
                logger.warning(f"MyMemoryTranslator failed: {str(e2)}, trying HTTP API fallback")
                try:
                    url = f"https://api.mymemory.translated.net/get?q={requests.utils.quote(text.strip())}&langpair={src_code}|{tgt_code}"
                    res = requests.get(url, timeout=5)
                    if res.status_code == 200:
                        data = res.json()
                        translated_text = data.get("responseData", {}).get("translatedText", "")
                        used_provider = "MyMemoryAPI"
                except Exception as e3:
                    logger.error(f"All translation providers failed: {str(e3)}")
                    translated_text = text
                    used_provider = "Fallback"

        if not translated_text:
            translated_text = text

        return translated_text, actual_source, used_provider

translation_service = TranslationService()
