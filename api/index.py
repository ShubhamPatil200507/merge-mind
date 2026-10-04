"""
Vercel Serverless Function entry point for MergeMind FastAPI backend.
Exports the FastAPI `app` object so Vercel can serve all API routes.
"""

import sys
import os

# Add root directory and backend directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for path in [ROOT_DIR, BACKEND_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

from backend.app.main import app

# Vercel ASGI handler
handler = app
