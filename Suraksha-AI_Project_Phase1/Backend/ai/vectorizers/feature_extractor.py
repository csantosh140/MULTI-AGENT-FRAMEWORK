import os
import logging

# Heavy ML packages with Cython extensions are imported lazily inside methods
# to avoid Windows Application Control blocking .pyd DLLs at Flask startup.
# They are only loaded when the ML engine actually needs them.


from ai.preprocessing.normalizer import PayloadNormalizer

logger = logging.getLogger('app')

class SQLiHybridFeatureExtractor:
    """
    Combines text feature representations (Character & Word TF-IDF ngrams)
    with numerical statistical heuristics to form dense input matrices for classification.
    """
    def __init__(self, max_char_features=3000, max_word_features=2000):
        # Lazy imports — only load heavy ML packages when actually needed
        from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: PLC0415

        self.normalizer = PayloadNormalizer()
        self.max_char_features = max_char_features
        self.max_word_features = max_word_features
        
        # Dual vectorizers
        self.char_vectorizer = TfidfVectorizer(
            max_features=self.max_char_features,
            ngram_range=(3, 5),
            analyzer='char_wb',
            min_df=2,
            max_df=0.98
        )
        self.word_vectorizer = TfidfVectorizer(
            max_features=self.max_word_features,
            ngram_range=(1, 3),
            analyzer='word',
            min_df=2,
            max_df=0.98
        )
        self.is_fitted = False

    def fit(self, payloads):
        """Fits both TF-IDF vectorizers on normalized text corpus."""
        logger.info("Fitting Dual TF-IDF Feature Extractors...")
        normalized_payloads = [self.normalizer.normalize(p) for p in payloads]
        
        self.char_vectorizer.fit(normalized_payloads)
        self.word_vectorizer.fit(normalized_payloads)
        self.is_fitted = True
        return self

    def extract_tabular_features(self, payloads):
        """
        Extracts list of raw numeric statistical features from payload strings.
        Returns array of shape (num_samples, num_numeric_features)
        """
        import numpy as np  # noqa: PLC0415
        features_list = []
        for p in payloads:
            stats = self.normalizer.extract_features(p)
            # Create statistical array representation
            feat_arr = [
                float(stats['length']),
                float(stats['norm_length']),
                float(stats['entropy']),
                float(stats['norm_entropy']),
                float(stats['digit_count']),
                float(stats['special_char_count']),
                float(stats['sql_keywords']),
                float(stats['sql_functions']),
                float(stats['sql_operators']),
                float(stats['sql_comments']),
                float(stats['boolean_operators'])
            ]
            features_list.append(feat_arr)
        return np.array(features_list, dtype=np.float32)

    def transform(self, payloads):
        """
        Transforms corpus of text payloads into integrated sparse matrices.
        Combines Char TF-IDF + Word TF-IDF + Numerical Statistics.
        """
        from scipy.sparse import hstack, csr_matrix  # noqa: PLC0415
        if not self.is_fitted:
            raise ValueError("Feature extractor is not fitted yet.")
            
        normalized_payloads = [self.normalizer.normalize(p) for p in payloads]
        
        # Transform n-gram shapes
        char_mat = self.char_vectorizer.transform(normalized_payloads)
        word_mat = self.word_vectorizer.transform(normalized_payloads)
        
        # Extract numerical statistics
        num_arr = self.extract_tabular_features(payloads)
        num_mat = csr_matrix(num_arr)
        
        # Stack features horizontally to form complete model input representation
        # Shape: (samples, max_char_features + max_word_features + num_numeric_features)
        combined_matrix = hstack([char_mat, word_mat, num_mat])
        return combined_matrix

    def fit_transform(self, payloads):
        self.fit(payloads)
        return self.transform(payloads)

    def save(self, models_dir):
        """Saves vectorizer instances to target models directory."""
        import joblib  # noqa: PLC0415
        os.makedirs(models_dir, exist_ok=True)
        char_path = os.path.join(models_dir, 'tfidf_char.pkl')
        word_path = os.path.join(models_dir, 'tfidf_word.pkl')
        
        joblib.dump(self.char_vectorizer, char_path)
        joblib.dump(self.word_vectorizer, word_path)
        logger.info(f"Dual vectorizers persisted to {char_path} and {word_path}")

    def load(self, models_dir):
        """Loads vectorizer instances from models directory."""
        import joblib  # noqa: PLC0415
        char_path = os.path.join(models_dir, 'tfidf_char.pkl')
        word_path = os.path.join(models_dir, 'tfidf_word.pkl')
        
        if not os.path.exists(char_path) or not os.path.exists(word_path):
            raise FileNotFoundError(f"TF-IDF vectorizer pkl files not found in: {models_dir}")
            
        self.char_vectorizer = joblib.load(char_path)
        self.word_vectorizer = joblib.load(word_path)
        self.is_fitted = True
        logger.info("Dual vectorizers loaded successfully.")
        return self

