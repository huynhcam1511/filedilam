import re

with open('storefront.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix modal-backdrop top
pattern_backdrop = r'\.modal-backdrop\s*\{[\s\S]*?inset:\s*0;\s*'
new_backdrop = """.modal-backdrop {
  position: fixed;
  inset: 0;
  top: 70px; /* Leave space for top-nav */
"""
css = re.sub(pattern_backdrop, new_backdrop, css)

# Fix mobile modal-backdrop top
mobile_query_end_pattern = r'body\s*\{\s*padding-top:\s*130px;\s*\}'
mobile_backdrop_fix = """  body {
    padding-top: 130px;
  }
  .modal-backdrop {
    top: 120px; /* Mobile nav is around 120-130px */
  }
  .cart-drawer {
    top: 120px;
    height: calc(100vh - 120px);
  }
"""
css = re.sub(mobile_query_end_pattern, mobile_backdrop_fix, css)

with open('storefront.css', 'w', encoding='utf-8') as f:
    f.write(css)
