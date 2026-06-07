from pathlib import Path
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parent
PYTHON = Path(sys.executable)
LOG = ROOT / "cms-watchdog.log"


def log(message):
    with LOG.open("a", encoding="utf-8") as file:
        file.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} {message}\n")


while True:
    try:
        log("starting server.py")
        with (ROOT / "cms-server-error.log").open("ab") as error_log:
            process = subprocess.Popen(
                [str(PYTHON), "-u", str(ROOT / "server.py")],
                cwd=str(ROOT),
                stdout=error_log,
                stderr=error_log,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            code = process.wait()
        log(f"server.py exited with code {code}; restarting in 2 seconds")
    except Exception as error:
        log(f"watchdog error: {error}")
    time.sleep(2)
