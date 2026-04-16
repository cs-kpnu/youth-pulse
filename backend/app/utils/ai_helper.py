import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return None
    return genai.Client(api_key=api_key)

def _generate_with_fallback(client, contents, config=None):
    models = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']
    last_error = None
    for model in models:
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            print(f"\n[AI SUCCESS - {model}] Відповідь ШІ:\n{response.text}\n{'-'*50}\n")
            return response
        except Exception as e:
            last_error = e
            print(f"Model {model} failed: {e}. Trying next...")
            continue
    raise Exception("Сервіс штучного інтелекту наразі перевантажений, оскільки використовуються безкоштовні моделі. Будь ласка, спробуйте пізніше.")

def get_ai_analysis(question_text, data, data_type="stats"):
    try:
        client = get_client()
        if not client: return "⚠️ Не знайдено API ключа."

        if data_type == "text":
            prompt = f"""Ти — досвідчений соціолог-аналітик. Проаналізуй відкриті текстові відповіді на питання опитування.

Питання: «{question_text}»

Відповіді респондентів (до 60 записів):
{str(data[:60])}

Інструкція:
1. Визнач ключові теми та патерни у відповідях.
2. Оціни загальний настрій (позитивний, нейтральний, негативний).
3. Виділи найчастіші та найнезвичніші думки.

Вимоги до відповіді:
• Рівно 3 розгорнуті абзаци. Кожен абзац має бути детальним (мінімум 3-4 речення).
• Детально описуй контекст. Не використовуй короткі відписки.
• Мова: українська.
• Без вступних фраз типу «Ось аналіз...»."""
        else:
            prompt = f"""Ти — досвідчений соціолог-аналітик. Проаналізуй статистичні результати відповідей на питання опитування.

Питання: «{question_text}»

Статистичні дані (варіант → кількість відповідей):
{data}

Інструкція:
1. Опиши лідерів рейтингу та їхню частку.
2. Визнач загальний розподіл — чи є явний фаворит або рівномірний розкид.
3. Зроби висновок про вподобання респондентів.

Вимоги до відповіді:
• Рівно 3 розгорнуті абзаци. Кожен абзац має бути детальним (мінімум 3-4 речення).
• Детально описуй контекст. Не використовуй короткі відписки.
• Мова: українська.
• Без вступних фраз типу «Ось аналіз...»."""

        response = _generate_with_fallback(client, contents=prompt)
        return response.text
    except Exception as e:
        return f"Помилка AI: {e}"

def analyze_whole_survey(survey_title, questions_list):
    try:
        client = get_client()
        if not client: return None

        context_data = []
        for idx, q in enumerate(questions_list):
            q_text = q.get('text')
            q_data = q.get('data')

            content = ""
            if q.get('type') == 'text' and isinstance(q_data, dict):
                content = str(q_data.get('answers', [])[:40]) 
            else:
                content = str(q_data)
                
            context_data.append(f"Q_ID {idx}: '{q_text}' -> Data: {content}")

        full_text = "\n".join(context_data)

        prompt = f"""Ти — досвідчений соціолог-аналітик. Проаналізуй результати соціологічного опитування.

Назва опитування: «{survey_title}»

Дані по кожному питанню:
{full_text}

Завдання:
Для кожного питання (за його Q_ID) напиши аналітичний висновок.

Вимоги до кожного висновку:
• Рівно 3 розгорнуті абзаци. Кожен абзац має бути детальним (мінімум 3-4 довгих речення):
  — Абзац 1: Загальна картина — детально опиши які варіанти або теми домінують і чому.
  — Абзац 2: Деталізація — глибокий аналіз розподілу, відхилень, неочевидних патернів.
  — Абзац 3: Підсумок — розгорнутий опис того, що це означає для цільової аудиторії.
• Загальний обсяг тексту має бути великим, пиши професійно і максимально повно.
• Мова: українська.
• Без вступних фраз.

ОБОВ'ЯЗКОВО поверни ТІЛЬКИ валідний JSON без додаткового тексту.
Формат: {{"0": "текст висновку", "1": "текст висновку"}}
Ключі — це Q_ID (рядки-числа). Не додавай жодних пояснень, тільки JSON."""

        response = _generate_with_fallback(
            client,
            contents=prompt,
            config={'response_mime_type': 'application/json'}
        )

        response_text = response.text.strip()
        if '{' in response_text and '}' in response_text:
            response_text = response_text[response_text.find('{'):response_text.rfind('}')+1]
        
        result = json.loads(response_text)
        
        # Validate keys are integers
        filtered_result = {}
        for key, value in result.items():
            try:
                idx = int(key)
                filtered_result[idx] = value
            except ValueError:
                pass
        
        return filtered_result if filtered_result else None

    except Exception as e:
        print(f"Batch Error: {e}")
        return None

def generate_survey_description(survey_title, questions_list):
    try:
        client = get_client()
        if not client:
            return None

        questions_text = "\n".join([f"• {q.get('text')}" for q in questions_list])

        prompt = f"""Напиши короткий опис опитування для каталогу (2-3 речення).

Назва опитування: «{survey_title}»

Питання в опитуванні:
{questions_text}

Вимоги:
• Просто опиши суть та тематику опитування — що воно досліджує.
• НЕ використовуй структуру «Що / Для кого / Чим корисне».
• НЕ використовуй слова: «що», «для кого», «чим корисне», «дізнатися», «приймати участь», «поділіться».
• НЕ починай з назви опитування.
• Тільки факти, без закликів та емоцій.
• Мова: українська.
• Максимум 3 речення.
• Зрозумілий для молоді стиль."""

        response = _generate_with_fallback(client, contents=prompt)
        return response.text

    except Exception as e:
        print(f"Desc Error: {e}")
        return None