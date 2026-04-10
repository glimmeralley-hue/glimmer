import os
import uuid
import sqlite3
import hashlib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
app = Flask(__name__, static_folder=REACT_BUILD_DIR, static_url_path="")
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "glimmer.db")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            profile_pic TEXT DEFAULT 'default.png',
            bio TEXT DEFAULT ''
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            product_description TEXT,
            product_cost REAL NOT NULL,
            product_photo TEXT,
            owner_email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS thoughts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            content TEXT NOT NULL,
            music_url TEXT DEFAULT '',
            image_url TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS clocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thought_id INTEGER NOT NULL,
            user_email TEXT NOT NULL,
            UNIQUE(thought_id, user_email)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS clapbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thought_id INTEGER NOT NULL,
            user_email TEXT NOT NULL,
            reply_content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_email TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            content TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checkout_id TEXT UNIQUE NOT NULL,
            status TEXT DEFAULT 'PENDING',
            reason TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


def save_image(file_field_name):
    if file_field_name not in request.files:
        return None
    f = request.files[file_field_name]
    if not f or f.filename == "":
        return None
    if allowed_file(f.filename):
        ext = f.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        f.save(os.path.join(UPLOAD_FOLDER, filename))
        return filename
    return None


@app.route("/static/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/api/signup", methods=["POST"])
def signup():
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    phone = request.form.get("phone", "").strip()

    if not username or not email or not password:
        return jsonify({"message": "All fields are required."}), 400

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)",
            (username, email, hash_password(password), phone),
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Account created."}), 201
    except sqlite3.IntegrityError:
        return jsonify({"message": "Email already registered."}), 409
    finally:
        conn.close()


@app.route("/api/signin", methods=["POST"])
def signin():
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        (email, hash_password(password)),
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({"message": "Invalid credentials."}), 401

    return jsonify({
        "status": "success",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "phone": user["phone"],
            "profile_pic": user["profile_pic"],
            "bio": user["bio"],
        }
    })


@app.route("/api/get_user/<email>", methods=["GET"])
def get_user(email):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower(),)).fetchone()
    conn.close()
    if not user:
        return jsonify({"message": "User not found."}), 404
    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "phone": user["phone"],
        "profile_pic": user["profile_pic"],
        "bio": user["bio"],
    })


@app.route("/api/update_profile", methods=["POST"])
def update_profile():
    email = request.form.get("email", "").strip().lower()
    phone = request.form.get("phone", "")
    bio = request.form.get("bio", "")
    image_filename = save_image("image")

    conn = get_db()
    if image_filename:
        conn.execute(
            "UPDATE users SET phone=?, bio=?, profile_pic=? WHERE email=?",
            (phone, bio, image_filename, email),
        )
    else:
        conn.execute(
            "UPDATE users SET phone=?, bio=? WHERE email=?",
            (phone, bio, email),
        )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/get_products", methods=["GET"])
def get_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/add_product", methods=["POST"])
def add_product():
    product_name = request.form.get("product_name", "").strip()
    product_description = request.form.get("product_description", "").strip()
    product_cost = request.form.get("product_cost", 0)
    email = request.form.get("email", "").strip().lower()
    photo_filename = save_image("product_photo")

    conn = get_db()
    conn.execute(
        "INSERT INTO products (product_name, product_description, product_cost, product_photo, owner_email) VALUES (?,?,?,?,?)",
        (product_name, product_description, product_cost, photo_filename or "default.png", email),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/add_thought", methods=["POST"])
def add_thought():
    email = request.form.get("email", "").strip().lower()
    content = request.form.get("content", "").strip()
    music_url = request.form.get("music_url", "").strip()
    image_filename = save_image("image")

    conn = get_db()
    conn.execute(
        "INSERT INTO thoughts (user_email, content, music_url, image_url) VALUES (?,?,?,?)",
        (email, content, music_url, image_filename or ""),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/get_thoughts", methods=["GET"])
def get_thoughts():
    conn = get_db()
    thoughts = conn.execute("""
        SELECT t.*, u.username, u.profile_pic,
               (SELECT COUNT(*) FROM clocks c WHERE c.thought_id = t.id) as clock_count
        FROM thoughts t
        LEFT JOIN users u ON t.user_email = u.email
        ORDER BY t.id DESC
    """).fetchall()

    result = []
    for t in thoughts:
        thought_dict = dict(t)
        replies = conn.execute("""
            SELECT cb.*, u.username
            FROM clapbacks cb
            LEFT JOIN users u ON cb.user_email = u.email
            WHERE cb.thought_id = ?
            ORDER BY cb.id ASC
        """, (t["id"],)).fetchall()
        thought_dict["replies"] = [dict(r) for r in replies]
        result.append(thought_dict)

    conn.close()
    return jsonify(result)


@app.route("/api/toggle_clock", methods=["POST"])
def toggle_clock():
    thought_id = request.form.get("thought_id")
    email = request.form.get("email", "").strip().lower()

    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM clocks WHERE thought_id=? AND user_email=?", (thought_id, email)
    ).fetchone()

    if existing:
        conn.execute("DELETE FROM clocks WHERE thought_id=? AND user_email=?", (thought_id, email))
    else:
        conn.execute("INSERT INTO clocks (thought_id, user_email) VALUES (?,?)", (thought_id, email))

    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/delete_thought", methods=["POST"])
def delete_thought():
    thought_id = request.form.get("id")
    email = request.form.get("email", "").strip().lower()

    conn = get_db()
    conn.execute("DELETE FROM thoughts WHERE id=? AND user_email=?", (thought_id, email))
    conn.execute("DELETE FROM clocks WHERE thought_id=?", (thought_id,))
    conn.execute("DELETE FROM clapbacks WHERE thought_id=?", (thought_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/add_clapback", methods=["POST"])
def add_clapback():
    thought_id = request.form.get("thought_id")
    email = request.form.get("email", "").strip().lower()
    content = request.form.get("content", "").strip()

    conn = get_db()
    conn.execute(
        "INSERT INTO clapbacks (thought_id, user_email, reply_content) VALUES (?,?,?)",
        (thought_id, email, content),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/delete_clapback", methods=["POST"])
def delete_clapback():
    cb_id = request.form.get("id")
    email = request.form.get("email", "").strip().lower()

    conn = get_db()
    row = conn.execute("SELECT * FROM clapbacks WHERE id=?", (cb_id,)).fetchone()
    if row:
        thought = conn.execute("SELECT user_email FROM thoughts WHERE id=?", (row["thought_id"],)).fetchone()
        if row["user_email"] == email or (thought and thought["user_email"] == email):
            conn.execute("DELETE FROM clapbacks WHERE id=?", (cb_id,))
            conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/mpesa_payment", methods=["POST"])
def mpesa_payment():
    checkout_id = f"ws_CO_{uuid.uuid4().hex[:16].upper()}"
    conn = get_db()
    conn.execute("INSERT INTO payments (checkout_id, status) VALUES (?, 'PENDING')", (checkout_id,))
    conn.commit()
    conn.close()
    return jsonify({"CheckoutRequestID": checkout_id, "ResponseCode": "0"})


@app.route("/api/check_payment/<checkout_id>", methods=["GET"])
def check_payment(checkout_id):
    conn = get_db()
    payment = conn.execute("SELECT * FROM payments WHERE checkout_id=?", (checkout_id,)).fetchone()

    if not payment:
        return jsonify({"status": "FAILED", "reason": "Payment not found."})

    if payment["status"] == "PENDING":
        conn.execute("UPDATE payments SET status='COMPLETED' WHERE checkout_id=?", (checkout_id,))
        conn.commit()
        conn.close()
        return jsonify({"status": "COMPLETED"})

    conn.close()
    return jsonify({"status": payment["status"], "reason": payment["reason"]})


@app.route("/api/send_message", methods=["POST"])
def send_message():
    sender = request.form.get("sender_email", "").strip().lower()
    recipient = request.form.get("recipient_email", "").strip().lower()
    content = request.form.get("content", "").strip()
    if not sender or not recipient or not content:
        return jsonify({"message": "Missing fields."}), 400
    conn = get_db()
    conn.execute(
        "INSERT INTO messages (sender_email, recipient_email, content) VALUES (?,?,?)",
        (sender, recipient, content),
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/get_messages/<email1>/<email2>", methods=["GET"])
def get_messages(email1, email2):
    conn = get_db()
    rows = conn.execute("""
        SELECT * FROM messages
        WHERE (sender_email=? AND recipient_email=?) OR (sender_email=? AND recipient_email=?)
        ORDER BY id ASC
    """, (email1, email2, email2, email1)).fetchall()
    conn.execute("""
        UPDATE messages SET is_read=1
        WHERE recipient_email=? AND sender_email=? AND is_read=0
    """, (email1, email2))
    conn.commit()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/get_conversations/<email>", methods=["GET"])
def get_conversations(email):
    conn = get_db()
    rows = conn.execute("""
        SELECT DISTINCT
            CASE WHEN sender_email=? THEN recipient_email ELSE sender_email END AS other_email
        FROM messages
        WHERE sender_email=? OR recipient_email=?
    """, (email, email, email)).fetchall()

    conversations = []
    for row in rows:
        other = row["other_email"]
        user_row = conn.execute("SELECT username, profile_pic FROM users WHERE email=?", (other,)).fetchone()
        last_msg = conn.execute("""
            SELECT content, created_at FROM messages
            WHERE (sender_email=? AND recipient_email=?) OR (sender_email=? AND recipient_email=?)
            ORDER BY id DESC LIMIT 1
        """, (email, other, other, email)).fetchone()
        unread = conn.execute("""
            SELECT COUNT(*) as cnt FROM messages
            WHERE sender_email=? AND recipient_email=? AND is_read=0
        """, (other, email)).fetchone()
        conversations.append({
            "other_email": other,
            "username": user_row["username"] if user_row else other,
            "profile_pic": user_row["profile_pic"] if user_row else "default.png",
            "last_message": last_msg["content"] if last_msg else "",
            "unread_count": unread["cnt"] if unread else 0,
        })

    conn.close()
    conversations.sort(key=lambda x: x["last_message"], reverse=False)
    return jsonify(conversations)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path.startswith("api/") or path.startswith("static/images/"):
        return jsonify({"error": "Not found"}), 404
    index_file = os.path.join(REACT_BUILD_DIR, "index.html")
    if os.path.exists(index_file):
        return send_from_directory(REACT_BUILD_DIR, "index.html")
    return jsonify({"status": "Glimmer API running"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    host = "localhost"
    app.run(host=host, port=port, debug=False)
