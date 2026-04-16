import pytest
import json
import os
from unittest.mock import Mock, patch, MagicMock
from app.utils.ai_helper import (
    get_ai_analysis,
    analyze_whole_survey,
    generate_survey_description,
    _generate_with_fallback
)


class TestGetAIAnalysis:
    """Tests for per-question AI analysis prompt building"""

    @patch('app.utils.ai_helper.get_client')
    def test_text_analysis_prompt_structure(self, mock_get_client):
        """Test that text analysis prompt contains required components"""
        # Mock the Gemini client
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test analysis result"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        question_text = "Які мови програмування ви знаєте?"
        data = ["Python", "Java", "C++", "Python"]
        
        result = get_ai_analysis(question_text, data, data_type="text")
        
        # Verify the API was called
        assert mock_client.models.generate_content.called
        call_args = mock_client.models.generate_content.call_args
        
        # Extract the prompt from the call
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        # Verify prompt contains essential elements
        assert "соціолог-аналітик" in prompt
        assert "українська" in prompt.lower()
        assert question_text in prompt
        assert "теми" in prompt.lower() or "настрій" in prompt.lower()

    @patch('app.utils.ai_helper.get_client')
    def test_stats_analysis_prompt_structure(self, mock_get_client):
        """Test that stats analysis prompt contains required components"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test stats result"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        question_text = "Оберіть спеціальність"
        data = {"Python": 50, "Java": 30, "C++": 20}
        
        result = get_ai_analysis(question_text, data, data_type="stats")
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "соціолог-аналітик" in prompt
        assert "статистичні" in prompt.lower()
        assert question_text in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_text_data_truncated_to_60(self, mock_get_client):
        """Test that text data is truncated to 60 items"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test result"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        # Create 100 items
        large_data = [f"Answer {i}" for i in range(100)]
        
        get_ai_analysis("Test question", large_data, data_type="text")
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        # Verify truncation happened (Answer 59 should be in prompt, Answer 60 should not)
        assert "Answer 59" in prompt
        # The 60th item (index 60) should not be in the prompt
        assert "Answer 60" not in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_returns_error_message_without_api_key(self, mock_get_client):
        """Test graceful handling of missing API key"""
        mock_get_client.return_value = None
        
        result = get_ai_analysis("Test", [], "text")
        
        assert "⚠️" in result
        assert "API ключа" in result

    @patch('app.utils.ai_helper.get_client')
    def test_handles_api_exception(self, mock_get_client):
        """Test graceful handling of API errors"""
        mock_client = Mock()
        mock_client.models.generate_content.side_effect = Exception("API Error")
        mock_get_client.return_value = mock_client
        
        result = get_ai_analysis("Test", [], "text")
        
        assert "Помилка AI" in result


class TestAnalyzeWholeSurvey:
    """Tests for batch survey analysis prompt building"""

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_survey_title(self, mock_get_client):
        """Test that prompt includes survey title"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "Analysis 1", "1": "Analysis 2"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        survey_title = "IT Careers Survey 2024"
        questions_list = [
            {'text': 'Question 1', 'data': {'A': 10}, 'type': 'single_choice'},
            {'text': 'Question 2', 'data': {'answers': ['ans1']}, 'type': 'text'}
        ]
        
        result = analyze_whole_survey(survey_title, questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert survey_title in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_all_questions(self, mock_get_client):
        """Test that prompt includes all question texts"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "Analysis 1", "1": "Analysis 2"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [
            {'text': 'What is your age?', 'data': {'18': 5, '19': 10}, 'type': 'single_choice'},
            {'text': 'Why do you like IT?', 'data': {'answers': ['Fun', 'Money']}, 'type': 'text'}
        ]
        
        analyze_whole_survey("Test Survey", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "What is your age?" in prompt
        assert "Why do you like IT?" in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_text_answers_truncated_to_40(self, mock_get_client):
        """Test that text answers are truncated to 40 items"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "Analysis"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        # Create 60 answers
        large_answers = [f"Answer {i}" for i in range(60)]
        questions_list = [
            {'text': 'Open question', 'data': {'answers': large_answers}, 'type': 'text'}
        ]
        
        analyze_whole_survey("Test", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        # Answer 39 should be in prompt (index 39 = 40th item)
        assert "Answer 39" in prompt
        # Answer 40 should not be in prompt
        assert "Answer 40" not in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_returns_valid_json_dict(self, mock_get_client):
        """Test that function returns a dictionary with integer keys"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "First analysis", "1": "Second analysis", "2": "Third analysis"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [
            {'text': 'Q1', 'data': {'A': 10}, 'type': 'single_choice'},
            {'text': 'Q2', 'data': {'B': 20}, 'type': 'single_choice'},
            {'text': 'Q3', 'data': {'C': 30}, 'type': 'single_choice'}
        ]
        
        result = analyze_whole_survey("Test", questions_list)
        
        assert isinstance(result, dict)
        assert all(isinstance(k, int) for k in result.keys())
        assert result[0] == "First analysis"
        assert result[1] == "Second analysis"
        assert result[2] == "Third analysis"

    @patch('app.utils.ai_helper.get_client')
    def test_filters_invalid_json_keys(self, mock_get_client):
        """Test that non-integer keys are filtered out"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = '{"0": "Valid", "invalid": "Should be filtered", "1": "Also valid"}'
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [
            {'text': 'Q1', 'data': {'A': 10}, 'type': 'single_choice'},
            {'text': 'Q2', 'data': {'B': 20}, 'type': 'single_choice'}
        ]
        
        result = analyze_whole_survey("Test", questions_list)
        
        assert 0 in result
        assert 1 in result
        assert "invalid" not in result

    @patch('app.utils.ai_helper.get_client')
    def test_handles_malformed_json_gracefully(self, mock_get_client):
        """Test handling of malformed JSON in response"""
        mock_client = Mock()
        mock_response = Mock()
        # JSON with extra text around it
        mock_response.text = "Here is the result: {\"0\": \"Analysis\"} Hope this helps!"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [{'text': 'Q1', 'data': {'A': 10}, 'type': 'single_choice'}]
        
        result = analyze_whole_survey("Test", questions_list)
        
        assert result is not None
        assert 0 in result

    @patch('app.utils.ai_helper.get_client')
    def test_returns_none_on_exception(self, mock_get_client):
        """Test that function returns None on API error"""
        mock_client = Mock()
        mock_client.models.generate_content.side_effect = Exception("API Error")
        mock_get_client.return_value = mock_client
        
        result = analyze_whole_survey("Test", [])
        
        assert result is None


class TestGenerateSurveyDescription:
    """Tests for survey description generation"""

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_survey_title(self, mock_get_client):
        """Test that prompt includes survey title"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test description"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        survey_title = "Youth IT Preferences 2024"
        questions_list = [{'text': 'Q1'}, {'text': 'Q2'}]
        
        generate_survey_description(survey_title, questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert survey_title in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_questions_list(self, mock_get_client):
        """Test that prompt includes question texts"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test description"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [
            {'text': 'What programming languages do you use?'},
            {'text': 'How many years of experience do you have?'}
        ]
        
        generate_survey_description("Test Survey", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "What programming languages do you use?" in prompt
        assert "How many years of experience do you have?" in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_platform_context(self, mock_get_client):
        """Test that prompt includes YouthPulse platform context"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test description"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [{'text': 'Q1'}]
        
        generate_survey_description("Test Survey", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "каталогу" in prompt
        assert "суть та тематику" in prompt or "тематику" in prompt

    @patch('app.utils.ai_helper.get_client')
    def test_prompt_contains_language_requirement(self, mock_get_client):
        """Test that prompt specifies Ukrainian language"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.text = "Test description"
        mock_client.models.generate_content.return_value = mock_response
        mock_get_client.return_value = mock_client

        questions_list = [{'text': 'Q1'}]
        
        generate_survey_description("Test Survey", questions_list)
        
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args[1]['contents'] if 'contents' in call_args[1] else call_args[0][1]
        
        assert "українська" in prompt.lower()

    @patch('app.utils.ai_helper.get_client')
    def test_returns_none_without_api_key(self, mock_get_client):
        """Test graceful handling of missing API key"""
        mock_get_client.return_value = None
        
        result = generate_survey_description("Test", [])
        
        assert result is None

    @patch('app.utils.ai_helper.get_client')
    def test_returns_none_on_exception(self, mock_get_client):
        """Test graceful handling of API errors"""
        mock_client = Mock()
        mock_client.models.generate_content.side_effect = Exception("Error")
        mock_get_client.return_value = mock_client
        
        result = generate_survey_description("Test", [])
        
        assert result is None

class TestGenerateWithFallback:
    """Tests for the fallback mechanism when models fail"""

    def test_first_model_succeeds(self):
        client = Mock()
        mock_response = Mock()
        mock_response.text = "Success"
        client.models.generate_content.return_value = mock_response

        response = _generate_with_fallback(client, "Test prompt")

        assert response.text == "Success"
        # Should only be called once, for the first model
        assert client.models.generate_content.call_count == 1
        call_args = client.models.generate_content.call_args
        assert call_args[1]['model'] == 'gemini-3.1-flash-lite-preview'

    def test_fallback_to_second_model(self):
        client = Mock()
        mock_response = Mock()
        mock_response.text = "Fallback Success"
        
        # First call raises an exception, second call succeeds
        client.models.generate_content.side_effect = [
            Exception("503 Overloaded"),
            mock_response
        ]

        response = _generate_with_fallback(client, "Test prompt")

        assert response.text == "Fallback Success"
        assert client.models.generate_content.call_count == 2
        
        # Verify the second call used the fallback model
        calls = client.models.generate_content.call_args_list
        assert calls[0][1]['model'] == 'gemini-3.1-flash-lite-preview'
        assert calls[1][1]['model'] == 'gemini-2.5-flash'

    def test_all_models_fail(self):
        client = Mock()
        # All three models fail
        client.models.generate_content.side_effect = Exception("System overloaded")

        with pytest.raises(Exception) as exc_info:
            _generate_with_fallback(client, "Test prompt")
            
        assert "Сервіс штучного інтелекту наразі перевантажений" in str(exc_info.value)
        assert client.models.generate_content.call_count == 3

