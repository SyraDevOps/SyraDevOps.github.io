#!/usr/bin/env python3
"""
NEXUS P2P - Chat Ponto-a-Ponto
Um arquivo único que funciona como SERVER + CLIENT
Você pode ser host OU conectar-se a outro peer usando um ID compartilhado
"""

import asyncio
import websockets
import json
import uuid
import sys
import os
from datetime import datetime
from threading import Thread, Event
import socket

# ============================================================================
# PARTE 1: SERVIDOR P2P
# ============================================================================

class NexusServer:
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.rooms = {}  # { room_id: {peer1_id, peer2_id} }
        self.peers = {}  # { peer_id: websocket }
        self.peer_to_room = {}  # { peer_id: room_id }
        self.running = False
    
    async def register_peer(self, peer_id, websocket):
        """Registra um novo peer"""
        self.peers[peer_id] = websocket
        print(f"  ✓ Peer registrado: {peer_id}")
    
    async def unregister_peer(self, peer_id):
        """Remove um peer desconectado"""
        if peer_id in self.peers:
            del self.peers[peer_id]
        
        if peer_id in self.peer_to_room:
            room_id = self.peer_to_room[peer_id]
            del self.peer_to_room[peer_id]
            
            # Notifica o outro peer
            if room_id in self.rooms:
                other_peers = self.rooms[room_id] - {peer_id}
                for other_peer in other_peers:
                    if other_peer in self.peers:
                        try:
                            await self.peers[other_peer].send(json.dumps({
                                "type": "peer_disconnected",
                                "from": peer_id
                            }))
                        except:
                            pass
                
                if len(self.rooms[room_id]) <= 1:
                    del self.rooms[room_id]
        
        print(f"  ✗ Peer desconectado: {peer_id}")
    
    async def handle_message(self, peer_id, websocket, data):
        """Processa mensagens"""
        msg_type = data.get("type")
        
        # === CRIAR SALA ===
        if msg_type == "create_room":
            room_id = str(uuid.uuid4())[:8].upper()
            self.rooms[room_id] = {peer_id}
            self.peer_to_room[peer_id] = room_id
            
            await websocket.send(json.dumps({
                "type": "room_created",
                "room_id": room_id,
                "peer_id": peer_id
            }))
            print(f"  📍 Sala criada: {room_id}")
        
        # === ENTRAR EM SALA ===
        elif msg_type == "join_room":
            room_id = data.get("room_id").upper()
            
            if room_id not in self.rooms:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Sala não encontrada"
                }))
                return
            
            if len(self.rooms[room_id]) >= 2:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Sala já está cheia"
                }))
                return
            
            self.rooms[room_id].add(peer_id)
            self.peer_to_room[peer_id] = room_id
            
            room_peers = list(self.rooms[room_id])
            
            for p in room_peers:
                if p in self.peers:
                    await self.peers[p].send(json.dumps({
                        "type": "room_joined",
                        "room_id": room_id,
                        "your_peer_id": p,
                        "peers_in_room": [x for x in room_peers if x != p],
                        "total_peers": len(room_peers)
                    }))
            
            print(f"  👤 {peer_id} entrou na sala {room_id}")
        
        # === MENSAGEM DE CHAT ===
        elif msg_type == "chat_message":
            room_id = self.peer_to_room.get(peer_id)
            if not room_id:
                return
            
            message = data.get("text", "")
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            if room_id in self.rooms:
                for target_peer in self.rooms[room_id]:
                    if target_peer != peer_id and target_peer in self.peers:
                        try:
                            await self.peers[target_peer].send(json.dumps({
                                "type": "chat_message",
                                "from": peer_id,
                                "text": message,
                                "timestamp": timestamp
                            }))
                        except:
                            pass
        
        # === PING ===
        elif msg_type == "ping":
            await websocket.send(json.dumps({"type": "pong"}))
    
    async def peer_handler(self, websocket, path):
        """Gerencia conexão de um peer"""
        peer_id = None
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    if peer_id is None:
                        if data.get("type") == "register":
                            peer_id = data.get("peer_id") or str(uuid.uuid4())[:8]
                            await self.register_peer(peer_id, websocket)
                            continue
                    
                    if peer_id:
                        await self.handle_message(peer_id, websocket, data)
                
                except json.JSONDecodeError:
                    pass
        
        except websockets.exceptions.ConnectionClosed:
            pass
        
        finally:
            if peer_id:
                await self.unregister_peer(peer_id)
    
    async def start(self):
        """Inicia o servidor"""
        self.running = True
        try:
            server = await websockets.serve(
                self.peer_handler, 
                self.host, 
                self.port,
                ping_interval=None
            )
            print(f"\n✓ Servidor rodando em ws://localhost:{self.port}\n")
            await asyncio.Future()  # Roda indefinidamente
        except Exception as e:
            print(f"✗ Erro ao iniciar servidor: {e}")
            self.running = False


# ============================================================================
# PARTE 2: CLIENTE P2P
# ============================================================================

class NexusClient:
    def __init__(self, server_url="ws://localhost:8765"):
        self.server_url = server_url
        self.peer_id = str(uuid.uuid4())[:8].upper()
        self.room_id = None
        self.websocket = None
        self.is_running = False
        self.connected = False
        self.peers_in_room = []
    
    async def connect(self):
        """Conecta ao servidor"""
        try:
            self.websocket = await websockets.connect(
                self.server_url,
                ping_interval=None
            )
            self.is_running = True
            self.connected = True
            
            await self.websocket.send(json.dumps({
                "type": "register",
                "peer_id": self.peer_id
            }))
            
            print(f"\n✓ Conectado ao servidor")
            print(f"  Seu ID: {self.peer_id}\n")
            
            await self.listen()
        
        except Exception as e:
            print(f"✗ Erro: {e}")
            self.is_running = False
            self.connected = False
    
    async def listen(self):
        """Escuta mensagens"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                msg_type = data.get("type")
                
                if msg_type == "room_created":
                    self.room_id = data.get("room_id")
                    print(f"\n📍 Sala criada: {self.room_id}")
                    print(f"   Compartilhe este ID com outro usuário!\n")
                
                elif msg_type == "room_joined":
                    self.room_id = data.get("room_id")
                    peers = data.get("peers_in_room", [])
                    self.peers_in_room = peers
                    
                    print(f"\n✓ Conectado à sala: {self.room_id}")
                    if peers:
                        print(f"   Conectado com: {peers[0]}\n")
                
                elif msg_type == "chat_message":
                    sender = data.get("from")[:4]
                    text = data.get("text")
                    ts = data.get("timestamp", "")
                    
                    print(f"\n[{ts}] {sender}...: {text}")
                    print("Você: ", end="", flush=True)
                
                elif msg_type == "peer_disconnected":
                    print(f"\n\n✗ Outro usuário desconectou\n")
                    self.room_id = None
                    self.peers_in_room = []
                
                elif msg_type == "error":
                    error_msg = data.get("message")
                    print(f"⚠ {error_msg}")
        
        except:
            pass
        
        finally:
            self.is_running = False
            self.connected = False
    
    async def send_message(self, text):
        """Envia mensagem"""
        if not self.websocket or not self.room_id:
            return
        
        try:
            await self.websocket.send(json.dumps({
                "type": "chat_message",
                "text": text
            }))
        except:
            pass
    
    async def create_room(self):
        """Cria sala"""
        if not self.websocket:
            return
        
        await self.websocket.send(json.dumps({
            "type": "create_room"
        }))
    
    async def join_room(self, room_id):
        """Entra em sala"""
        if not self.websocket:
            return
        
        await self.websocket.send(json.dumps({
            "type": "join_room",
            "room_id": room_id.strip().upper()
        }))
    
    async def heartbeat(self):
        """Mantém conexão viva"""
        while self.is_running:
            try:
                if self.websocket:
                    await self.websocket.send(json.dumps({"type": "ping"}))
                await asyncio.sleep(30)
            except:
                break


# ============================================================================
# INTERFACE UNIFICADA
# ============================================================================

def get_local_ip():
    """Obtém IP local da máquina"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"


async def run_client(server_url):
    """Executa cliente"""
    client = NexusClient(server_url)
    
    connect_task = asyncio.create_task(client.connect())
    heartbeat_task = asyncio.create_task(client.heartbeat())
    
    await asyncio.sleep(1)
    
    # Menu inicial
    print("\n" + "="*50)
    print("  NEXUS P2P - Chat Ponto-a-Ponto")
    print("="*50)
    print("\n1. Criar nova sala (ser HOST)")
    print("2. Entrar em sala (conectar a HOST)")
    print("\nDigite sua escolha (1 ou 2): ", end="")
    
    choice = input().strip()
    
    if choice == "1":
        await client.create_room()
    elif choice == "2":
        room_id = input("\nDigite o ID da sala: ").strip()
        await client.join_room(room_id)
    else:
        print("Opção inválida!")
        return
    
    await asyncio.sleep(0.5)
    
    # Chat loop
    print("\n" + "-"*50)
    print("Digite suas mensagens (ou 'sair' para encerrar)")
    print("-"*50 + "\n")
    
    def input_thread():
        """Thread para input sem bloquear async"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        while client.is_running:
            try:
                msg = input("Você: ").strip()
                if msg.lower() == "sair":
                    client.is_running = False
                    break
                elif msg:
                    asyncio.run_coroutine_threadsafe(
                        client.send_message(msg),
                        asyncio.get_event_loop()
                    )
            except:
                break
    
    input_task_thread = Thread(target=input_thread, daemon=True)
    input_task_thread.start()
    
    # Aguarda até desconectar
    try:
        while client.is_running:
            await asyncio.sleep(0.1)
    except KeyboardInterrupt:
        pass
    
    print("\n\n✗ Desconectado\n")
    client.is_running = False


async def run_server(port=8765):
    """Executa servidor"""
    server = NexusServer(host="0.0.0.0", port=port)
    await server.start()


async def main_menu():
    """Menu principal"""
    print("\n" + "="*60)
    print("╔" + "="*58 + "╗")
    print("║" + "  NEXUS P2P - Um arquivo único para tudo  ".center(58) + "║")
    print("╚" + "="*58 + "╝")
    print("="*60)
    
    print("\n1. Ser um HOST (abrir servidor para outros conectarem)")
    print("2. Conectar como CLIENT (entrar no chat de alguém)\n")
    
    choice = input("Escolha (1 ou 2): ").strip()
    
    if choice == "1":
        # Modo HOST
        port = input("Porta do servidor [8765]: ").strip() or "8765"
        port = int(port)
        
        local_ip = get_local_ip()
        
        print("\n" + "="*60)
        print(f"✓ Servidor iniciando na porta {port}...")
        print(f"\n  Passe este endereço para seus amigos:")
        print(f"  ➜ ws://{local_ip}:{port}")
        print("="*60)
        
        try:
            await run_server(port)
        except KeyboardInterrupt:
            print("\n\n✗ Servidor encerrado")
    
    elif choice == "2":
        # Modo CLIENT
        print("\nExemplos de endereço:")
        print("  - localhost:8765 (máquina local)")
        print("  - 192.168.1.100:8765 (outra máquina)")
        print("  - ws://192.168.1.100:8765 (formato completo)")
        
        server_addr = input("\nDigite o endereço do servidor: ").strip()
        
        # Normaliza o endereço
        if not server_addr.startswith("ws"):
            if "://" not in server_addr:
                server_addr = f"ws://{server_addr}"
            if not server_addr.startswith("ws://"):
                server_addr = server_addr.replace("http://", "ws://")
        
        try:
            await run_client(server_addr)
        except KeyboardInterrupt:
            print("\n\n✗ Desconectado")
    
    else:
        print("Opção inválida!")


if __name__ == "__main__":
    try:
        asyncio.run(main_menu())
    except KeyboardInterrupt:
        print("\n\n✗ Encerrando...\n")
    except Exception as e:
        print(f"\n✗ Erro: {e}\n")
