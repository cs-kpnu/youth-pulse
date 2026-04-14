"""
Integration tests for data cleaning pipeline before prompt creation.
These tests verify that data flows correctly from raw input through cleaning to prompt building.
"""
import pytest
import pandas as pd
import io
from unittest.mock import Mock, patch
from app.utils.processor import (
    clean_question_text,
    normalize_text,
    smart_split,
    detect_type,
    format_data_for_type,
    process_uploaded_file
)
from app.utils.ai_helper import get_ai_analysis, analyze_whole_survey, generate_survey_description


class TestDataCleaningBeforePrompt:
    """Integration tests: data cleaning → prompt creation"""

    def test_full_pipeline_csv_upload_to_analysis(self):
        """Test complete flow: CSV upload → cleaning → AI analysis prompt"""
        # Simulate CSV with dirty data
        csv_data = """1. Які мови знаєте?,2. Ваш вік?,Timestamp
Python;Java,-,2024-01-01
n/a,25,2024-01-02
C++,немає,2024-01-03
Python;C++;Java,30,2024-01-04
"""
        df, suggested_drop = process_uploaded_file(io.StringIO(csv_data), "survey.csv")
        
        # Verify column names are cleaned
        assert "Які мови знаєте?" in df.columns
        assert "Ваш вік?" in df.columns
        
        # Verify PII columns are suggested for dropping
        assert "Timestamp" in suggested_drop
        
        # Process first question (multiple choice)
        question_col = "Які мови знаєте?"
        q_data = format_data_for_type(df[question_col], "multiple_choice")
        
        # Verify data is properly cleaned
        assert "Python" in q_data
        assert "Java" in q_data
        assert "C++" in q_data
        # Garbage values should be filtered
        assert "n/a" not in q_data
        assert "-" not in q_data
        
        # Verify the cleaned data can be used in AI analysis
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = '{"0": "Analysis result"}'
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            # This should not raise any exceptions
            result = analyze_whole_survey("Test Survey", [
                {'text': question_col, 'data': q_data, 'type': 'multiple_choice'}
            ])
            
            assert result is not None
            assert 0 in result

    def test_garbage_filtering_before_text_analysis(self):
        """Test that garbage values are filtered before sending to AI"""
        dirty_answers = [
            "Python developer",
            "-",
            "немає",
            "  ",
            "n/a",
            "Data Scientist",
            "null",
            "не знаю",
            "ML Engineer",
            ""
        ]
        
        series = pd.Series(dirty_answers)
        cleaned = series.apply(normalize_text).dropna().tolist()
        
        # Only valid answers should remain
        assert "Python developer" in cleaned
        assert "Data Scientist" in cleaned
        assert "ML Engineer" in cleaned
        
        # All garbage values should be filtered
        assert "-" not in cleaned
        assert "немає" not in cleaned
        assert "n/a" not in cleaned
        assert "null" not in cleaned
        assert "не знаю" not in cleaned
        assert "" not in cleaned
        
        # Verify cleaned data works in AI prompt
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = "Analysis result"
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            result = get_ai_analysis("Career paths?", cleaned, data_type="text")
            assert "Помилка" not in result

    def test_multiple_choice_splitting_before_prompt(self):
        """Test that multi-choice answers are properly split before analysis"""
        raw_answers = [
            "Python, Java, C++",
            "Python;Django",
            "JavaScript, TypeScript",
            "Go",
        ]
        
        # Detect as multiple choice (has semicolons)
        series = pd.Series(raw_answers)
        detected_type = detect_type(series)
        assert detected_type == "multiple_choice"
        
        # Format data
        formatted = format_data_for_type(series, detected_type)
        
        # Verify proper splitting and counting
        assert isinstance(formatted, dict)
        assert "Python" in formatted
        # Verify normalization happened
        assert all(isinstance(k, str) and k == k.strip() for k in formatted.keys())

    def test_question_text_cleaning_in_batch_analysis(self):
        """Test that question texts are cleaned before batch analysis"""
        dirty_questions = [
            "1. What is your age?",
            "2) Choose your specialty",
            "3- Years of experience",
            "4  Why do you like IT?"
        ]
        
        cleaned_questions = [clean_question_text(q) for q in dirty_questions]
        
        # Verify numbering is removed
        assert cleaned_questions[0] == "What is your age?"
        assert cleaned_questions[1] == "Choose your specialty"
        assert cleaned_questions[2] == "Years of experience"
        assert cleaned_questions[3] == "Why do you like IT?"
        
        # Verify cleaned questions work in batch analysis
        questions_list = [
            {'text': q, 'data': {'A': 10}, 'type': 'single_choice'}
            for q in cleaned_questions
        ]
        
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = '{"0": "A1", "1": "A2", "2": "A3", "3": "A4"}'
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            result = analyze_whole_survey("Clean Survey", questions_list)
            
            assert result is not None
            assert len(result) == 4

    def test_data_truncation_limits(self):
        """Test that data truncation limits are enforced before sending to AI"""
        # Test text analysis truncation (60 items)
        large_text_data = [f"Answer {i}" for i in range(100)]
        
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = "Result"
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            get_ai_analysis("Q", large_text_data, data_type="text")
            
            call_args = mock_client.models.generate_content.call_args
            prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
            
            # Verify truncation to 60 items
            assert "Answer 59" in prompt
            assert "Answer 60" not in prompt
        
        # Test batch analysis truncation (40 items)
        large_answers = [f"Long answer {i}" for i in range(60)]
        questions_list = [
            {'text': 'Q1', 'data': {'answers': large_answers}, 'type': 'text'}
        ]
        
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = '{"0": "Analysis"}'
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            analyze_whole_survey("Survey", questions_list)
            
            call_args = mock_client.models.generate_content.call_args
            prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
            
            # Verify truncation to 40 items
            assert "Long answer 39" in prompt
            assert "Long answer 40" not in prompt

    def test_value_counts_limit_to_50(self):
        """Test that value counts are limited to 50 items"""
        many_options = [f"Option {i}" for i in range(60)]
        series = pd.Series(many_options)
        
        result = format_data_for_type(series, "single_choice")
        
        assert len(result) <= 50


class TestEdgeCasesAndSecurity:
    """Test edge cases and potential security issues"""

    def test_handles_html_in_answers(self):
        """Test handling of HTML in answers (should pass through but be normalized)"""
        answers_with_html = [
            "<script>alert('xss')</script>",
            "Normal answer",
            "<b>Bold text</b>",
            '<img src="evil.com">'
        ]
        
        series = pd.Series(answers_with_html)
        cleaned = series.apply(normalize_text).dropna().tolist()
        
        # HTML tags are NOT stripped (potential security issue)
        # This test documents current behavior
        assert "<script>alert('xss')</script>" in cleaned
        assert "<b>Bold text</b>" in cleaned
        
        # Verify the system still works with HTML
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = "Analysis"
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            # Should not crash
            result = get_ai_analysis("Q with HTML", cleaned, data_type="text")
            assert result is not None

    def test_handles_special_characters_in_questions(self):
        """Test handling of special characters in question text"""
        special_questions = [
            "What's your name?",
            "Price (in USD)?",
            "Rate 1-10:",
            "Email @ domain?",
            "Python & Django?",
            "Use * for wildcards?"
        ]
        
        cleaned = [clean_question_text(q) for q in special_questions]
        
        # All special characters should be preserved
        assert cleaned[0] == "What's your name?"
        assert cleaned[1] == "Price (in USD)?"
        assert "Rate 1-10:" in cleaned[2]
        
        # Verify they work in AI prompts
        questions_list = [
            {'text': q, 'data': {'A': 1}, 'type': 'single_choice'}
            for q in cleaned
        ]
        
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = json.dumps({str(i): "Analysis" for i in range(len(cleaned))})
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            result = analyze_whole_survey("Special Chars Survey", questions_list)
            assert result is not None

    def test_handles_unicode_and_ukrainian_text(self):
        """Test proper handling of Ukrainian and Unicode characters"""
        ukrainian_answers = [
            "Я люблю Python",
            "IT-спеціальність",
            "Програмування - це цікаво",
            "Маємо ґратися",
            "Є ще питання?"
        ]
        
        series = pd.Series(ukrainian_answers)
        cleaned = series.apply(normalize_text).dropna().tolist()
        
        # All Ukrainian text should be preserved
        assert len(cleaned) == 5
        assert "Я люблю Python" in cleaned
        assert "IT-спеціальність" in cleaned
        
        with patch('app.utils.ai_helper.get_client') as mock_get_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.text = "Аналіз українських відповідей"
            mock_client.models.generate_content.return_value = mock_response
            mock_get_client.return_value = mock_client
            
            result = get_ai_analysis("Українське питання", cleaned, data_type="text")
            assert result is not None

    def test_handles_very_long_answers(self):
        """Test handling of extremely long text answers"""
        very_long_answer = "A" * 10000
        answers = [very_long_answer, "Short answer"]
        
        series = pd.Series(answers)
        formatted = format_data_for_type(series, "text")
        
        # Long answers should be included (no character limit, only item count limit)
        assert len(formatted["answers"]) == 2
        assert formatted["answers"][0] == very_long_answer

    def test_handles_mixed_data_types_gracefully(self):
        """Test handling of mixed data types in answers"""
        mixed_answers = [
            "Text answer",
            123,  # Number
            45.67,  # Float
            True,  # Boolean
            None,  # Will be filtered
            "Another text"
        ]
        
        series = pd.Series(mixed_answers)
        cleaned = series.apply(normalize_text).dropna().tolist()
        
        # Should handle mixed types without crashing
        assert "Text answer" in cleaned
        assert "Another text" in cleaned
        # Numbers converted to strings
        assert "123" in cleaned or 123 in cleaned


class TestPromptStructure:
    """Verify prompt structure and content requirements"""

    @patch('app.utils.ai_helper.get_client')
    def test_per_question_prompt_has_role(self, mock_get_client):
        """Test that per-question prompts include role definition"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Result"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client
        
        get_ai_analysis("Test Q", ["A", "B"], data_type="text")
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "Роль:" in prompt
        assert "Соціолог" in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_per_question_prompt_language_requirement(self, mock_get_client):
        """Test that prompts specify Ukrainian language"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Result"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client
        
        get_ai_analysis("Test Q", ["A", "B"], data_type="text")
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "Мова:" in prompt
        assert "Українська" in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_batch_prompt_requires_json_output(self, mock_get_client):
        """Test that batch analysis prompt requires JSON output"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "Analysis"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client
        
        questions_list = [{'text': 'Q1', 'data': {'A': 1}, 'type': 'single_choice'}]
        analyze_whole_survey("Survey", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "JSON" in prompt
        assert "валідний JSON" in prompt or "valid JSON" in prompt.lower()

    @patch('app.utils.ai_helper.get_client')
    def test_description_prompt_has_format_requirements(self, mock_get_client):
        """Test that description prompt includes format requirements"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Description"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client
        
        generate_survey_description("Survey", [{'text': 'Q1'}])
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "2-3 речення" in prompt or "2-3" in prompt
        assert "українська" in prompt.lower()


# Import json for one of the tests
import json
