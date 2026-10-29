"""
api.py — Production-Grade Flask REST API with Real SQLite Authentication & JWT Session Security.
Exposes the RAG Chatbot with per-user conversation isolation, profile management, and password reset.
"""
import os
import sys
import time
import datetime
import functools
from pathlib import Path
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv()

from src.chatbot import Chatbot
from src.utils import get_logger
import src.auth as auth

logger = get_logger(__name__)

# Initialize database schema & demo accounts
auth.init_auth_db()

app = Flask(__name__)
# Allow CORS for localhost dev and production frontend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ── Shared singleton chatbot instance ───────────────────────────────────────
_chatbot = None
_analytics = {
    "total_questions": 0,
    "languages": [],
    "topics": [],
    "feedback_up": 0,
    "feedback_down": 0,
    "response_times": [],
}


def get_chatbot():
    global _chatbot
    if _chatbot is None:
        _chatbot = Chatbot()
    return _chatbot


def require_auth(f):
    """Decorator to enforce JWT Bearer authentication on protected endpoints."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip() if auth_header else ""
        if not token:
            return jsonify({"ok": False, "error": "Authentication token missing. Please sign in."}), 401

        user = auth.verify_token(token)
        if not user:
            return jsonify({"ok": False, "error": "Invalid or expired session. Please sign in again."}), 401

        request.user = user
        request.token = token
        return f(*args, **kwargs)
    return decorated


# ─────────────────────────────────────────────────────────────────────────────
# REAL AUTHENTICATION ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    try:
        data = request.get_json(force=True) or {}
        name = data.get("name", "")
        email = data.get("email", "")
        password = data.get("password", "")
        role = data.get("role", "Customer")

        ok, msg, user, token = auth.register_user(name, email, password, role)
        if not ok:
            return jsonify({"ok": False, "error": msg}), 400

        return jsonify({
            "ok": True,
            "message": msg,
            "user": user,
            "token": token
        }), 201
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/login", methods=["POST"])
@app.route("/api/login", methods=["POST"])
def auth_login():
    try:
        data = request.get_json(force=True) or {}
        email = data.get("email", "")
        password = data.get("password", "")

        ok, msg, user, token = auth.login_user(email, password)
        if not ok:
            return jsonify({"ok": False, "error": msg}), 401

        return jsonify({
            "ok": True,
            "message": msg,
            "user": user,
            "token": token
        })
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def auth_me():
    try:
        return jsonify({"ok": True, "user": request.user})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    try:
        auth_header = request.headers.get("Authorization", "")
        token = auth_header.replace("Bearer ", "").strip() if auth_header else ""
        if token:
            auth.logout_user(token)
        return jsonify({"ok": True, "message": "Logged out successfully."})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/reset-password", methods=["POST"])
def auth_reset_password():
    try:
        data = request.get_json(force=True) or {}
        email = data.get("email", "")
        new_password = data.get("new_password", "")

        ok, msg = auth.reset_password(email, new_password)
        if not ok:
            return jsonify({"ok": False, "error": msg}), 400

        return jsonify({"ok": True, "message": msg})
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/profile", methods=["POST"])
@require_auth
def auth_profile():
    try:
        data = request.get_json(force=True) or {}
        name = data.get("name", "")
        avatar = data.get("avatar", None)

        ok, msg, updated_user = auth.update_profile(request.user["id"], name, avatar)
        if not ok:
            return jsonify({"ok": False, "error": msg}), 400

        return jsonify({"ok": True, "message": msg, "user": updated_user})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/auth/change-password", methods=["POST"])
@require_auth
def auth_change_password():
    try:
        data = request.get_json(force=True) or {}
        old_password = data.get("old_password", "")
        new_password = data.get("new_password", "")

        ok, msg = auth.change_password(request.user["id"], old_password, new_password)
        if not ok:
            return jsonify({"ok": False, "error": msg}), 400

        return jsonify({"ok": True, "message": msg})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# STATUS (Public or Authenticated)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/status", methods=["GET"])
def status():
    try:
        chatbot = get_chatbot()
        kb = chatbot.get_knowledge_base_size()
        srcs = chatbot.get_indexed_sources()
        return jsonify({
            "ok": True,
            "knowledge_base_chunks": kb,
            "indexed_sources": srcs,
            "online": kb > 0,
        })
    except Exception as e:
        logger.error(f"Status error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# CHAT (Per-User Isolated RAG Conversation)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
@require_auth
def chat():
    global _analytics
    user = request.user
    user_id = user["id"]

    data = request.get_json(force=True) or {}
    text = (data.get("message") or "").strip()
    conv_id = data.get("conversation_id") or auth.get_or_create_active_conversation(user_id)

    if not text:
        return jsonify({"ok": False, "error": "Empty message"}), 400

    try:
        chatbot = get_chatbot()

        # Save user message to isolated database
        auth.save_user_message(user_id, conv_id, "user", text)

        t0 = time.time()
        resp = chatbot.ask(text)
        elapsed = round(time.time() - t0, 2)

        if resp:
            sources = []
            for ch in (resp.sources or []):
                sources.append({
                    "source": ch.source,
                    "page": ch.page,
                    "score": round(ch.score, 3),
                    "text": ch.text[:300],
                })

            bot_msg = {
                "role": "assistant",
                "content": resp.answer,
                "sources": sources,
                "language_name": resp.language_name,
                "ts": datetime.datetime.now().isoformat(),
                "elapsed": elapsed,
            }

            # Save assistant reply to isolated database
            auth.save_user_message(
                user_id, conv_id, "assistant", resp.answer,
                sources=sources, language_name=resp.language_name, elapsed=elapsed
            )

            # Update analytics
            _analytics["total_questions"] += 1
            _analytics["languages"].append(resp.language_name or "English")
            _analytics["response_times"].append(elapsed)
            words = [w for w in text.lower().split() if len(w) > 4]
            if words:
                _analytics["topics"].append(words[0].capitalize())

            return jsonify({
                "ok": True,
                "message": bot_msg,
                "conversation_id": conv_id,
                "elapsed": elapsed
            })
        else:
            return jsonify({"ok": False, "error": "No response from AI engine"}), 500

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# MESSAGES (Retrieves user's isolated active conversation)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/messages", methods=["GET"])
@require_auth
def get_messages():
    try:
        user_id = request.user["id"]
        conv_id = request.args.get("conversation_id") or auth.get_or_create_active_conversation(user_id)
        messages = auth.get_conversation_messages(user_id, conv_id)
        return jsonify({
            "ok": True,
            "conversation_id": conv_id,
            "messages": messages
        })
    except Exception as e:
        logger.error(f"Get messages error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# CLEAR / NEW CHAT
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/clear", methods=["POST"])
@require_auth
def clear_chat():
    try:
        user_id = request.user["id"]
        chatbot = get_chatbot()
        chatbot.clear_chat_history()
        # Create a fresh conversation for this user
        new_conv_id = auth.create_new_conversation(user_id, "New Session")
        return jsonify({"ok": True, "conversation_id": new_conv_id})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# USER CONVERSATION HISTORY
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
@require_auth
def history():
    try:
        user_id = request.user["id"]
        user_history = auth.get_user_history(user_id)
        return jsonify({"ok": True, "conversations": user_history})
    except Exception as e:
        logger.error(f"History error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/history/restore", methods=["POST"])
@require_auth
def restore_history():
    try:
        user_id = request.user["id"]
        data = request.get_json(force=True) or {}
        conv_id = data.get("conversation_id")

        if not conv_id:
            # Fallback by index if older client sends index
            idx = data.get("index", 0)
            user_history = auth.get_user_history(user_id)
            if 0 <= idx < len(user_history):
                conv_id = user_history[idx]["id"]
            else:
                return jsonify({"ok": False, "error": "Conversation not found"}), 404

        messages = auth.get_conversation_messages(user_id, conv_id)
        return jsonify({
            "ok": True,
            "conversation_id": conv_id,
            "messages": messages
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/history/<conv_id>", methods=["DELETE"])
@require_auth
def delete_history_item(conv_id):
    try:
        user_id = request.user["id"]
        auth.delete_user_conversation(user_id, conv_id)
        return jsonify({"ok": True, "message": "Conversation deleted"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# FEEDBACK
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/feedback", methods=["POST"])
def feedback():
    global _analytics
    data = request.get_json(force=True) or {}
    vote = data.get("vote")
    if vote == "up":
        _analytics["feedback_up"] += 1
    elif vote == "down":
        _analytics["feedback_down"] += 1
    else:
        return jsonify({"ok": False, "error": "Invalid vote"}), 400
    return jsonify({"ok": True, "analytics": _analytics})


# ─────────────────────────────────────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/analytics", methods=["GET"])
def analytics():
    a = _analytics
    total = a["total_questions"]
    avg_rt = round(sum(a["response_times"]) / max(len(a["response_times"]), 1), 2)
    up = a["feedback_up"]
    dn = a["feedback_down"]
    sat = round((up / max(up + dn, 1)) * 100)

    from src.multilingual import LANGUAGE_NAMES
    clean_langs = [LANGUAGE_NAMES.get(l.lower(), l.capitalize()) for l in a["languages"]]

    lang_counter = Counter(clean_langs)
    topic_counter = Counter(a["topics"])

    return jsonify({
        "ok": True,
        "total_questions": total,
        "avg_response_time": avg_rt,
        "satisfaction_pct": sat,
        "feedback_up": up,
        "feedback_down": dn,
        "languages": [{"name": k, "count": v} for k, v in lang_counter.most_common(8)],
        "topics": [{"name": k, "count": v} for k, v in topic_counter.most_common(10)],
        "response_times": a["response_times"][-20:],
        "sessions": max(len(a["response_times"]) // 3, 1) if a["response_times"] else 0,
    })


# ─────────────────────────────────────────────────────────────────────────────
# UPLOAD DOCUMENTS (Protected)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/upload", methods=["POST"])
@require_auth
def upload():
    try:
        chatbot = get_chatbot()
        files = request.files.getlist("files")
        if not files:
            return jsonify({"ok": False, "error": "No files uploaded"}), 400

        results = []
        for f in files:
            data = f.read()
            res = chatbot.ingest_uploaded_file(data, f.filename)
            results.append({
                "filename": f.filename,
                "success": res.success,
                "message": getattr(res, "message", "")
            })

        return jsonify({"ok": True, "results": results})
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# LOAD SAMPLE KB & RESET KB (Protected)
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/load-sample", methods=["POST"])
@require_auth
def load_sample():
    try:
        chatbot = get_chatbot()
        results = chatbot.load_sample_knowledge_base()
        ok_count = sum(1 for r in results if r.success)
        return jsonify({"ok": True, "loaded": ok_count, "total": len(results)})
    except Exception as e:
        logger.error(f"Load sample error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/reset-kb", methods=["POST"])
@require_auth
def reset_kb():
    try:
        chatbot = get_chatbot()
        chatbot.clear_knowledge_base()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask API on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
