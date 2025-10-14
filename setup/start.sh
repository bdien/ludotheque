#!/usr/bin/env sh

nginx
cd /app/src/api && uv run --no-dev uvicorn main:app --uds /tmp/uvicorn.sock
