FROM python:3.11-slim

WORKDIR /app

# Встановлюємо залежності для роботи з даними та шрифти для PDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Експортуємо порт
EXPOSE 8000

# Запускаємо через uvicorn, слухаємо на всіх інтерфейсах
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
