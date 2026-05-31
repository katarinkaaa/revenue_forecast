"""Запуск backend без зависимости от PATH.

Команда для Windows / macOS / Linux:
    python run.py
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
