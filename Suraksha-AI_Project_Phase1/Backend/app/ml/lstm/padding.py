# LSTM Preparation: padding.py
# Placeholder for truncating and padding sequence listings.

import logging

logger = logging.getLogger('app')

def pad_sequences(sequences, maxlen=200, padding='pre', truncating='pre', value=0):
    """
    Standard sequence pad/truncate logic (resembles keras.preprocessing.sequence.pad_sequences).
    Ensures input matrices have uniform dimensions.
    """
    logger.info(f"LSTM: Formatting input dimensions to length {maxlen} using padding type: {padding}...")
    import numpy as np
    
    num_samples = len(sequences)
    padded = np.full((num_samples, maxlen), value, dtype=int)
    
    for i, seq in enumerate(sequences):
        if not seq:
            continue
        if len(seq) > maxlen:
            if truncating == 'pre':
                seq = seq[-maxlen:]
            else:
                seq = seq[:maxlen]
        if padding == 'pre':
            padded[i, -len(seq):] = seq
        else:
            padded[i, :len(seq)] = seq
            
    return padded
