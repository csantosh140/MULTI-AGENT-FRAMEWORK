import re
import urllib.parse
import html
import logging
import pandas as pd

logger = logging.getLogger('app')

def preprocess_payload(payload):
    """
    Cleans and normalizes a single SQL query or parameter string.
    Steps:
      1. Null handling (convert None to empty string)
      2. URL decode
      3. HTML unescape
      4. Convert to lowercase
      5. Whitespace normalization (map all whitespace sequences to a single space)
      6. Special character normalization (normalize quotes, slashes, comments etc.)
      7. Strip unnecessary leading/trailing space
    """
    if payload is None or not isinstance(payload, str):
        payload = str(payload) if payload is not None else ""
    
    # 1. URL decoding
    try:
        decoded = urllib.parse.unquote(payload)
        # Double URL decoding check if % is present
        if "%" in decoded:
            decoded = urllib.parse.unquote(decoded)
    except Exception:
        decoded = payload
        
    # 2. HTML decoding
    try:
        decoded = html.unescape(decoded)
    except Exception:
        pass
        
    # 3. Lowercase
    cleaned = decoded.lower()
    
    # 4. Whitespace normalization (replace tab, newline, carriage return, and multiples spaces with a single space)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # 5. Special character normalization
    # Map backticks to single quotes, double dashes to space-separated, etc.
    # Preserve quotes and main SQL syntax chars as they are critical features for detection.
    cleaned = cleaned.replace('`', "'")
    cleaned = cleaned.replace('"', "'")
    
    # 6. Remove unnecessary spaces at bounds
    cleaned = cleaned.strip()
    
    return cleaned

def validate_and_preprocess_df(df, is_training=True):
    """
    Validates a pandas DataFrame, applies cleaning, and filters invalid elements.
    Expected columns:
      - payload (text)
      - label (integer: 0 or 1) - only required if is_training=True
    """
    logger.info("Initializing dataset validation and preprocessing pipeline...")
    
    # 1. Column structure validation
    if 'payload' not in df.columns:
        raise ValueError("Dataset validation failed: Missing required 'payload' column.")
    
    initial_count = len(df)
    logger.info(f"Initial raw dataset row count: {initial_count}")
    
    # 2. Label validation (if training)
    if is_training:
        if 'label' not in df.columns:
            raise ValueError("Dataset validation failed: Training mode requires a 'label' column.")
        
        # Null handling for labels
        df = df.dropna(subset=['label'])
        
        # Convert label column to integers
        try:
            df['label'] = df['label'].astype(int)
        except Exception as e:
            raise ValueError(f"Dataset validation failed: Invalid label format. Details: {str(e)}")
            
        # Only keep labels that are 0 (Safe) or 1 (SQL Injection)
        valid_labels_mask = df['label'].isin([0, 1])
        df = df[valid_labels_mask]
        
        label_filtered_count = len(df)
        if label_filtered_count < initial_count:
            logger.warning(f"Discarded {initial_count - label_filtered_count} rows with invalid or missing labels.")
            
    # 3. Null handling for payload column
    # Convert null payloads to empty strings
    df['payload'] = df['payload'].fillna('')
    df['payload'] = df['payload'].astype(str)
    
    # 4. Apply text cleaning pipeline
    df['payload'] = df['payload'].apply(preprocess_payload)
    
    # 5. Drop duplicates
    if is_training:
        # Keep first occurrence of duplicate payloads
        df = df.drop_duplicates(subset=['payload'], keep='first')
        deduplicated_count = len(df)
        logger.info(f"Rows remaining after duplicate payload removal: {deduplicated_count}")
        logger.info(f"Removed {label_filtered_count - deduplicated_count} duplicate rows.")
        
    final_count = len(df)
    logger.info(f"Preprocessing completed. Final row count: {final_count}")
    
    return df
