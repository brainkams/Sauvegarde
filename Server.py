from flask import Flask, send_from_directory, jsonify

app = Flask(__name__)

# --- Données simulées (pour API interne) ---
users = [
    {"id": 1, "username": "Brian"},
    {"id": 2, "username": "Camille"},
    {"id": 3, "username": "Scorpion"}
]

messages = [
    {"id": 1, "from": "Brian", "text": "Salut 👋"},
    {"id": 2, "from": "Camille", "text": "Coucou 🎉"},
    {"id": 3, "from": "Scorpion", "text": "🔥 Scorpion BKMS c'est le feu !"}
]

# --- Routes API ---
@app.route("/api/users")
def get_users():
    return jsonify(users)

@app.route("/api/messages")
def get_messages():
    return jsonify(messages)

@app.route("/api/stats")
def get_stats():
    stats = {
        "total_users": len(users),
        "total_messages": len(messages),
        "top_reaction": "😂"
    }
    return jsonify(stats)

# --- Routes Web ---
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

if __name__ == "__main__":
    print("🚀 Scorpion BKMS est lancé sur http://127.0.0.1:7700")
    app.run(debug=True)
