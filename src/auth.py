"""
auth.py — Real SQLite-backed authentication system with password hashing and session tokens.
"""
import sqlite3
import secrets
import datetime
from pathlib import Path
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "users.db"


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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        conn.commit()

        # Seed default accounts if table is empty
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
        # Check if email already registered
        cur = conn.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            return False, "An account with this email already exists. Please sign in.", None, None

        pwd_hash = generate_password_hash(password)
        avatar = "👤" if role == "Customer" else "⚡"
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, role, avatar) VALUES (?, ?, ?, ?, ?)",
            (name, email, pwd_hash, role, avatar)
        )
        user_id = cur.lastrowid

        # Create session
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
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
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
        conn.commit()

        user = {
            "id": user_id,
            "name": row["name"],
            "email": row["email"],
            "role": row["role"],
            "avatar": row["avatar"]
        }
        return True, "Login successful.", user, token


def verify_token(token: str):
    if not token:
        return None
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


def logout_user(token: str):
    if not token:
        return True
    with get_db() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    return True
