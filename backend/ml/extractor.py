"""
Keyword Extractor
=================
Uses spaCy Named Entity Recognition (NER) + part-of-speech filtering
to pull meaningful technical terms from a job description.

Why spaCy NER + POS instead of simple word lists
--------------------------------------------------
A word-list approach misses new frameworks and mis-flags common words.
spaCy's en_core_web_sm model understands grammatical context:
  - NOUN  → concepts: "synchronization", "latency", "pipeline"
  - PROPN → named things: "Python", "YOLOv8", "FastAPI", "AWS"
  - ORG   → company names used as tech: "Google", "Meta"

We combine NER entities with a curated tech supplement because
en_core_web_sm sometimes misses short tech tokens (e.g. "Go", "C++").
"""

import re
import spacy


# Supplement list of tech terms the general-purpose en_core_web_sm model
# may not recognise as PROPN because they look like common words.
_TECH_SUPPLEMENT = {
    # Languages
    "python", "java", "c++", "c#", "golang", "go", "rust", "kotlin",
    "typescript", "javascript", "sql", "r", "scala", "swift",
    # Frameworks & tools
    "fastapi", "flask", "django", "react", "node.js", "nodejs",
    "tensorflow", "pytorch", "sklearn", "scikit-learn", "spacy",
    "yolov8", "openCV", "opencv", "pandas", "numpy", "matplotlib",
    "docker", "kubernetes", "git", "redis", "kafka", "rabbitmq",
    "postgresql", "mongodb", "mysql", "sqlite",
    # Concepts from Google JDs
    "concurrency", "multithreading", "multi-threading", "synchronization",
    "distributed systems", "microservices", "machine learning",
    "artificial intelligence", "computer vision", "nlp",
    "data structures", "algorithms", "software design",
    "rest api", "graphql", "ci/cd", "devops",
}


class KeywordExtractor:
    """
    Extract meaningful keywords from a block of text.
    One instance is created at startup and reused across requests.
    """

    def __init__(self, nlp: spacy.Language) -> None:
        self._nlp = nlp

    def extract(self, text: str, min_length: int = 3) -> list[str]:
        """
        Return a deduplicated list of technical keywords found in *text*.

        Strategy
        --------
        1. Run spaCy pipeline on the text.
        2. Collect tokens whose POS tag is NOUN or PROPN.
        3. Collect named entities of type ORG, PRODUCT, LANGUAGE.
        4. Union with supplement list terms that appear in the text.
        5. Deduplicate, sort, return.

        Parameters
        ----------
        text        : str   Job description plain text
        min_length  : int   Ignore tokens shorter than this

        Returns
        -------
        list[str]   Sorted, deduplicated keywords (lowercase)
        """
        doc = self._nlp(text)
        text_lower = text.lower()

        keywords: set[str] = set()

        # ── spaCy token POS ──────────────────────────────────────────────
        for token in doc:
            if token.pos_ in ("NOUN", "PROPN") and not token.is_stop:
                word = token.lemma_.lower().strip()
                if len(word) >= min_length and word.isalpha():
                    keywords.add(word)

        # ── spaCy named entities ─────────────────────────────────────────
        for ent in doc.ents:
            if ent.label_ in ("ORG", "PRODUCT", "LANGUAGE", "GPE"):
                phrase = ent.text.strip().lower()
                if len(phrase) >= min_length:
                    keywords.add(phrase)

        # ── Tech supplement ──────────────────────────────────────────────
        for term in _TECH_SUPPLEMENT:
            if term in text_lower:
                keywords.add(term)

        # ── Multi-word phrases (bigrams in supplement) ───────────────────
        # Find supplement phrases that are 2+ words and appear in text.
        for term in _TECH_SUPPLEMENT:
            if " " in term and term in text_lower:
                keywords.add(term)

        return sorted(keywords)

    def missing_from(self, jd_text: str, resume_text: str) -> list[str]:
        """
        Return keywords present in *jd_text* that are absent in *resume_text*.
        Convenience wrapper used for testing / debugging.
        """
        jd_keywords   = set(self.extract(jd_text))
        resume_lower  = resume_text.lower()
        return sorted(k for k in jd_keywords if k not in resume_lower)
