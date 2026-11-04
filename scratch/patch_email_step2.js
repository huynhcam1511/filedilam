const fs = require('fs');
let content = fs.readFileSync('functions/main.py', 'utf8');

const old_b2 = `          <!-- Bước 2 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 2. Bấm vào Menu ứng dụng trên thanh công cụ trang tính:</strong><br>
              <span style="color: #64748b; font-size: 13px;">Nhìn lên thanh menu bên phải trên cùng (cạnh Trợ giúp) &rarr; Bấm vào menu ứng dụng (VD: <strong>File Đi Làm Cost &rarr; Mở ứng dụng tính cost</strong>).</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/02_menu_mo_ung_dung.jpg" alt="Bước 2: Bấm menu mở ứng dụng" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>`;

const new_b2 = `          <!-- Bước 2 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 2. Bấm vào Menu ứng dụng trên thanh công cụ trang tính:</strong><br>
              <span style="color: #64748b; font-size: 13px;">Nhìn lên thanh menu bên phải trên cùng (cạnh Trợ giúp) &rarr; Bấm vào menu ứng dụng (VD: <strong>File Đi Làm Cost &rarr; Mở ứng dụng tính cost</strong>).</span><br>
              <span style="color: #b45309; font-size: 12.5px; font-weight: 600; display: inline-block; margin-top: 5px; background: #fef3c7; padding: 4px 10px; border-radius: 4px; border: 1px solid #fde68a; line-height: 1.45;">Lưu ý: Nếu vừa tạo bản sao xong mà chưa thấy menu xuất hiện ngay, do Google Sheets cần vài giây nạp tập lệnh, bạn hãy tải lại trang (reload / F5) sau khoảng 30 giây là menu sẽ hiển thị đầy đủ.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/02_menu_mo_ung_dung.jpg" alt="Bước 2: Bấm menu mở ứng dụng" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>`;

const old_sec2 = `          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý.
          </div>`;

const new_sec2 = `          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý. (Nếu vừa tạo bản sao mà chưa thấy Menu tiện ích, vui lòng tải lại trang sau 30 giây để Google Sheets nạp tập lệnh).
          </div>`;

let updated = 0;
if (content.includes(old_b2)) {
  content = content.replace(old_b2, new_b2);
  console.log('Replaced old_b2 successfully');
  updated++;
} else {
  console.log('old_b2 not found');
}

if (content.includes(old_sec2)) {
  content = content.replace(old_sec2, new_sec2);
  console.log('Replaced old_sec2 successfully');
  updated++;
} else {
  console.log('old_sec2 not found');
}

if (updated > 0) {
  fs.writeFileSync('functions/main.py', content, 'utf8');
  console.log('Saved functions/main.py');
}
