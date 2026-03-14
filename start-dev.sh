#!/bin/bash

# This script runs both the backend and the frontend
# by opening them in separate, new terminal windows.
# It asks for the operating system first.

echo "Which OS are you using?"
echo "1. Windows (Git Bash/WSL)"
echo "2. Mac"
echo "3. Linux Ubuntu"
echo "4. Linux Arch"
read -p "Enter number (1-4): " os_choice

echo "Starting Backend and Frontend in separate windows..."

case $os_choice in
    1)
        # Windows
        start "Frontend (Vite)" cmd /c "cd frontend && npm run dev"
        start "Backend (FastAPI)" cmd /c "cd backend && call venv\\Scripts\\activate.bat && uvicorn main:app --reload"
        ;;
    2)
        # Mac
        osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/frontend' && npm run dev\""
        osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/backend' && source venv/bin/activate && uvicorn main:app --reload\""
        ;;
    3)
        # Linux Ubuntu
        gnome-terminal --title="Frontend (Vite)" -- bash -c "cd frontend && npm run dev; exec bash"
        gnome-terminal --title="Backend (FastAPI)" -- bash -c "cd backend && source venv/bin/activate && uvicorn main:app --reload; exec bash"
        ;;
    4)
        # Linux Arch
        # using konsole, alacritty, or xterm
        if command -v konsole > /dev/null; then
            konsole -e bash -c "cd frontend && npm run dev; exec bash" &
            konsole -e bash -c "cd backend && source venv/bin/activate && uvicorn main:app --reload; exec bash" &
        elif command -v alacritty > /dev/null; then
            alacritty -e bash -c "cd frontend && npm run dev; exec bash" &
            alacritty -e bash -c "cd backend && source venv/bin/activate && uvicorn main:app --reload; exec bash" &
        else
            # fallback to xterm
            xterm -title "Frontend (Vite)" -e bash -c "cd frontend && npm run dev; exec bash" &
            xterm -title "Backend (FastAPI)" -e bash -c "cd backend && source venv/bin/activate && uvicorn main:app --reload; exec bash" &
        fi
        ;;
    *)
        echo "Invalid selection. Exiting."
        exit 1
        ;;
esac

echo "All services are launching in new windows!"
