import re

with open('storefront.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Remove backdrop-filter on mobile top-nav
pattern = r'(\.top-nav\s*\{\s*height:\s*auto;\s*padding:\s*12px\s*0;)'
new_css = r'\1\n    backdrop-filter: none;\n    -webkit-backdrop-filter: none;\n    background: #ffffff;'
css = re.sub(pattern, new_css, css)

with open('storefront.css', 'w', encoding='utf-8') as f:
    f.write(css)
