# -*- coding: utf-8 -*-
"""
Minerador Syra - Blocos Independentes
Gera hashes baseados apenas na data (dd/mm/aaaa) + 4 partes aleatórias
Procura "Syra" dentro do hash
Salva blocos únicos em tokens.json
"""

import os
import json
import hashlib
import base64
import secrets
from datetime import datetime
from pathlib import Path

try:
    import qrcode
except ImportError:
    qrcode = None  # Avisaremos em runtime se faltar

BASE_OUTPUT_DIR = Path("output")
JSON_DIR = BASE_OUTPUT_DIR / "blocks"
QR_DIR = BASE_OUTPUT_DIR / "qrcodes"

OUTPUT_FILE = "tokens.json"  # arquivo agregado legado, mantido por compatibilidade
SEARCH_WORD = "Syra"

class Block:
    def __init__(self, index, hash_value, hash_parts, date):
        self.index = index
        self.hash = hash_value
        self.hash_parts = hash_parts
        self.date = date
        self.contains_syra = SEARCH_WORD in hash_value

    def to_dict(self):
        return {
            "index": self.index,
            "hash": self.hash,
            "hash_parts": self.hash_parts,
            "date": self.date,
            "contains_syra": self.contains_syra
        }

    def to_json_str(self):
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)

def random_string(n=8):
    """Gera string hex aleatória"""
    return secrets.token_hex(n)

def generate_block():
    """Gera um hash a partir da data + 4 partes aleatórias"""
    today = datetime.now().strftime("%d/%m/%Y")
    combined = today
    parts = []
    for _ in range(4):
        rnd = random_string(8)
        data = f"{today}{rnd}SYRA2025".encode()
        h = hashlib.sha256(data).digest()
        part = base64.b64encode(h).decode()
        parts.append(part)
        combined += part
    final_hash = base64.b64encode(hashlib.sha256(combined.encode()).digest()).decode()
    return final_hash, parts, today

def load_blocks():
    """Carrega blocos já minerados"""
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            blocks = json.load(f)
            return blocks, {b["hash"] for b in blocks}
    return [], set()

def save_blocks(blocks):
    """Salva blocos minerados"""
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(blocks, f, indent=2, ensure_ascii=False)


def ensure_output_dirs():
    """Garante que as pastas de saída existam."""
    JSON_DIR.mkdir(parents=True, exist_ok=True)
    QR_DIR.mkdir(parents=True, exist_ok=True)


def save_block_json_file(block: Block):
    """Salva o JSON de um bloco individualmente com nome padronizado."""
    ensure_output_dirs()
    filename = JSON_DIR / f"block_{block.index:06d}.json"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(block.to_json_str())
    return filename


def save_block_qrcode(block: Block):
    """Gera QR Code do conteúdo JSON do bloco e salva como PNG."""
    if qrcode is None:
        raise RuntimeError(
            "Dependência 'qrcode' não encontrada. Instale com: pip install qrcode[pil]"
        )
    ensure_output_dirs()
    data = block.to_json_str()
    img = qrcode.make(data)
    filename = QR_DIR / f"block_{block.index:06d}.png"
    img.save(filename)
    return filename

def minerar():
    print("⛏️ Minerando blocos independentes... (Ctrl+C para parar)")
    ensure_output_dirs()
    blocks, existing = load_blocks()
    index = len(blocks) + 1

    try:
        while True:
            hash_value, parts, date = generate_block()

            if SEARCH_WORD in hash_value and hash_value not in existing:
                block = Block(index, hash_value, parts, date)
                blocks.append(block.to_dict())
                existing.add(hash_value)
                # Persistência agregada
                save_blocks(blocks)
                # Artefatos bonitos
                json_path = save_block_json_file(block)
                try:
                    qr_path = save_block_qrcode(block)
                except RuntimeError as e:
                    qr_path = None
                    print(f"⚠️ {e}")

                print(f"✅ Bloco {index} salvo!")
                print(f"   • Hash: {hash_value[:40]}...")
                print(f"   • JSON: {json_path}")
                if qr_path:
                    print(f"   • QR:   {qr_path}")
                print("🔥 Contém 'Syra' no hash!\n")

                index += 1

    except KeyboardInterrupt:
        print("\n🛑 Minerador parado.")

if __name__ == "__main__":
    minerar()