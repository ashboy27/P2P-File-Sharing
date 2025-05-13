const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
let currentUpload = null;
let currentSend = null;

const BACKEND_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : `http://${window.location.hostname}:5000`;


window.onload = function () {

    const fileInput = document.getElementById('file-input');
    const fileInputPeer = document.getElementById('file-input-peer');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            document.getElementById('selected-file').textContent = file ? file.name : 'No file selected';
        });
    }

    if (fileInputPeer) {
        fileInputPeer.addEventListener('change', function(e) {
            const file = e.target.files[0];
            document.getElementById('selected-file-peer').textContent = file ? file.name : 'No file selected';
        });
    }


    fetchFiles();
    fetchPeers();
    setInterval(fetchPeers, 5000);  
};

async function fetchFiles() {
    try {
        const res = await fetch(`${BACKEND_URL}/files`);
        const files = await res.json();
        const list = document.getElementById('file-list');
        list.innerHTML = '';
        
        files.forEach(file => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <span>
                    <strong>${file.name}</strong>
                </span>
                <div class="file-actions">
                    <button onclick="downloadFile('${file.name}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="deleteFile('${file.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Error fetching files:', err);
    }
}

async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusMessage = document.getElementById('upload-status');

    if (!file) {
        showStatus(statusMessage, 'Please select a file to upload.', 'error');
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
        return;
    }

    if (currentUpload) {
        currentUpload.abort();
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('size', file.size);

    try {
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        showStatus(statusMessage, 'Uploading...', 'info');

        const xhr = new XMLHttpRequest();
        currentUpload = xhr;

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = `${percent}%`;
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200) {
                showStatus(statusMessage, 'File uploaded successfully!', 'success');
                fetchFiles();
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 3000);
            } else {
                showStatus(statusMessage, 'Failed to upload file.', 'error');
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 3000);
            }
            currentUpload = null;
        };

        xhr.onerror = () => {
            showStatus(statusMessage, 'Error uploading file.', 'error');
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
            currentUpload = null;
        };

        xhr.open('POST', `${BACKEND_URL}/upload`);
        xhr.send(formData);
    } catch (err) {
        showStatus(statusMessage, 'Error uploading file.', 'error');
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
        console.error('Upload error:', err);
    }
}

async function sendFileToPeer() {
    const fileInput = document.getElementById('file-input-peer');
    const file = fileInput.files[0];
    const peerIp = document.getElementById('peer-select').value;
    const progressContainer = document.getElementById('send-progress');
    const progressBar = document.getElementById('send-progress-bar');
    const statusMessage = document.getElementById('send-status');

    if (!file || !peerIp) {
        showStatus(statusMessage, 'Please select a peer and file.', 'error');
        return;
    }

    if (currentSend) {
        currentSend.abort();
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('size', file.size);

    try {
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        showStatus(statusMessage, 'Sending file...', 'info');

        const xhr = new XMLHttpRequest();
        currentSend = xhr;

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = `${percent}%`;
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200) {
                showStatus(statusMessage, 'File sent successfully!', 'success');
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 3000);
            } else {
                showStatus(statusMessage, 'Failed to send file.', 'error');
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 3000);
            }
            currentSend = null;
        };

        xhr.onerror = () => {
            showStatus(statusMessage, 'Error sending file.', 'error');
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
            currentSend = null;
        };

        xhr.open('POST', `http://${peerIp}:5000/upload`);
        xhr.send(formData);
    } catch (err) {
        showStatus(statusMessage, 'Error sending file.', 'error');
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
        console.error('Send error:', err);
    }
}

async function fetchPeers() {
    try {
        const res = await fetch(`${BACKEND_URL}/peers`);
        const peers = await res.json();
        const list = document.getElementById('peer-list');
        const select = document.getElementById('peer-select');

        list.innerHTML = '';
        select.innerHTML = '<option value="">Select a peer</option>';

        peers.forEach(peer => {
            const li = document.createElement('li');
            li.className = 'peer-item';
            li.innerHTML = `
                <span>${peer.ip}</span>
                <div class="peer-status${peer.status === 'offline' ? ' offline' : ''}"></div>
            `;
            list.appendChild(li);

            // Dropdown option
            const option = document.createElement('option');
            option.value = peer.ip;
            option.textContent = peer.ip;
            select.appendChild(option);
        });

        // Check peer status
        checkPeerStatus(peers.map(p => p.ip));
    } catch (err) {
        console.error('Error fetching peers:', err);
    }
}

async function checkPeerStatus(peers) {
    peers.forEach(async (peer) => {
        try {
            const response = await fetch(`http://${peer}:5000/status`, { timeout: 2000 });
            // Find the peer item that contains the IP address
            const peerItems = document.querySelectorAll('.peer-item');
            peerItems.forEach(item => {
                if (item.textContent.includes(peer)) {
                    const status = item.querySelector('.peer-status');
                    if (status) {
                        status.classList.remove('offline');
                    }
                }
            });
        } catch (err) {
            // Find the peer item that contains the IP address
            const peerItems = document.querySelectorAll('.peer-item');
            peerItems.forEach(item => {
                if (item.textContent.includes(peer)) {
                    const status = item.querySelector('.peer-status');
                    if (status) {
                        status.classList.add('offline');
                    }
                }
            });
        }
    });
}

function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

async function downloadFile(filename) {
    window.location.href = `${BACKEND_URL}/files/${filename}`;
}

async function deleteFile(filename) {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
        try {
            const res = await fetch(`${BACKEND_URL}/files/${filename}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchFiles();
            } else {
                alert('Failed to delete file.');
            }
        } catch (err) {
            alert('Error deleting file.');
            console.error('Delete error:', err);
        }
    }
}
