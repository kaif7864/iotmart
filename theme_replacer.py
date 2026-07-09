import os
import re

# Dictionary of regex patterns and their replacements
replacements = {
    # Backgrounds
    r'\bbg-slate-50\b': 'bg-app-bg',
    r'\bbg-slate-100\b': 'bg-surface-hover',
    r'\bbg-slate-200\b': 'bg-surface-hover',
    r'\bbg-slate-800\b': 'bg-surface-dark',
    r'\bbg-slate-900\b': 'bg-surface-dark',
    r'\bbg-slate-950\b': 'bg-surface-dark',
    r'\bbg-white\b': 'bg-card-bg',
    r'\bbg-slate-700\b': 'bg-lab-surface',
    r'\bbg-slate-600\b': 'bg-lab-surface-hover',
    r'\bbg-\[\#1e1e1e\]\b': 'bg-lab-bg',
    r'\bbg-blue-50\b': 'bg-status-info-bg',
    r'\bbg-amber-50\b': 'bg-status-warning-bg',
    r'\bbg-indigo-50\b': 'bg-status-info-bg',
    r'\bbg-purple-50\b': 'bg-status-info-bg',
    r'\bbg-slate-300\b': 'bg-text-muted',
    
    # Gradients
    r'\bfrom-slate-950\b': 'from-surface-dark',
    r'\bfrom-indigo-[89]00\b': 'from-secondary',
    r'\bto-slate-900\b': 'to-surface-dark',
    r'\bto-blue-400\b': 'to-accent',
    
    # Accents
    r'\bbg-blue-[4-6]00\b': 'bg-accent',
    r'\bbg-sky-[4-6]00\b': 'bg-accent',
    r'\bbg-indigo-[4-6]00\b': 'bg-accent',
    r'\btext-blue-[4-6]00\b': 'text-accent',
    r'\btext-sky-[4-6]00\b': 'text-accent',
    r'\btext-indigo-[4-6]00\b': 'text-accent',
    r'\bborder-blue-[4-6]00\b': 'border-accent',
    r'\bborder-sky-[4-6]00\b': 'border-accent',
    r'\bborder-indigo-[4-6]00\b': 'border-accent',

    # Text Colors
    r'\btext-slate-900\b': 'text-text-primary',
    r'\btext-slate-950\b': 'text-text-primary',
    r'\btext-slate-800\b': 'text-text-primary',
    r'\btext-slate-700\b': 'text-text-secondary',
    r'\btext-slate-600\b': 'text-text-secondary',
    r'\btext-slate-500\b': 'text-text-secondary',
    r'\btext-slate-400\b': 'text-text-muted',
    r'\btext-slate-300\b': 'text-text-muted',
    r'\btext-slate-200\b': 'text-lab-text',
    r'\btext-blue-500\b': 'text-status-info',
    r'\btext-amber-600\b': 'text-status-warning-text',
    r'\btext-purple-500\b': 'text-accent',
    r'\btext-purple-600\b': 'text-accent',
    r'\btext-slate-100\b': 'text-border-subtle',
    r'\btext-yellow-400\b': 'text-status-star',
    r'\bfill-yellow-400\b': 'fill-status-star',
    r'\bbg-emerald-500\b': 'bg-status-success',
    r'\bbg-red-500\b': 'bg-status-danger',
    r'\btext-red-500\b': 'text-status-danger',
    
    # Borders
    r'\bborder-slate-50\b': 'border-border-subtle',
    r'\bborder-slate-100\b': 'border-border-subtle',
    r'\bborder-slate-200\b': 'border-border-main',
    r'\bborder-slate-300\b': 'border-border-main',
    r'\bborder-slate-600\b': 'border-lab-border-light',
    r'\bborder-slate-700\b': 'border-lab-border',
    r'\bborder-lab-border-dark\b': 'border-lab-border-dark',
    r'\bborder-indigo-100\b': 'border-border-subtle',
    r'\bborder-blue-100\b': 'border-border-subtle',
    r'\bborder-white\b': 'border-card-bg',
    
    # Rings
    r'\bring-violet-500\b': 'ring-accent',
    r'\bring-orange-500\b': 'ring-status-warning',
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

if __name__ == "__main__":
    main()
