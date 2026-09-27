import os
from pathlib import Path
from flask import Flask, send_from_directory
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

DIST = Path(__file__).resolve().parent.parent / "dist"


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    if path and (DIST / path).is_file():
        return send_from_directory(DIST, path)
    return send_from_directory(DIST, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)