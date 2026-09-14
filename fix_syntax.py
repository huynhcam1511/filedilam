import re

with open('storefront.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix the broken CSS
broken_pattern = r'\}\n\s*35%\s*\{\s*transform:\s*scale\(1\.18\)\s*rotate\(-5deg\);\s*\}\n\s*65%\s*\{\s*transform:\s*scale\(1\.08\)\s*rotate\(4deg\);\s*\}\n\}'
css = re.sub(broken_pattern, '}', css)

with open('storefront.css', 'w', encoding='utf-8') as f:
    f.write(css)
