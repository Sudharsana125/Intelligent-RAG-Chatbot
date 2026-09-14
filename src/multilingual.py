"""
multilingual.py
================
Provides language detection so the chatbot can identify the language of an
incoming user query and instruct the LLM to respond in the same language.

Uses langdetect with robust heuristics for short/ASCII inputs to ensure reliable
detection of English, Tamil, Hindi, and other languages without misclassifying
common English queries into obscure language codes.
"""

import re
from typing import Optional
from langdetect import DetectorFactory, LangDetectException, detect
from src.utils import get_logger

logger = get_logger(__name__)

# Make language detection deterministic across runs
DetectorFactory.seed = 0

# Human-readable names for ISO 639-1 language codes
LANGUAGE_NAMES = {
    "en": "English",
    "ta": "Tamil",
    "hi": "Hindi",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "ur": "Urdu",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh-cn": "Chinese",
    "zh-tw": "Chinese",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "ru": "Russian",
    "pt": "Portuguese",
    "it": "Italian",
    "nl": "Dutch",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "tl": "Tagalog",
    "af": "Afrikaans",
    "pl": "Polish",
    "cs": "Czech",
    "ro": "Romanian",
    "hu": "Hungarian",
    "tr": "Turkish",
    "el": "Greek",
    "th": "Thai",
    "id": "Indonesian",
    "vi": "Vietnamese",
    "uk": "Ukrainian",
    "sw": "Swahili",
}

DEFAULT_LANGUAGE_CODE = "en"

# Common English indicator words for reliable detection of short Latin queries
ENGLISH_INDICATORS = {
    "what", "is", "your", "return", "policy", "how", "do", "i", "can", "you",
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "about", "help", "contact", "support", "shipping", "refund", "track", "order",
    "product", "catalog", "price", "cost", "available", "hello", "hi", "hey",
    "thanks", "thank", "buy", "sell", "delivery", "item", "exchange", "warranty",
    "cancel", "account", "login", "password", "reset", "pay", "payment", "card",
    "where", "when", "why", "who", "which", "are", "there", "have", "has", "had",
    "will", "would", "could", "should", "tell", "me", "please", "service", "options"
}


class LanguageDetector:
    """
    Detects the language of user input text and exposes helpers for
    building language-aware LLM instructions.
    """

    def detect_language(self, text: str) -> str:
        """
        Detect the ISO 639-1 language code of the given text with robust fallback.
        """
        if not text or len(text.strip()) < 2:
            return DEFAULT_LANGUAGE_CODE

        clean_text = text.strip()

        # Check if text contains non-ASCII characters (e.g. Tamil, Hindi, Chinese, Arabic)
        has_non_ascii = any(ord(char) > 127 for char in clean_text)

        if not has_non_ascii:
            # Check for English indicators in ASCII text
            words = set(re.findall(r'\b[a-zA-Z]+\b', clean_text.lower()))
            if words.intersection(ENGLISH_INDICATORS) or len(clean_text) < 40:
                return DEFAULT_LANGUAGE_CODE

        try:
            code = detect(clean_text)
            return code
        except LangDetectException:
            logger.warning("Language detection failed; defaulting to English.")
            return DEFAULT_LANGUAGE_CODE

    def get_language_name(self, language_code: str) -> str:
        """
        Convert a language code into a human-readable name.
        """
        code = (language_code or DEFAULT_LANGUAGE_CODE).lower()
        return LANGUAGE_NAMES.get(code, code.upper())

    def detect_with_name(self, text: str) -> tuple:
        """
        Detect language and return both the code and human-readable name.
        """
        code = self.detect_language(text)
        name = self.get_language_name(code)
        return code, name

    def build_language_instruction(self, language_code: str) -> str:
        """
        Build a natural-language instruction for the LLM directing it to
        respond in the detected language.
        """
        language_name = self.get_language_name(language_code)
        if language_code == DEFAULT_LANGUAGE_CODE:
            return "Respond in English."
        return (
            f"The user's message is written in {language_name}. "
            f"You MUST respond entirely in {language_name}, using natural, "
            f"fluent, native-quality phrasing. Do not mix in English unless "
            f"the user used an English technical term with no equivalent."
        )
