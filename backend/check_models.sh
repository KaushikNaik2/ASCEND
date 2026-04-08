#!/bin/bash
if [ -f .env ]; then
    source .env
elif [ -f ../.env ]; then
    source ../.env
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "Error: GOOGLE_API_KEY not found in .env"
    exit 1
fi

echo "Fetching available Gemini models..."
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}" | grep -B 1 -A 5 -i "embedding"
