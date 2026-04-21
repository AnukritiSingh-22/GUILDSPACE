import os
import re

directory = r'c:\Users\HP\GUILDSPACE\frontend\src'

replacements = [
    (re.compile(r'#0D0D0D', re.IGNORECASE), 'var(--bg)'),
    (re.compile(r'#141414', re.IGNORECASE), 'var(--bg-card)'),
    (re.compile(r'#1A1A1A', re.IGNORECASE), 'var(--bg-elevated)'),
    
    (re.compile(r'(?<=color:\s)#FFF', re.IGNORECASE), 'var(--text-primary)'),
    (re.compile(r'(?<=color:\s)''#FFF''', re.IGNORECASE), '''var(--text-primary)'''),
    (re.compile(r'(?<=color:\s)#FFFFFF', re.IGNORECASE), 'var(--text-primary)'),
    (re.compile(r'(?<=color:\s)''#FFFFFF''', re.IGNORECASE), '''var(--text-primary)'''),
    (re.compile(r'(?<=color:\s)white', re.IGNORECASE), 'var(--text-primary)'),
    (re.compile(r'(?<=color:\s)''white''', re.IGNORECASE), '''var(--text-primary)'''),
    
    (re.compile(r'rgba\(255,\s*255,\s*255,\s*0\.0[68]\)'), 'var(--border)'),
    (re.compile(r'rgba\(255,\s*255,\s*255,\s*0\.1\)'), 'var(--border-mid)'),
    (re.compile(r'rgba\(255,\s*255,\s*255,\s*0\.15\)'), 'var(--border-bright)'),
    (re.compile(r'rgba\(255,\s*255,\s*255,\s*0\.2\)'), 'var(--border-bright)'),
    (re.compile(r'rgba\(255,\s*255,\s*255,\s*0\.25\)'), 'var(--border-bright)'),
    
    (re.compile(r'#A0A0A0', re.IGNORECASE), 'var(--text-sec)'),
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    for pattern, repl in replacements:
        content = pattern.sub(repl, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {filepath}')

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            process_file(os.path.join(root, file))
