# P2P File Sharing System

A simple peer-to-peer (P2P) file sharing system built with Python (Flask backend) and a modern HTML/CSS/JS frontend. Peers on the same local network can discover each other and send files directly, without a central server.

---

## Features
- Peer discovery on local network (no central server)
- Upload, download, and delete files
- Send files directly to any discovered peer
- Modern, responsive web UI
- Real-time progress indicators for uploads and downloads
- Easy setup and cross-platform support

---

## Getting Started

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/p2p-file-sharing.git
   cd p2p-file-sharing
   ```
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

---

## Running the Project

### 1. Start the Backend (on each peer)
```bash
python backend/app.py
```

### 2. Serve the Frontend (on each peer)
```bash
cd frontend
python -m http.server 8080
```

### 3. Access the App
- Open a browser and go to `http://<your-ip>:8080` (replace `<your-ip>` with your machine's local IP address).
- Repeat on other machines in the same network for true P2P sharing.

---

## Usage
- **Upload a file:** Use the "Upload File" section.
- **Send a file to a peer:** Use the "Send File to a Peer" section and select a discovered peer.
- **Download/Delete:** Use the buttons in the "Available Files" section.
- **Peer Discovery:** Peers on the same network will appear in the "Discovered Peers" list automatically.

---

## Notes
- All file transfers are direct between peers (no central server).
- Each peer only sees files in its own shared folder.
- Make sure all peers are on the same local network.
- Allow Python through your firewall if prompted.

---

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License
[MIT](LICENSE) 