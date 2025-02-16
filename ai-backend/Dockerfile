FROM python:3.9

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=UTF-8

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
