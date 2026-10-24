# LSTM Preparation: tokenizer.py
# Placeholder for character or sub-word level tokenization of SQL parameters.

import os
import json
import logging

logger = logging.getLogger('app')

class SQLiCharTokenizer:
    """
    Tokenizer that maps characters to unique indices.
    Allows representation of SQL syntax punctuation markers as specific integer keys.
    """
    def __init__(self, num_words=128):
        self.num_words = num_words
        self.char_map = {}
        self.reverse_char_map = {}

    def fit_on_texts(self, texts):
        """Fits token keys over training strings corpus."""
        logger.info("LSTM: Fitting Char Tokenizer over payloads corpus...")
        chars = sorted(list(set("".join(texts))))
        self.char_map = {char: idx + 1 for idx, char in enumerate(chars[:self.num_words - 2])}
        # 0 is reserved for padding, num_words-1 for Out Of Vocabulary (OOV)
        self.char_map['<OOV>'] = self.num_words - 1
        self.reverse_char_map = {idx: char for char, idx in self.char_map.items()}

    def texts_to_sequences(self, texts):
        """Converts corpus of strings to list of list indices."""
        oov_idx = self.char_map.get('<OOV>', 1)
        sequences = []
        for text in texts:
            seq = [self.char_map.get(char, oov_idx) for char in text]
            sequences.append(seq)
        return sequences

    def save(self, filepath):
        """Saves vocabulary configuration to json file."""
        with open(filepath, 'w') as f:
            json.dump(self.char_map, f, indent=2)
        logger.info(f"LSTM: Saved tokenizer mapping config to {filepath}")

    def load(self, filepath):
        """Loads vocabulary configuration from json file."""
        with open(filepath, 'r') as f:
            self.char_map = json.load(f)
        self.reverse_char_map = {idx: char for char, idx in self.char_map.items()}
        logger.info(f"LSTM: Loaded tokenizer mapping config from {filepath}")
