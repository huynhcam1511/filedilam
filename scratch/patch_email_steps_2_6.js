const fs = require('fs');

let content = fs.readFileSync('functions/main.py', 'utf8');

// Update Bước 2
const old_b2 = `          <!-- Bước 2 -->
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

const new_b2 = `          <!-- Bước 2 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 2. Bấm vào Menu ứng dụng trên thanh công cụ trang tính:</strong><br>
              <span style="color: #64748b; font-size: 13px;">Khi tạo bản sao xong, đợi khoảng <strong>10–20 giây</strong> là bên phải mục <strong>Trợ giúp (Help)</strong> trên thanh menu sẽ xuất hiện nút ứng dụng (VD: <strong>File Đi Làm Cost &rarr; Mở ứng dụng tính cost</strong>).</span><br>
              <span style="color: #b45309; font-size: 12.5px; font-weight: 600; display: inline-block; margin-top: 5px; background: #fef3c7; padding: 4px 10px; border-radius: 4px; border: 1px solid #fde68a; line-height: 1.45;">Lưu ý: Nếu đợi 10–20 giây chưa thấy nút menu xuất hiện, bạn chỉ cần tải lại trang (F5 hoặc reload trình duyệt).</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/02_menu_mo_ung_dung.jpg" alt="Bước 2: Bấm menu mở ứng dụng" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>`;

// Update Bước 6
const old_b6 = `          <!-- Bước 6 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 6. Bấm "Tiếp tục" (Hoặc Cho phép / Allow):</strong><br>
              <span style="color: #64748b; font-size: 13px;">Ứng dụng sẽ tự động tải và hiển thị ngay trên màn hình. Chỉ cần cấp quyền duy nhất 1 lần đầu tiên này!</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/06_cho_phep_tiep_tuc.jpg" alt="Bước 6: Bấm Tiếp tục / Cho phép" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>`;

const new_b6 = `          <!-- Bước 6 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 6. Bấm "Tiếp tục" (Hoặc Cho phép / Allow):</strong><br>
              <span style="color: #64748b; font-size: 13px;">Sau khi bấm Cho phép / Tiếp tục xong, bạn bấm lại vào Menu ứng dụng &rarr; Chọn <strong>Mở ứng dụng</strong>. Sau đó đợi khoảng <strong>10–20 giây</strong> là ứng dụng Web App sẽ mở ra. Nếu chưa thấy thì tải lại trang (reload / F5).</span><br>
              <span style="color: #059669; font-size: 12.5px; font-weight: 600; display: inline-block; margin-top: 5px; background: #ecfdf5; padding: 4px 10px; border-radius: 4px; border: 1px solid #a7f3d0; line-height: 1.45;">Bạn chỉ cần cấp quyền duy nhất 1 lần đầu tiên này, những lần sau mở là dùng được ngay!</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/06_cho_phep_tiep_tuc.jpg" alt="Bước 6: Bấm Tiếp tục / Cho phép" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>`;

// Update lưu ý quan trọng 2
const old_sec2 = `          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý. (Nếu vừa tạo bản sao mà chưa thấy Menu tiện ích, vui lòng tải lại trang sau 30 giây để Google Sheets nạp tập lệnh).
          </div>`;

const new_sec2 = `          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý. (Khi tạo bản sao đợi khoảng 10–20 giây là bên phải Trợ giúp sẽ có nút menu, nếu chưa thấy thì tải lại trang).
          </div>`;

let count = 0;
if (content.includes(old_b2)) {
  content = content.replace(old_b2, new_b2);
  console.log("Replaced Bước 2 successfully");
  count++;
} else {
  console.log("Could not find Bước 2");
}

if (content.includes(old_b6)) {
  content = content.replace(old_b6, new_b6);
  console.log("Replaced Bước 6 successfully");
  count++;
} else {
  console.log("Could not find Bước 6");
}

if (content.includes(old_sec2)) {
  content = content.replace(old_sec2, new_sec2);
  console.log("Replaced Section 2 successfully");
  count++;
} else {
  console.log("Could not find Section 2");
}

if (count > 0) {
  fs.writeFileSync('functions/main.py', content, 'utf8');
  console.log("functions/main.py successfully saved!");
}
