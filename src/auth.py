"""
auth.py — Complete SQLite-backed Authentication & Session Engine with JWT,
password hashing (PBKDF2-SHA256), profile management, and per-user conversation isolation.
"""
import os
import sys
import sqlite3
import datetime
import json
import uuid
import jwt
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users.db"
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-support-ai-key-2026-xyz99")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_auth_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'Customer',
                avatar TEXT DEFAULT '👤',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        """)

        # Add last_login if missing in older schema
        try:
            conn.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP")
        except sqlite3.OperationalError:
            pass

        try:
            conn.execute("ALTER TABLE sessions ADD COLUMN expires_at TIMESTAMP")
        except sqlite3.OperationalError:
            pass

        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_conversations (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                sources_json TEXT,
                language_name TEXT,
                elapsed REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES user_conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.commit()

        # Seed default test/demo accounts if users table is empty
        cursor = conn.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()["count"] == 0:
            default_users = [
                ("Alex Mercer", "admin@support.ai", "admin123", "Admin Lead", "⚡"),
                ("Sarah Chen", "agent@support.ai", "agent123", "Support Specialist", "🛡️"),
                ("Demo Customer", "customer@support.ai", "customer123", "Customer", "✨"),
            ]
            for name, email, pwd, role, avatar in default_users:
                conn.execute(
                    "INSERT INTO users (name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)",
                    (name, email, generate_password_hash(pwd), role, avatar)
                )
            conn.commit()


def _generate_jwt(user_id: int, email: str, role: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    exp = now + datetime.timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def register_user(name: str, email: str, password: str, role: str = "Customer"):
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = (password or "").strip()

    if not name or len(name) < 2:
        return False, "Full name must be at least 2 characters.", None, None
    if not email or "@" not in email or "." not in email:
        return False, "Please enter a valid email address.", None, None
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters.", None, None

    init_auth_db()
    with get_db() as conn:
        cur = conn.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            return False, "An account with this email already exists. Please sign in.", None, None

        pwd_hash = generate_password_hash(password)
        avatar = "👤" if role == "Customer" else "⚡"
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, role, avatar, last_login) VALUES (?, ?, ?, ?, ?, ?)",
            (name, email, pwd_hash, role, avatar, datetime.datetime.now().isoformat())
        )
        user_id = cur.lastrowid

        token = _generate_jwt(user_id, email, role)
        expires_at = (datetime.datetime.now() + datetime.timedelta(days=JWT_EXPIRATION_DAYS)).isoformat()
        conn.execute(
            "INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at)
        )
        conn.commit()

        user = {
            "id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "avatar": avatar
        }
        return True, "Registration successful.", user, token


def login_user(email: str, password: str):
    email = (email or "").strip().lower()
    password = (password or "").strip()

    if not email or not password:
        return False, "Email and password are required.", None, None

    init_auth_db()
    with get_db() as conn:
        cur = conn.execute(
            "SELECT id, name, email, password_hash, role, avatar FROM users WHERE email = ?",
            (email,)
        )
        row = cur.fetchone()
        if not row or not check_password_hash(row["password_hash"], password):
            return False, "Invalid email or password.", None, None

        user_id = row["id"]
        role = row["role"]
        token = _generate_jwt(user_id, row["email"], role)
        expires_at = (datetime.datetime.now() + datetime.timedelta(days=JWT_EXPIRATION_DAYS)).isoformat()

        # Update last login and record session
        conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (datetime.datetime.now().isoformat(), user_id))
        conn.execute(
            "INSERT OR REPLACE INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
            (token, user_id, expires_at)
        )
        conn.commit()

        user = {
            "id": user_id,
            "name": row["name"],
            "email": row["email"],
            "role": role,
            "avatar": row["avatar"]
        }
        return True, "Login successful.", user, token


def verify_token(token: str):
    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        # Fallback to check sessions table for older raw hex tokens
        init_auth_db()
        with get_db() as conn:
            cur = conn.execute("""
                SELECT u.id, u.name, u.email, u.role, u.avatar 
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ?
            """, (token,))
            row = cur.fetchone()
            if row:
                return {
                    "id": row["id"],
                    "name": row["name"],
                    "email": row["email"],
                    "role": row["role"],
                    "avatar": row["avatar"]
                }
            return None

    init_auth_db()
    with get_db() as conn:
        cur = conn.execute(
            "SELECT id, name, email, role, avatar FROM users WHERE id = ?",
            (user_id,)
        )
        row = cur.fetchone()
        if row:
            return {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "role": row["role"],
                "avatar": row["avatar"]
            }
    return None


def logout_user(token: str):
    if not token:
        return True
    init_auth_db()
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    return True


def reset_password(email: str, new_password: str):
    email = (email or "").strip().lower()
    new_password = (new_password or "").strip()

    if not email or "@" not in email:
        return False, "Please enter a valid registered email address."
    if not new_password or len(new_password) < 6:
        return False, "New password must be at least 6 characters long."

    init_auth_db()
    with get_db() as conn:
        cur = conn.execute("SELECT id FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        if not row:
            return False, "No account found with this email address."

        user_id = row["id"]
        pwd_hash = generate_password_hash(new_password)
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pwd_hash, user_id))
        # Invalidate old sessions for safety
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.commit()

        return True, "Password has been successfully updated! You can now sign in with your new password."


def update_profile(user_id: int, name: str, avatar: str = None):
    name = (name or "").strip()
    if not name or len(name) < 2:
        return False, "Name must be at least 2 characters.", None

    init_auth_db()
    with get_db() as conn:
        if avatar:
            conn.execute("UPDATE users SET name = ?, avatar = ? WHERE id = ?", (name, avatar, user_id))
        else:
            conn.execute("UPDATE users SET name = ? WHERE id = ?", (name, user_id))
        conn.commit()

        cur = conn.execute("SELECT id, name, email, role, avatar FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return True, "Profile updated successfully.", {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "role": row["role"],
            "avatar": row["avatar"]
        }


def change_password(user_id: int, old_password: str, new_password: str):
    old_password = (old_password or "").strip()
    new_password = (new_password or "").strip()

    if not new_password or len(new_password) < 6:
        return False, "New password must be at least 6 characters."

    init_auth_db()
    with get_db() as conn:
        cur = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        if not row or not check_password_hash(row["password_hash"], old_password):
            return False, "Incorrect current password."

        pwd_hash = generate_password_hash(new_password)
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pwd_hash, user_id))
        conn.commit()
        return True, "Password updated successfully."


# ─────────────────────────────────────────────────────────────────────────────
# PER-USER CONVERSATION AND MESSAGE PERSISTENCE
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_active_conversation(user_id: int):
    init_auth_db()
    with get_db() as conn:
        cur = conn.execute(
            "SELECT id, title, created_at FROM user_conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
            (user_id,)
        )
        row = cur.fetchone()
        if row:
            return row["id"]

        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        conn.execute(
            "INSERT INTO user_conversations (id, user_id, title) VALUES (?, ?, ?)",
            (conv_id, user_id, "New Session")
        )
        conn.commit()
        return conv_id


def create_new_conversation(user_id: int, title: str = "New Session"):
    init_auth_db()
    with get_db() as conn:
        conv_id = f"conv_{uuid.uuid4().hex[:12]}"
        conn.execute(
            "INSERT INTO user_conversations (id, user_id, title) VALUES (?, ?, ?)",
            (conv_id, user_id, title)
        )
        conn.commit()
        return conv_id


def save_user_message(user_id: int, conv_id: str, role: str, content: str, sources=None, language_name=None, elapsed=None):
    init_auth_db()
    sources_json = json.dumps(sources) if sources else None
    now_iso = datetime.datetime.now().isoformat()

    with get_db() as conn:
        # Check if conversation exists for this user, if not create
        cur = conn.execute("SELECT id, title FROM user_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
        row = cur.fetchone()
        if not row:
            conn.execute(
                "INSERT INTO user_conversations (id, user_id, title, updated_at) VALUES (?, ?, ?, ?)",
                (conv_id, user_id, content[:50] if role == "user" else "Support Chat", now_iso)
            )
        else:
            # If default title and this is first user question, set title
            if role == "user" and row["title"] in ("New Session", "Support Chat"):
                conn.execute(
                    "UPDATE user_conversations SET title = ?, updated_at = ? WHERE id = ?",
                    (content[:55] + ("..." if len(content) > 55 else ""), now_iso, conv_id)
                )
            else:
                conn.execute("UPDATE user_conversations SET updated_at = ? WHERE id = ?", (now_iso, conv_id))

        conn.execute("""
            INSERT INTO user_messages (conversation_id, user_id, role, content, sources_json, language_name, elapsed)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (conv_id, user_id, role, content, sources_json, language_name, elapsed))
        conn.commit()


def get_conversation_messages(user_id: int, conv_id: str):
    init_auth_db()
    with get_db() as conn:
        cur = conn.execute("""
            SELECT role, content, sources_json, language_name, elapsed, created_at as ts
            FROM user_messages
            WHERE conversation_id = ? AND user_id = ?
            ORDER BY id ASC
        """, (conv_id, user_id))
        rows = cur.fetchall()

        messages = []
        for r in rows:
            sources = []
            if r["sources_json"]:
                try:
                    sources = json.loads(r["sources_json"])
                except Exception:
                    pass
            messages.append({
                "role": r["role"],
                "content": r["content"],
                "sources": sources,
                "language_name": r["language_name"],
                "elapsed": r["elapsed"],
                "ts": r["ts"]
            })
        return messages


def get_user_history(user_id: int):
    init_auth_db()
    with get_db() as conn:
        cur = conn.execute("""
            SELECT c.id, c.title, c.updated_at, c.created_at,
                   COUNT(m.id) as message_count
            FROM user_conversations c
            LEFT JOIN user_messages m ON c.id = m.conversation_id
            WHERE c.user_id = ?
            GROUP BY c.id
            HAVING message_count > 0
            ORDER BY c.updated_at DESC
            LIMIT 25
        """, (user_id,))
        rows = cur.fetchall()

        history = []
        for r in rows:
            conv_id = r["id"]
            msgs = get_conversation_messages(user_id, conv_id)
            user_count = sum(1 for m in msgs if m["role"] == "user")
            
            # Formatted date
            time_str = r["updated_at"]
            try:
                dt = datetime.datetime.fromisoformat(time_str)
                time_str = dt.strftime("%d %b %Y • %H:%M")
            except Exception:
                pass

            history.append({
                "id": conv_id,
                "title": r["title"],
                "time": time_str,
                "messages": msgs,
                "count": user_count,
            })
        return history


def delete_user_conversation(user_id: int, conv_id: str):
    init_auth_db()
    with get_db() as conn:
        conn.execute("DELETE FROM user_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
        conn.commit()
    return True
