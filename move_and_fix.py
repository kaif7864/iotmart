import os

files_to_move = {
    'src/components/Navbar.jsx': 'src/components/navigation/Navbar.jsx',
    'src/components/Footer.jsx': 'src/components/navigation/Footer.jsx',
    'src/components/ProductCard.jsx': 'src/components/ui/ProductCard.jsx',
    'src/pages/Home.jsx': 'src/pages/public/Home.jsx',
    'src/pages/Shop.jsx': 'src/pages/public/Shop.jsx',
    'src/pages/ProductDetail.jsx': 'src/pages/public/ProductDetail.jsx',
    'src/pages/Cart.jsx': 'src/pages/shop/Cart.jsx',
    'src/pages/Checkout.jsx': 'src/pages/shop/Checkout.jsx',
}

for old, new in files_to_move.items():
    if os.path.exists(new):
        os.remove(new)
    if os.path.exists(old):
        os.rename(old, new)
        print(f'Moved {old} to {new}')

def fix_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace single quotes
    if 'pages/' in filepath:
        content = content.replace("'../components/ProductCard'", "'../../components/ui/ProductCard'")
        content = content.replace("'../components/", "'../../components/")
        content = content.replace("'../context/", "'../../context/")
        content = content.replace("'../services/", "'../../services/")
        content = content.replace("'../hooks/", "'../../hooks/")
    elif 'components/navigation' in filepath:
        content = content.replace("'../context/", "'../../context/")
        content = content.replace("'../services/", "'../../services/")
        content = content.replace("'../hooks/", "'../../hooks/")
        content = content.replace("'../components/", "'../../components/")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for new in files_to_move.values():
    if os.path.exists(new):
        fix_imports(new)
