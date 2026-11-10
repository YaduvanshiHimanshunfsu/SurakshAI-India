# Vercel Python serverless entry point
# This file tells Vercel where to find the FastAPI application.
# It must live in the /api directory at the project root.

import sys
import os

# Add the project root to sys.path so the `app` package is importable.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: F401  – Vercel discovers `app` here
