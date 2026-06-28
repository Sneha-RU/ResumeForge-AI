"""
ATS Scorer
==========
Computes a semantic match score (0–100) between a resume and a
job description using TF-IDF vectorization and cosine similarity.

Why TF-IDF over raw keyword counting
-------------------------------------
A raw count treats every word equally.  TF-IDF weights words by how
distinctive they are in a document relative to a corpus.  "the" gets
near-zero weight; "synchronization" or "YOLOv8" gets high weight.
Cosine similarity then measures the angle between the two TF-IDF
vectors — 1.0 means identical, 0.0 means completely different.

Why ngram_range=(1, 2)
-----------------------
Unigrams alone miss phrases.  "machine learning" and "distributed
systems" are two-word concepts that appear verbatim in Google JDs.
Bigrams capture these as single tokens.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ATSScorer:
    """
    Stateless scorer — one instance is created at startup and reused.
    fit_transform is called fresh per request (no persistent model state).
    """

    def __init__(self) -> None:
        self._vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),      # unigrams + bigrams
            max_features=5_000,      # cap vocabulary for speed
            sublinear_tf=True,       # log(1+tf) dampens very frequent terms
        )

    def score(self, resume_text: str, jd_text: str) -> float:
        """
        Return a match score in [0, 100].

        Parameters
        ----------
        resume_text : str   Plain text of the resume (no XML/HTML tags)
        jd_text     : str   Plain text of the job description

        Returns
        -------
        float   0.0 = no match, 100.0 = identical keyword distribution
        """
        resume_clean = self._preprocess(resume_text)
        jd_clean     = self._preprocess(jd_text)

        # fit_transform on both texts together so vocabulary is shared
        tfidf_matrix = self._vectorizer.fit_transform([resume_clean, jd_clean])

        # tfidf_matrix[0] = resume vector, tfidf_matrix[1] = JD vector
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        return float(similarity[0][0]) * 100

    def top_jd_terms(self, jd_text: str, top_n: int = 30) -> list[str]:
        """
        Return the *top_n* highest-TF-IDF terms from the job description.
        Useful for debug / explainability.
        """
        jd_clean = self._preprocess(jd_text)
        vec = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5_000,
            sublinear_tf=True,
        )
        tfidf = vec.fit_transform([jd_clean])
        feature_names = vec.get_feature_names_out()
        scores = tfidf.toarray()[0]
        ranked = sorted(zip(feature_names, scores), key=lambda x: -x[1])
        return [term for term, _ in ranked[:top_n]]

    # ── Private ────────────────────────────────────────────────────────────

    @staticmethod
    def _preprocess(text: str) -> str:
        """
        Lowercase and strip extra whitespace.
        TfidfVectorizer handles punctuation removal internally.
        """
        return " ".join(text.lower().split())
