import os
import sys
import subprocess
import threading

"""
========================================================================
Project Name: SurakshAI-India
Developer   : Himanshu Yadav
Email ID    : himanshu.btmtcs4242906@nfsu.ac.in
Purpose     : Local development launcher for SurakshAI-India

Brief Description:
SurakshAI-India is an AI-powered scam detection tool tailored for the
Indian context. It analyzes SMS, WhatsApp, and email messages using 
Gemini AI to identify phishing attempts, financial fraud, and 
manipulation tactics (like false urgency or fake authority). It provides
a clear verdict, an explanation in Hindi/English, and actionable steps
for users to protect themselves and report scams to cybercrime portals.

This script scans for required dependencies (Python & Node.js), prompts
to install them if missing, and concurrently runs both the FastAPI 
backend and the Vite React frontend.
========================================================================
"""

def run_command(command, cwd=None, prefix=""):
    """Run a command and yield its output line by line."""
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        shell=True if sys.platform == "win32" else False
    )
    for line in iter(process.stdout.readline, ''):
        print(f"{prefix} {line}", end='')
    process.stdout.close()
    process.wait()

def get_venv_python():
    """Get the path to the virtual environment python executable."""
    venv_dir = ".venv"
    if sys.platform == "win32":
        return os.path.join(venv_dir, "Scripts", "python.exe")
    return os.path.join(venv_dir, "bin", "python")

def ensure_venv():
    """Ensure a virtual environment exists for the backend."""
    venv_dir = ".venv"
    if not os.path.exists(venv_dir):
        print("[Orchestrator] Creating virtual environment for backend...")
        subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
    return get_venv_python()

def check_backend():
    print("[Orchestrator] Checking backend dependencies...")
    venv_python = ensure_venv()
    try:
        # Check if a few key libraries from requirements.txt are available
        subprocess.run(
            [venv_python, "-c", "import fastapi; import uvicorn; import google.genai; import pydantic"],
            check=True,
            capture_output=True
        )
        print("[Orchestrator] Backend dependencies are satisfied.")
    except subprocess.CalledProcessError:
        print("[Orchestrator] Missing required Python packages in the virtual environment.")
        ans = input("Do you want to install backend dependencies now? [y/N]: ")
        if ans.lower() == 'y':
            print("[Orchestrator] Installing backend dependencies...")
            subprocess.run([venv_python, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
            print("[Orchestrator] Backend dependencies installed.")
        else:
            print("[Orchestrator] Warning: Starting backend without installing dependencies might fail.")
    return venv_python

def check_frontend():
    print("[Orchestrator] Checking frontend dependencies...")
    frontend_dir = "frontend"
    node_modules_path = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_path):
        print("[Orchestrator] Missing frontend dependencies (node_modules not found).")
        ans = input("Do you want to install frontend dependencies now? [y/N]: ")
        if ans.lower() == 'y':
            print("[Orchestrator] Installing frontend dependencies...")
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
            print("[Orchestrator] Frontend dependencies installed.")
        else:
            print("[Orchestrator] Warning: Starting frontend without installing dependencies might fail.")
    else:
        print("[Orchestrator] Frontend dependencies are satisfied.")

def main():
    # Change to the directory where run.py is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("======================================================================")
    print(" SurakshAI-India Orchestrator")
    print(" Developed by Himanshu Yadav (himanshu.btmtcs4242906@nfsu.ac.in)")
    print(" Privacy-first scam awareness and recovery support")
    print("======================================================================")

    # Make sure we are at the root
    if not os.path.exists("app") or not os.path.exists("frontend"):
        print("Error: run.py must be executed from the root of the SurakshAI project containing 'app' and 'frontend' directories.")
        sys.exit(1)

    # 1. Check Dependencies
    venv_python = check_backend()
    check_frontend()

    print("\n[Orchestrator] Starting services...")
    
    # 2. Run Backend
    # The app is located in the `app` module, we start it from the root directory.
    backend_cmd = f"{venv_python} -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
    backend_thread = threading.Thread(
        target=run_command,
        args=(backend_cmd, ".", "[Backend] "),
        daemon=True
    )
    backend_thread.start()

    # 3. Run Frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = f"{npm_cmd} run dev"
    frontend_thread = threading.Thread(
        target=run_command,
        args=(frontend_cmd, "frontend", "[Frontend] "),
        daemon=True
    )
    frontend_thread.start()

    try:
        # Wait for threads
        backend_thread.join()
        frontend_thread.join()
    except KeyboardInterrupt:
        print("\n[Orchestrator] Shutting down SurakshAI services...")
        sys.exit(0)

if __name__ == "__main__":
    main()
