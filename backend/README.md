# Backend

Запуск без проблем с PATH:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python run.py
```

Проверка:

- http://127.0.0.1:8000/api/health
- http://127.0.0.1:8000/docs

`run.py` сам запускает `uvicorn`, поэтому команда `uvicorn main:app ...` не нужна.
