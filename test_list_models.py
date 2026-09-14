import requests
import os

from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
res = requests.get(url)
models = res.json()
print("All models:")
for m in models.get("models", []):
    print(f"{m['name']}: {m.get('supportedGenerationMethods', [])}")
