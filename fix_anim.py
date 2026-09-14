import re

with open('storefront.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace the animation
pattern = r'\.cart-button\.cart-pulse\s*\{[\s\S]*?@keyframes\s*cartPulse\s*\{[\s\S]*?\}'
new_animation = """\.cart-button.cart-pulse {
  animation: cartBounce 0.6s cubic-bezier(0.36, 0, 0.66, -0.56) both;
}

.cart-button.cart-pulse .cart-badge {
  animation: badgePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

@keyframes cartBounce {
  0%, 100% { transform: scale(1) rotate(0); }
  20% { transform: scale(1.3) rotate(-10deg); color: var(--mint-strong); }
  40% { transform: scale(1.3) rotate(10deg); color: var(--mint-strong); }
  60% { transform: scale(1.15) rotate(-5deg); }
  80% { transform: scale(1.15) rotate(5deg); }
}

@keyframes badgePop {
  0%, 100% { transform: scale(1); background-color: var(--mint-strong); }
  50% { transform: scale(1.5); background-color: #ef4444; }
}"""

# Need to escape backslash for python string
new_animation = new_animation.replace('\\.', '.')

css = re.sub(pattern, new_animation, css)

with open('storefront.css', 'w', encoding='utf-8') as f:
    f.write(css)
