import os
import joblib
import logging
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger('app')

class SQLiFeatureExtractor:
    """
    Manages the TF-IDF feature extraction vectorizer lifecycle.
    Converts raw text payloads into numeric feature matrices.
    """
    def __init__(self, max_features=5000, ngram_range=(1, 3), min_df=2, max_df=0.95):
        self.max_features = max_features
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.max_df = max_df
        # Use a custom analyzer at character/word level to capture SQL syntax tokens accurately.
        # SQLi features are heavily punctuation/special character based, so char_wb or custom tokenizer is useful.
        # Using analyzer='char_wb' ensures we get fine-grained token fragments.
        self.vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=self.ngram_range,
            min_df=self.min_df,
            max_df=self.max_df,
            analyzer='char_wb'
        )

    def fit(self, payloads):
        """Fits the TF-IDF vectorizer on training text payloads."""
        logger.info("Fitting TF-IDF Vectorizer on training payloads...")
        self.vectorizer.fit(payloads)
        return self

    def transform(self, payloads):
        """Transforms text payloads to TF-IDF sparse matrix format."""
        return self.vectorizer.transform(payloads)

    def fit_transform(self, payloads):
        """Fits and transforms in a single call."""
        logger.info("Fitting and transforming payloads via TF-IDF Vectorizer...")
        return self.vectorizer.fit_transform(payloads)

    def save(self, folder_path):
        """
        Saves the fitted vectorizer to disk under the specified directory.
        Saves both tfidf.pkl and tfidf_vectorizer.pkl to satisfy requirements.
        """
        os.makedirs(folder_path, exist_ok=True)
        path1 = os.path.join(folder_path, 'tfidf.pkl')
        path2 = os.path.join(folder_path, 'tfidf_vectorizer.pkl')
        
        joblib.dump(self.vectorizer, path1)
        joblib.dump(self.vectorizer, path2)
        logger.info(f"Saved TF-IDF vectorizer to {path1} and {path2}")

    @classmethod
    def load(cls, folder_path):
        """Loads a saved vectorizer model from disk."""
        path1 = os.path.join(folder_path, 'tfidf.pkl')
        path2 = os.path.join(folder_path, 'tfidf_vectorizer.pkl')
        
        load_path = path1 if os.path.exists(path1) else path2
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"No TF-IDF vectorizer found at {path1} or {path2}")
            
        instance = cls()
        instance.vectorizer = joblib.load(load_path)
        logger.info(f"Loaded TF-IDF vectorizer successfully from {load_path}")
        return instance
