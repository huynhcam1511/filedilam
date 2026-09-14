# File Đi Làm Market Research Pipeline

Pipeline độc lập dùng Apify để thu thập dữ liệu thị trường công khai, chuẩn hóa dữ liệu và tạo báo cáo Markdown định kỳ cho dự án File Đi Làm.

## Nguyên tắc tách biệt

- Mọi mã nguồn, cấu hình, dữ liệu, báo cáo và log nằm trong `FILE_DI_LAM_MVP/market_research/`.
- Pipeline không import, đọc hoặc ghi bất kỳ file nào trong dự án CAMA.
- Không hard-code token. `APIFY_TOKEN` chỉ được đọc từ biến môi trường hoặc file `.env` cục bộ.
- Mặc định chạy `--dry-run`; chỉ gọi Apify khi truyền rõ `--live`.

## Cấu trúc

```text
market_research/
  config/sources.json       # actor và nguồn nghiên cứu
  fixtures/sample_items.json
  scripts/run_pipeline.py   # entrypoint duy nhất
  automation/install_schedule.ps1
  data/                     # raw + normalized theo từng lần chạy
  reports/                  # báo cáo Markdown
  logs/                     # run manifest và scheduler logs
```

## Chạy thử không tốn Apify

```powershell
python market_research/scripts/run_pipeline.py --dry-run
```

## Chạy thật

1. Sao chép `.env.example` thành `.env` trong `market_research/`.
2. Điền `APIFY_TOKEN`.
3. Kiểm tra actor và input trong `config/sources.json`.
4. Chạy:

```powershell
python market_research/scripts/run_pipeline.py --live
```

Chạy pilot một lane với tối đa 2 video cho mỗi hashtag:

```powershell
python market_research/scripts/run_pipeline.py --live --lane tiktok_finance_accounting --max-jobs 1 --max-items-per-job 2
```

Liệt kê các lane và chi phí item ước tính:

```powershell
python market_research/scripts/run_pipeline.py --list-lanes
```

Chạy hai lane theo vòng quay tuần:

```powershell
python market_research/scripts/run_pipeline.py --live --rotation --max-jobs 2
```

## Kỳ phân tích

- Mặc định: 14 ngày gần nhất, tương ứng pipeline production của CAMA.
- Có thể đổi bằng `--lookback-days 14`.
- Có thể nghiên cứu một khoảng cố định bằng `--start 2026-08-01 --end 2026-08-21`.

## Lịch chạy

File `automation/install_schedule.ps1` tạo Windows Scheduled Task. Script chỉ cài lịch khi người vận hành chủ động chạy nó.

Ví dụ chạy 08:00 sáng thứ Hai hằng tuần:

```powershell
powershell -ExecutionPolicy Bypass -File market_research/automation/install_schedule.ps1 -Day Monday -Time 08:00
```

## Đầu ra báo cáo

Báo cáo tự động gồm:

- độ phủ nguồn và lỗi thu thập
- sản phẩm/nội dung nổi bật theo tín hiệu tương tác
- nhóm nhu cầu xuất hiện nhiều
- từ khóa và vấn đề khách hàng
- khoảng giá nếu nguồn trả dữ liệu giá
- khoảng trống sản phẩm
- xếp hạng ý tưởng workbook nên nghiên cứu tiếp
- danh sách bằng chứng và URL để kiểm tra thủ công

## Cấu hình TikTok đã chốt

- Chỉ nghiên cứu TikTok Việt Nam.
- Phạm vi thương hiệu được đọc từ `../FILE_DI_LAM_BRAND.json`.
- Chia thành các lane nghiệp vụ thay vì giới hạn ở quản lý cửa hàng.
- Lấy tối đa 8 video cho mỗi hashtag/nhóm truy vấn.
- Báo cáo hiển thị top 6 bằng chứng có tín hiệu cao nhất.
- Cửa sổ dữ liệu mặc định 14 ngày.
- Các job vẫn để `enabled: false` cho đến khi đã kiểm tra token và actor input bằng một lần chạy nhỏ.
- Nên bật luân phiên 1–2 lane mỗi kỳ thay vì chạy toàn bộ cùng lúc để kiểm soát chi phí.
- Pipeline chặn run vượt 2 lane hoặc vượt 96 item ước tính, trừ khi cấu hình được thay đổi có chủ đích.
- Token được gửi bằng header `Authorization`, không ghi trong URL, report hoặc run log.
- Video TikTok chỉ được giữ khi hashtag truy vấn xuất hiện chính xác trong danh sách hashtag thật của video.
- Kết quả gần giống hoặc fuzzy match của TikTok/actor bị loại và được đếm trong `Sai hashtag chính xác đã loại`.
- Báo cáo có bảng `Sức khỏe hashtag`: raw, đúng hashtag, trong kỳ và khuyến nghị giữ/thay.

Kết luận là tín hiệu hỗ trợ quyết định, không được gọi là số bán thực nếu nền tảng không công khai số bán.
