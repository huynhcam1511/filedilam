## 2026-11-14T19:21:52Z
You are the Test Writer subagent responsible for Milestone M2: VietQR & Firestore Compatibility & Automated E2E Testing.
Your working directory is: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2\
Original request record: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_coupon\PROJECT.md
Explorer 3 Report: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\explorer_survey_3\handoff.md
Worker M1 Report: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m1\handoff.md

You MUST read ORIGINAL_REQUEST.md and PROJECT.md before starting work.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A teamwork_auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

## Objective: Milestone M2 — VietQR & Firestore Compatibility & Automated E2E Testing
Construct and execute a comprehensive automated End-to-End test suite (`tests/e2e_coupon_flow.js`) using Node.js, Chrome Headless via CDP WebSocket, and `jsqr` (available globally at `C:\Users\zit\AppData\Roaming\npm\node_modules\jsqr`).

## Test Requirements & Coverage (Must cover all acceptance criteria):
1. **Scenario 1 — Auto-Apply Best Deal (F1, F2, F3)**:
   - Cart with eligible subtotal (e.g. 38.000 đ with FILEDILAM coupon 20%).
   - Navigate to `#thanh-toan`.
   - Assert best coupon is automatically applied without user clicking "Chọn mã".
   - Assert `#checkoutDiscountRow` is displayed with negative discount amount (`-7.600 ₫`).
   - Assert `#checkoutGrandTotal` displays exact discounted price (`30.400 ₫`).
   - Assert applied bar displays "ĐÃ ÁP DỤNG", code `FILEDILAM`, and "Bỏ chọn" button.
2. **Scenario 2 — Deselect & Single-Session Memory (F3, F4)**:
   - Click "Bỏ chọn" on the applied coupon.
   - Assert discount row hides, grand total returns to original subtotal (`38.000 ₫`).
   - Assert session flag `filedilam_user_deselected_coupon` is set to `"true"`.
   - Re-open / reload checkout within the same session.
   - Assert that auto-apply DOES NOT trigger again (user deselect choice is honored).
3. **Scenario 3 — Collapsible Ineligible UI & Secret/Private Voucher (F5, F6)**:
   - Cart with ineligible subtotal or unapplied state.
   - Assert coupon list is collapsed and only the sleek text link "Bạn có mã ưu đãi?" is visible.
   - Click "Bạn có mã ưu đãi?" to expand `#checkoutPromoCollapseContent`.
   - Assert input `#privateCouponInput` and `#btnApplyPrivateCoupon` become visible.
   - Type private voucher code (e.g. `TRIAN20`), submit.
   - Assert discount is applied accurately, totals update, and session deselect flag is cleared.
4. **Scenario 4 — VietQR Generation & Tag 54 Exact Amount Verification (F7)**:
   - Proceed to generate order and render VietQR Canvas in `#qrBox`.
   - Extract raw canvas imageData from the browser.
   - Decode QR code using `jsqr`.
   - Parse EMVCo payload and assert:
     - Tag 54 (Transaction Amount) matches EXACTLY the discounted final total.
     - Tag 62.08 (Additional Data - Memo) contains the valid order reference / transfer note.
5. **Scenario 5 — Firestore Order Payload Schema Verification (F8)**:
   - Intercept / inspect the `/orders` POST payload sent to Cloud Functions.
   - Assert the document payload includes:
     - `amount`: exact discounted amount integer.
     - `discount_amount`: exact discount integer.
     - `coupon_code`: correct applied coupon code (e.g. `FILEDILAM` or `TRIAN20`).
     - `coupon_codes`: array containing the coupon code.
     - `items`: valid cart item array.
     - Math invariant: `amount == subtotal - discount_amount` (matching `promotions.py` requirement).

## Execution & Reporting
- Implement `tests/e2e_coupon_flow.js`.
- Execute it via `node tests/e2e_coupon_flow.js` using `run_command` and capture complete test log output.
- Document all assertions, test outputs, commands, and results in your handoff report:
  `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2\handoff.md`

Follow Handoff Protocol format (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
When finished, send a message to caller with report path.
