from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os
import sys
import threading
import time
import hashlib
from pathlib import Path

from peer import get_peers, broadcast_presence, listen_for_peers
import peer  

SHARED_FOLDER = os.path.join(os.path.dirname(__file__), 'shared')
os.makedirs(SHARED_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)

CHUNK_SIZE = 1024 * 1024  

# Start peer discovery background threads
try:
    threading.Thread(target=peer.broadcast_presence, daemon=True).start()
    threading.Thread(target=peer.listen_for_peers, daemon=True).start()
except Exception as e:
    print(f"Error starting peer discovery: {e}")
    sys.exit(1)

def calculate_file_hash(file_path):
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@app.route('/status', methods=['GET'])
def status():
    """Endpoint to check if peer is alive."""
    return jsonify({"status": "ok"})

@app.route('/files', methods=['GET'])
def list_files():
    """List all files in the shared folder."""
    files = []
    for filename in os.listdir(SHARED_FOLDER):
        file_path = os.path.join(SHARED_FOLDER, filename)
        if os.path.isfile(file_path):
            file_info = {
                "name": filename,
                "size": os.path.getsize(file_path),
                "hash": calculate_file_hash(file_path),
                "modified": os.path.getmtime(file_path)
            }
            files.append(file_info)
    return jsonify(files)

@app.route('/files/<filename>', methods=['GET'])
def download_file(filename):
   
    return send_from_directory(SHARED_FOLDER, filename, as_attachment=True)

@app.route('/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    
    try:
        file_path = os.path.join(SHARED_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({"status": "success"})
        return jsonify({"status": "error", "message": "File not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
 
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    try:
      
        file_path = os.path.join(SHARED_FOLDER, file.filename)
        file.save(file_path)

       
        file_hash = calculate_file_hash(file_path)

        return jsonify({
            "status": "success",
            "message": "File uploaded successfully",
            "hash": file_hash
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/peers', methods=['GET'])
def list_peers():
    """List all discovered peers."""
    peers = get_peers()
    peer_info = []
    for peer_ip in peers:
        try:
            
            peer_info.append({
                "ip": peer_ip,
                "status": "online"
            })
        except:
            peer_info.append({
                "ip": peer_ip,
                "status": "offline"
            })
    return jsonify(peer_info)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
