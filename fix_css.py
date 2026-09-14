import re

with open('storefront.css', 'r', encoding='utf-8') as f:
    css = f.read()

correct_css = '''
.icon-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--muted);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
.icon-button:hover {
  background: var(--bg);
}

/* Cart Drawer */
.cart-drawer {
  position: fixed;
  top: 70px;
  right: 0;
  width: min(400px, 100%);
  height: calc(100vh - 70px);
  z-index: 55;
  background: var(--surface);
  border-left: 1px solid var(--line);
  box-shadow: -4px 0 15px rgba(0,0,0,0.05);
  transform: translateX(105%);
  visibility: hidden;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s 0.3s;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.cart-drawer.is-open {
  transform: translateX(0);
  visibility: visible;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s 0s;
}
'''

pattern = r'\.icon-button\s*\{[\s\S]*?transition:\s*transform[^;]+;\s*\}'
new_css = re.sub(pattern, correct_css.strip(), css)

with open('storefront.css', 'w', encoding='utf-8') as f:
    f.write(new_css)
