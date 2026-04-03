#!/bin/bash

# ==========================================
# 1. PRE-FLIGHT AUTO-SETUP
# ==========================================
setup_project() {
    echo "--- Initializing Setup ---"
    
    # Backend Setup
    if [ -d "backend" ]; then
        cd backend
        [ ! -f .env ] && [ -f .env.example ] && cp .env.example .env && echo "Created backend/.env"
        
        if [ ! -d ".venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv .venv || python -m venv .venv
        fi
        
        echo "Updating backend dependencies..."
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
            ./.venv/Scripts/python -m pip install -r requirements.txt | grep -v 'already satisfied'
        else
            ./.venv/bin/pip install -r requirements.txt | grep -v 'already satisfied'
        fi
        cd ..
    fi

    # Frontend Setup
    if [ -d "frontend" ]; then
        cd frontend
        [ ! -f .env ] && [ -f .env.example ] && cp .env.example .env && echo "Created frontend/.env"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies (this may take a minute)..."
            npm install
        fi
        cd ..
    fi
    echo "--- Setup Complete ---"
}

# Run the setup first
setup_project

# ==========================================
# 2. OS DETECTION & LAUNCH
# ==========================================
echo "Detecting OS and launching terminals..."

# Detect Windows (Git Bash / MSYS)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start "Frontend" cmd /c "cd frontend && npm run dev"
    start "Backend" cmd /c "cd backend && call .venv\\Scripts\\activate.bat && uvicorn main:app --reload"

# Detect macOS
elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/frontend' && npm run dev\""
    osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/backend' && source .venv/bin/activate && uvicorn main:app --reload\""

# Detect Linux
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
    fi

    # Determine Terminal Emulator
    if command -v gnome-terminal >/dev/null; then
        TERM_CMD="gnome-terminal --title"
        EXEC_FLAG="--"
    elif command -v konsole >/dev/null; then
        TERM_CMD="konsole --title"
        EXEC_FLAG="-e"
    else
        TERM_CMD="xterm -T"
        EXEC_FLAG="-e"
    fi

    $TERM_CMD "Frontend" $EXEC_FLAG bash -c "cd frontend && npm run dev; exec bash" &
    $TERM_CMD "Backend" $EXEC_FLAG bash -c "cd backend && source .venv/bin/activate && uvicorn main:app --reload; exec bash" &

else
    echo "OS not automatically recognized. Please start manually."
    exit 1
fi

echo "Done! Check your new terminal windows."