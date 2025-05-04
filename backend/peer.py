import socket
import threading
import time
import atexit

BROADCAST_PORT = 50001
BROADCAST_INTERVAL = 5  # seconds
PEER_EXPIRY = 15  # seconds

peers = {}  # {ip: last_seen_time}
peers_lock = threading.Lock()
broadcast_socket = None
listen_socket = None

def cleanup():
    global broadcast_socket, listen_socket
    if broadcast_socket:
        broadcast_socket.close()
    if listen_socket:
        listen_socket.close()

atexit.register(cleanup)

def broadcast_presence():
    global broadcast_socket
    broadcast_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    broadcast_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    message = b'P2P_PEER'
    while True:
        try:
            broadcast_socket.sendto(message, ('<broadcast>', BROADCAST_PORT + 1))
            time.sleep(BROADCAST_INTERVAL)
        except Exception as e:
            print(f"Broadcast error: {e}")
            break

def listen_for_peers():
    global listen_socket
    listen_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    listen_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        listen_socket.bind(('', BROADCAST_PORT + 1))
        while True:
            try:
                data, addr = listen_socket.recvfrom(1024)
                if data == b'P2P_PEER':
                    with peers_lock:
                        peers[addr[0]] = time.time()
            except Exception as e:
                print(f"Listen error: {e}")
                break
    except Exception as e:
        print(f"Socket bind error: {e}")

def expire_peers():
    while True:
        now = time.time()
        with peers_lock:
            expired = [ip for ip, last_seen in peers.items() if now - last_seen > PEER_EXPIRY]
            for ip in expired:
                del peers[ip]
        time.sleep(5)

def get_peers():
    with peers_lock:
        return list(peers.keys())

if __name__ == "__main__":
    threading.Thread(target=broadcast_presence, daemon=True).start()
    threading.Thread(target=listen_for_peers, daemon=True).start()
    threading.Thread(target=expire_peers, daemon=True).start()
    print("Peer discovery started. Press Ctrl+C to exit.")
    try:
        while True:
            print("Discovered peers:", get_peers())
            time.sleep(10)
    except KeyboardInterrupt:
        print("Exiting.")