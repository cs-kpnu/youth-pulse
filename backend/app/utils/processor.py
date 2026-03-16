import pandas as pd
import re

def clean_question_text(text):
    if pd.isna(text): return "Без назви"
    text = str(text).strip()
    return re.sub(r'^\d+[\.\)\-\s]+\s*', '', text)

def normalize_text(text):
    if pd.isna(text): return None
    text = str(text).strip()
    garbage = ["", "-", "—", "–", "_", ".", "?", "!", "n/a", "nan", "null", "none", "немає", "не знаю", "no"]
    if text.lower() in garbage: return None
    return " ".join(text.split())

def smart_split(text, delimiter=','):
    if not isinstance(text, str): return [text]
    pattern = r',\s*(?![^()]*\))'
    parts = text.split(';') if delimiter == ';' else re.split(pattern, text)
    return [normalize_text(p) for p in parts if normalize_text(p)]

def detect_type(series):
    clean_series = series.apply(normalize_text).dropna()
    if clean_series.empty: return "text"
    
    total_rows = len(clean_series)
    unique_vals = clean_series.nunique()
    avg_len = clean_series.astype(str).map(len).mean()

    cnt_semicolon = clean_series.str.contains(';', regex=False).sum()
    if cnt_semicolon >= 1:
        return "multiple_choice"

    counts = clean_series.value_counts()
    try:
        first_chars = [str(k).split()[0] for k in counts.keys()]
        if all(c.isdigit() and 0 <= int(c) <= 10 for c in first_chars) and len(counts) <= 12:
            return "rating"
    except: pass

    if (unique_vals > 50 and (unique_vals / total_rows) > 0.8) or avg_len > 80:
        return "text"

    return "single_choice"

def format_data_for_type(series, selected_type):
    clean_series = series.apply(normalize_text).dropna()
    if selected_type == "text":
        return {"answers": clean_series.head(300).tolist()} 
    
    if selected_type == "multiple_choice":
        cnt_semicolon = clean_series.str.contains(';', regex=False).sum()
        delimiter = ';' if cnt_semicolon > 0 else ','
        expanded_list = []
        for item in clean_series:
            expanded_list.extend(smart_split(item, delimiter))
        counts = pd.Series(expanded_list).value_counts()
    else:
        counts = clean_series.value_counts()
        
    return counts.head(50).to_dict()

def process_uploaded_file(file, filename):
    if filename.endswith('.csv'):
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file)
        
    df.columns = [clean_question_text(col) for col in df.columns]
    
    # Basic cleanup suggestion
    all_cols = df.columns.tolist()
    stop_words = ["timestamp", "email", "name", "піб", "пошта"]
    suggested_drop = [c for c in all_cols if any(sw in c.lower() for sw in stop_words)]
    
    return df, suggested_drop

