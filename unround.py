import os
import re

replacements = {
    r'\brounded-3xl\b': 'rounded-sm',
    r'\brounded-2xl\b': 'rounded-sm',
    r'\brounded-xl\b': 'rounded-sm',
    r'\brounded-lg\b': 'rounded-sm',
    r'\brounded-\[40px\]\b': 'rounded-sm',
    r'\brounded-\[32px\]\b': 'rounded-sm',
    r'\brounded-\[20px\]\b': 'rounded-sm',
    r'\brounded-\[16px\]\b': 'rounded-sm',
    # Do not replace rounded-full, rounded-md (already small)
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                process_file(os.path.join(root, file))
                
    css_path = os.path.join(src_dir, 'index.css')
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css_content = f.read()
        # Custom css properties used by tailwind
        css_content = re.sub(r'--radius-app-xl: .*?;', '--radius-app-xl: 4px;', css_content)
        css_content = re.sub(r'--radius-app-2xl: .*?;', '--radius-app-2xl: 4px;', css_content)
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print("Updated index.css")

if __name__ == "__main__":
    main()
