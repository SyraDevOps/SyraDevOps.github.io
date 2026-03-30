#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para substituir emojis por ícones SVG em todos os arquivos do projeto.
"""

import os
import re
from pathlib import Path

# Mapeamento de emojis para ícones SVG
EMOJI_MAPPING = {
    '🚀': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-rocket"></use></svg>',
    '💡': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightbulb"></use></svg>',
    '🔒': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg>',
    '🔐': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lock"></use></svg>',
    '🔑': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-key"></use></svg>',
    '📧': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-email"></use></svg>',
    '✓': '<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-check"></use></svg>',
    '✗': '<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-close"></use></svg>',
    '→': '<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg>',
    '↔': '<svg class="icon" width="20" height="20"><use xlink:href="icons.svg#icon-arrow-right"></use></svg>',
    '📦': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-package"></use></svg>',
    '⚙️': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-gear"></use></svg>',
    '👁️': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-eye"></use></svg>',
    '🌉': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-bridge"></use></svg>',
    '🏆': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-trophy"></use></svg>',
    '🌍': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-globe"></use></svg>',
    '🛠️': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-tools"></use></svg>',
    '⚡': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-lightning"></use></svg>',
    '🧠': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-brain"></use></svg>',
    '🔥': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-fire"></use></svg>',
    '🧩': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-puzzle"></use></svg>',
    '📊': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg>',
    '🖥️': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-desktop"></use></svg>',
    '📞': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-phone"></use></svg>',
    '✨': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-sparkles"></use></svg>',
    '📱': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-mobile"></use></svg>',
    '✉️': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-envelope"></use></svg>',
    '💼': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-envelope"></use></svg>',
    '🎯': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg>',
    '📈': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-chart"></use></svg>',
    '📋': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-mobile"></use></svg>',
    '🎨': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-settings"></use></svg>',
    '⭐': '<svg class="icon" width="24" height="24"><use xlink:href="icons.svg#icon-star"></use></svg>',
}

# Extensões de arquivo para processar
SUPPORTED_EXTENSIONS = ['.html', '.md', '.css', '.js', '.ts', '.py']

# Diretórios a ignorar
IGNORE_DIRS = {'.git', 'node_modules', '.venv', 'venv', '__pycache__', '.next', 'dist', 'build'}

def should_process_file(file_path):
    """Verifica se o arquivo deve ser processado."""
    # Ignora o próprio script de substituição
    if file_path.name == 'replace-emojis.py':
        return False
    
    # Verifica extensão
    if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        return False
    
    return True

def replace_emojis_in_file(file_path):
    """Substitui emojis em um arquivo."""
    try:
        # Lê o arquivo
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Substitui cada emoji
        for emoji, svg in EMOJI_MAPPING.items():
            content = content.replace(emoji, svg)
        
        # Se o conteúdo mudou, escreve de volta
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Conta quantas substituições foram feitas
            changes = sum(original_content.count(emoji) for emoji in EMOJI_MAPPING.keys())
            return changes
        
        return 0
    
    except Exception as e:
        print(f"Erro ao processar {file_path}: {e}")
        return 0

def walk_directory(root_dir):
    """Caminha pelo diretório do projeto."""
    root = Path(root_dir)
    
    for item in root.rglob('*'):
        # Ignora diretórios
        if item.is_dir():
            if item.name in IGNORE_DIRS:
                # Pula todo o diretório
                for part in item.parts:
                    if part in IGNORE_DIRS:
                        break
                continue
        
        # Processa apenas arquivos suportados
        if item.is_file() and should_process_file(item):
            yield item

def main():
    """Executa o script de substituição."""
    root_dir = Path(__file__).parent
    
    print(f"🚀 Iniciando substituição de emojis em: {root_dir}")
    print(f"📊 Total de emojis mapeados: {len(EMOJI_MAPPING)}")
    print("-" * 60)
    
    total_changes = 0
    files_processed = 0
    files_modified = 0
    
    for file_path in walk_directory(root_dir):
        files_processed += 1
        changes = replace_emojis_in_file(file_path)
        
        if changes > 0:
            files_modified += 1
            relative_path = file_path.relative_to(root_dir)
            print(f"✅ {relative_path}: {changes} substituições")
            total_changes += changes
    
    print("-" * 60)
    print(f"📈 Resumo:")
    print(f"   Arquivos processados: {files_processed}")
    print(f"   Arquivos modificados: {files_modified}")
    print(f"   Total de substituições: {total_changes}")
    print("✨ Concluído!")

if __name__ == '__main__':
    main()
