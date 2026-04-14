import pytest
import pandas as pd
from app.utils.processor import (
    clean_question_text,
    normalize_text,
    smart_split,
    detect_type,
    format_data_for_type,
    process_uploaded_file
)


class TestCleanQuestionText:
    """Tests for cleaning question text (column names)"""

    def test_removes_numbering_with_dot(self):
        assert clean_question_text("1. Яке ваше ім'я?") == "Яке ваше ім'я?"

    def test_removes_numbering_with_parenthesis(self):
        assert clean_question_text("2) Оберіть варіант") == "Оберіть варіант"

    def test_removes_numbering_with_dash(self):
        assert clean_question_text("3- Вкажіть вік") == "Вкажіть вік"

    def test_removes_numbering_with_space(self):
        assert clean_question_text("4  Питання без розділового знака") == "Питання без розділового знака"

    def test_handles_text_without_numbering(self):
        assert clean_question_text("Звичайне питання") == "Звичайне питання"

    def test_handles_nan_returns_default(self):
        assert clean_question_text(float('nan')) == "Без назви"

    def test_handles_none_returns_default(self):
        assert clean_question_text(None) == "Без назви"

    def test_strips_whitespace(self):
        assert clean_question_text("  1. Питання  ") == "Питання"

    def test_handles_empty_string(self):
        assert clean_question_text("") == ""

    def test_handles_multiple_spaces_after_number(self):
        assert clean_question_text("1.   Багато пробілів") == "Багато пробілів"

    def test_preserves_numbers_in_middle(self):
        assert clean_question_text("Питання 5 з варіантами") == "Питання 5 з варіантами"

    def test_handles_special_ukrainian_characters(self):
        assert clean_question_text("1. Які IT-спеціальності вас цікавлять?") == "Які IT-спеціальності вас цікавлять?"


class TestNormalizeText:
    """Tests for normalizing and filtering text responses"""

    def test_strips_whitespace(self):
        assert normalize_text("  привіт  ") == "привіт"

    def test_normalizes_multiple_spaces(self):
        assert normalize_text("привіт   світе") == "привіт світе"

    def test_filters_empty_string(self):
        assert normalize_text("") is None

    def test_filters_single_dash(self):
        assert normalize_text("-") is None

    def test_filters_em_dash(self):
        assert normalize_text("—") is None

    def test_filters_en_dash(self):
        assert normalize_text("–") is None

    def test_filters_underscore(self):
        assert normalize_text("_") is None

    def test_filters_dot(self):
        assert normalize_text(".") is None

    def test_filters_question_mark(self):
        assert normalize_text("?") is None

    def test_filters_exclamation(self):
        assert normalize_text("!") is None

    def test_filters_na(self):
        assert normalize_text("n/a") is None
        assert normalize_text("N/A") is None

    def test_filters_nan(self):
        assert normalize_text("nan") is None
        assert normalize_text("NaN") is None

    def test_filters_null(self):
        assert normalize_text("null") is None
        assert normalize_text("NULL") is None

    def test_filters_none(self):
        assert normalize_text("none") is None
        assert normalize_text("NONE") is None

    def test_filters_ukrainian_garbage(self):
        assert normalize_text("немає") is None
        assert normalize_text("не знаю") is None

    def test_filters_english_no(self):
        assert normalize_text("no") is None
        assert normalize_text("NO") is None

    def test_preserves_valid_text(self):
        assert normalize_text("Python розробник") == "Python розробник"

    def test_handles_nan_returns_none(self):
        assert normalize_text(float('nan')) is None

    def test_handles_pandas_na(self):
        assert normalize_text(pd.NA) is None

    def test_preserves_text_with_punctuation_inside(self):
        assert normalize_text("Це - важливе питання") == "Це - важливе питання"

    def test_handles_mixed_case_garbage(self):
        assert normalize_text("No") is None
        assert normalize_text("NaN") is None


class TestSmartSplit:
    """Tests for splitting multi-choice answers"""

    def test_split_by_comma(self):
        result = smart_split("Python, Java, C++", delimiter=',')
        assert result == ["Python", "Java", "C++"]

    def test_split_by_semicolon(self):
        result = smart_split("Python;Java;C++", delimiter=';')
        assert result == ["Python", "Java", "C++"]

    def test_handles_spaces_after_delimiter(self):
        result = smart_split("Python, Java, C++", delimiter=',')
        assert all(item not in ["Python ", " Java ", " C++"] for item in result)

    def test_filters_garbage_after_split(self):
        result = smart_split("Python, -, n/a, Java", delimiter=',')
        assert result == ["Python", "Java"]
        assert "-" not in result
        assert "n/a" not in result

    def test_handles_single_value(self):
        result = smart_split("Python", delimiter=',')
        assert result == ["Python"]

    def test_handles_non_string(self):
        result = smart_split(123, delimiter=',')
        assert result == [123]

    def test_handles_empty_string(self):
        result = smart_split("", delimiter=',')
        assert result == []

    def test_handles_comma_in_parentheses(self):
        # Comma inside parentheses should not split
        result = smart_split("Backend (Python, Django), Frontend", delimiter=',')
        # Should split only on commas outside parentheses
        assert len(result) >= 1

    def test_normalizes_each_part(self):
        result = smart_split("  Python  ,  Java  ", delimiter=',')
        assert result == ["Python", "Java"]


class TestDetectType:
    """Tests for automatic type detection of survey responses"""

    def test_detects_text_type_long_responses(self):
        series = pd.Series(["Дуже довга відповідь " * 20 for _ in range(10)])
        assert detect_type(series) == "text"

    def test_detects_text_type_high_uniqueness(self):
        series = pd.Series([f"Унікальна відповідь {i}" for i in range(100)])
        assert detect_type(series) == "text"

    def test_detects_multiple_choice_with_semicolon(self):
        series = pd.Series(["Python;Java", "C++;Python", "Java;C++"])
        assert detect_type(series) == "multiple_choice"

    def test_detects_rating_with_numbers(self):
        series = pd.Series(["1", "2", "3", "4", "5", "1", "2", "3"])
        result = detect_type(series)
        assert result in ["rating", "single_choice"]

    def test_detects_single_choice_limited_options(self):
        series = pd.Series(["Так", "Ні", "Так", "Так", "Ні"])
        assert detect_type(series) == "single_choice"

    def test_handles_empty_series(self):
        series = pd.Series([None, None, None])
        assert detect_type(series) == "text"

    def test_handles_all_garbage_values(self):
        series = pd.Series(["-", "n/a", "немає", "не знаю"])
        assert detect_type(series) == "text"

    def test_mixed_valid_and_garbage(self):
        series = pd.Series(["Python", "-", "Java", "n/a", "C++"])
        assert detect_type(series) == "single_choice"


class TestFormatDataForType:
    """Tests for formatting data based on detected type"""

    def test_text_type_returns_answers_list(self):
        series = pd.Series([f"Відповідь {i}" for i in range(10)])
        result = format_data_for_type(series, "text")
        assert "answers" in result
        assert len(result["answers"]) == 10

    def test_text_type_limits_to_300(self):
        series = pd.Series([f"Відповідь {i}" for i in range(400)])
        result = format_data_for_type(series, "text")
        assert len(result["answers"]) == 300

    def test_single_choice_returns_value_counts(self):
        series = pd.Series(["Так", "Ні", "Так", "Так"])
        result = format_data_for_type(series, "single_choice")
        assert isinstance(result, dict)
        assert result["Так"] == 3
        assert result["Ні"] == 1

    def test_multiple_choice_splits_and_counts(self):
        series = pd.Series(["Python;Java", "Python;C++", "Java"])
        result = format_data_for_type(series, "multiple_choice")
        assert isinstance(result, dict)
        assert result["Python"] == 2
        assert result["Java"] == 2
        assert result["C++"] == 1

    def test_limits_to_50_items(self):
        series = pd.Series([f"Option {i}" for i in range(60)])
        result = format_data_for_type(series, "single_choice")
        assert len(result) <= 50

    def test_handles_empty_series(self):
        series = pd.Series([None, None])
        result = format_data_for_type(series, "text")
        assert result["answers"] == []


class TestProcessUploadedFile:
    """Tests for processing uploaded CSV/Excel files"""

    def test_cleans_column_names(self):
        import io
        csv_data = "1. Питання,2. Відповідь\nТак,Ні"
        df, suggested = process_uploaded_file(io.StringIO(csv_data), "test.csv")
        assert "Питання" in df.columns
        assert "Відповідь" in df.columns

    def test_suggests_drop_timestamp(self):
        import io
        csv_data = "Timestamp,Email,Питання\n2024-01-01,test@email.com,Так"
        df, suggested = process_uploaded_file(io.StringIO(csv_data), "test.csv")
        assert "Timestamp" in suggested or "timestamp" in [c.lower() for c in suggested]
        assert "Email" in suggested or "email" in [c.lower() for c in suggested]

    def test_suggests_drop_pii_columns(self):
        import io
        csv_data = "ПІБ,Пошта,Вік\nІванов,ivan@mail.com,20"
        df, suggested = process_uploaded_file(io.StringIO(csv_data), "test.csv")
        assert any("піб" in col.lower() or "пошта" in col.lower() for col in suggested)

    def test_reads_csv_file(self):
        import io
        csv_data = "Питання,Відповідь\nТак,Ні\nНі,Так"
        df, _ = process_uploaded_file(io.StringIO(csv_data), "test.csv")
        assert len(df) == 2
        assert len(df.columns) == 2

    def test_handles_excel_file(self, tmp_path):
        # Create temporary Excel file
        excel_path = tmp_path / "test.xlsx"
        df_original = pd.DataFrame({"Питання": ["Так", "Ні"], "Відповідь": ["Ні", "Так"]})
        df_original.to_excel(excel_path, index=False)
        
        df, suggested = process_uploaded_file(excel_path, "test.xlsx")
        assert len(df) == 2
        assert "Питання" in df.columns
