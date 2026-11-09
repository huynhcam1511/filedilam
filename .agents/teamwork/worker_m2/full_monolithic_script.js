/**
 * =============================================================================
 * QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM
 * MONOLITHIC FLAT SPA SCRIPT ENGINE
 * Architecture: Model-View Flat Monolith (Matching TAISAN_Index.html Golden Standard)
 * =============================================================================
 */

// 1. GLOBAL STATE & COMPREHENSIVE DEFAULT SEED DATA
window.AppState = {
  currentTab: 'tab-dashboard',
  sidebarCollapsed: false,
  data: {
    doiTac: [
      {
        maDT: 'KHNG-102938', maDoiTac: 'KHNG-102938', MaDoiTac: 'KHNG-102938', 'Mã ĐT': 'KHNG-102938',
        tenDT: 'Công ty CP Đầu Tư Alpha', tenDoiTac: 'Công ty CP Đầu Tư Alpha', TenDoiTac: 'Công ty CP Đầu Tư Alpha', 'Tên Đối Tác': 'Công ty CP Đầu Tư Alpha',
        loaiDT: 'Khách hàng', loai: 'Khách hàng', LoaiDoiTac: 'KH', 'Loại': 'Khách hàng',
        sdt: '0903123456', SoDienThoai: '0903123456', 'SĐT': '0903123456',
        email: 'alpha.corp@gmail.com', Email: 'alpha.corp@gmail.com',
        diaChi: '72 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', DiaChi: '72 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', 'Địa Chỉ': '72 Lê Lợi, Bến Nghé, Quận 1, TP.HCM',
        hanMucTinDung: 50000000, HanMucTinDung: 50000000, 'Hạn Mức Tín Dụng': 50000000,
        hanNoNgay: 30, HanNoNgay: 30, 'Hạn Nợ (Ngày)': 30,
        ghiChu: 'Khách hàng VIP dự án nội thất', GhiChu: 'Khách hàng VIP dự án nội thất',
        trangThai: 'Đang giao dịch', TrangThai: 'Đang giao dịch'
      },
      {
        maDT: 'KHNG-294819', maDoiTac: 'KHNG-294819', MaDoiTac: 'KHNG-294819', 'Mã ĐT': 'KHNG-294819',
        tenDT: 'Đại Lý Phân Phối Minh Khang', tenDoiTac: 'Đại Lý Phân Phối Minh Khang', TenDoiTac: 'Đại Lý Phân Phối Minh Khang', 'Tên Đối Tác': 'Đại Lý Phân Phối Minh Khang',
        loaiDT: 'Khách hàng', loai: 'Khách hàng', LoaiDoiTac: 'KH', 'Loại': 'Khách hàng',
        sdt: '0918765432', SoDienThoai: '0918765432', 'SĐT': '0918765432',
        email: 'minhkhang.dist@gmail.com', Email: 'minhkhang.dist@gmail.com',
        diaChi: '128 Nguyễn Trãi, Thanh Xuân, Hà Nội', DiaChi: '128 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Địa Chỉ': '128 Nguyễn Trãi, Thanh Xuân, Hà Nội',
        hanMucTinDung: 30000000, HanMucTinDung: 30000000, 'Hạn Mức Tín Dụng': 30000000,
        hanNoNgay: 15, HanNoNgay: 15, 'Hạn Nợ (Ngày)': 15,
        ghiChu: 'Đại lý độc quyền miền Bắc', GhiChu: 'Đại lý độc quyền miền Bắc',
        trangThai: 'Đang giao dịch', TrangThai: 'Đang giao dịch'
      },
      {
        maDT: 'NCCP-582910', maDoiTac: 'NCCP-582910', MaDoiTac: 'NCCP-582910', 'Mã ĐT': 'NCCP-582910',
        tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', tenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', TenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', 'Tên Đối Tác': 'Tổng Kho Vật Tư Nam Sài Gòn',
        loaiDT: 'Nhà cung cấp', loai: 'Nhà cung cấp', LoaiDoiTac: 'NCC', 'Loại': 'Nhà cung cấp',
        sdt: '0982345678', SoDienThoai: '0982345678', 'SĐT': '0982345678',
        email: 'vattu.namsaigon@gmail.com', Email: 'vattu.namsaigon@gmail.com',
        diaChi: 'Khu CN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM', DiaChi: 'Khu CN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM', 'Địa Chỉ': 'Khu CN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM',
        hanMucTinDung: 100000000, HanMucTinDung: 100000000, 'Hạn Mức Tín Dụng': 100000000,
        hanNoNgay: 45, HanNoNgay: 45, 'Hạn Nợ (Ngày)': 45,
        ghiChu: 'Nhà cung cấp vật tư chính', GhiChu: 'Nhà cung cấp vật tư chính',
        trangThai: 'Đang giao dịch', TrangThai: 'Đang giao dịch'
      },
      {
        maDT: 'NCCP-691823', maDoiTac: 'NCCP-691823', MaDoiTac: 'NCCP-691823', 'Mã ĐT': 'NCCP-691823',
        tenDT: 'Xưởng Sản Xuất Bao Bì Toàn Cầu', tenDoiTac: 'Xưởng Sản Xuất Bao Bì Toàn Cầu', TenDoiTac: 'Xưởng Sản Xuất Bao Bì Toàn Cầu', 'Tên Đối Tác': 'Xưởng Sản Xuất Bao Bì Toàn Cầu',
        loaiDT: 'Nhà cung cấp', loai: 'Nhà cung cấp', LoaiDoiTac: 'NCC', 'Loại': 'Nhà cung cấp',
        sdt: '0977889900', SoDienThoai: '0977889900', 'SĐT': '0977889900',
        email: 'baobi.toancau@gmail.com', Email: 'baobi.toancau@gmail.com',
        diaChi: 'Lô 4B Cụm CN Hưng Yên', DiaChi: 'Lô 4B Cụm CN Hưng Yên', 'Địa Chỉ': 'Lô 4B Cụm CN Hưng Yên',
        hanMucTinDung: 20000000, HanMucTinDung: 20000000, 'Hạn Mức Tín Dụng': 20000000,
        hanNoNgay: 30, HanNoNgay: 30, 'Hạn Nợ (Ngày)': 30,
        ghiChu: 'Cung ứng thùng carton', GhiChu: 'Cung ứng thùng carton',
        trangThai: 'Đang giao dịch', TrangThai: 'Đang giao dịch'
      }
    ],
    phatSinhNo: [
      {
        maGD: 'HOAD-102931', maPhatSinh: 'HOAD-102931', MaHoaDon: 'HOAD-102931', 'Mã GD': 'HOAD-102931',
        maDT: 'KHNG-102938', maDoiTac: 'KHNG-102938', MaDoiTac: 'KHNG-102938', 'Mã ĐT': 'KHNG-102938',
        tenDT: 'Công ty CP Đầu Tư Alpha', tenDoiTac: 'Công ty CP Đầu Tư Alpha', TenDoiTac: 'Công ty CP Đầu Tư Alpha', 'Tên ĐT': 'Công ty CP Đầu Tư Alpha',
        loaiGD: 'Bán hàng', loai: 'Bán hàng', LoaiGD: 'PHAI_THU', 'Loại GD': 'Bán hàng',
        soTien: 25000000, SoTien: 25000000, SoTienGoc: 25000000, 'Số Tiền': 25000000,
        daTra: 10000000, daThanhToan: 10000000, DaTra: 10000000, 'Đã Thanh Toán': 10000000,
        conLai: 15000000, conNo: 15000000, ConLai: 15000000, 'Còn Lại': 15000000,
        hanThanhToan: '15/02/2026', HanThanhToan: '15/02/2026', 'Hạn Thanh Toán': '15/02/2026',
        ngayChungTu: '16/01/2026', NgayPhatSinh: '16/01/2026', 'Ngày Chứng Từ': '16/01/2026',
        soHoaDon: 'HD-00129', SoHoaDonDo: 'HD-00129', 'Số Hóa Đơn': 'HD-00129',
        ghiChu: 'Đơn hàng setup văn phòng Q1', GhiChu: 'Đơn hàng setup văn phòng Q1',
        trangThai: 'Còn nợ', TrangThai: 'Còn nợ', 'Trạng Thái': 'Còn nợ'
      },
      {
        maGD: 'HOAD-204918', maPhatSinh: 'HOAD-204918', MaHoaDon: 'HOAD-204918', 'Mã GD': 'HOAD-204918',
        maDT: 'KHNG-294819', maDoiTac: 'KHNG-294819', MaDoiTac: 'KHNG-294819', 'Mã ĐT': 'KHNG-294819',
        tenDT: 'Đại Lý Phân Phối Minh Khang', tenDoiTac: 'Đại Lý Phân Phối Minh Khang', TenDoiTac: 'Đại Lý Phân Phối Minh Khang', 'Tên ĐT': 'Đại Lý Phân Phối Minh Khang',
        loaiGD: 'Bán hàng', loai: 'Bán hàng', LoaiGD: 'PHAI_THU', 'Loại GD': 'Bán hàng',
        soTien: 18000000, SoTien: 18000000, SoTienGoc: 18000000, 'Số Tiền': 18000000,
        daTra: 18000000, daThanhToan: 18000000, DaTra: 18000000, 'Đã Thanh Toán': 18000000,
        conLai: 0, conNo: 0, ConLai: 0, 'Còn Lại': 0,
        hanThanhToan: '05/03/2026', HanThanhToan: '05/03/2026', 'Hạn Thanh Toán': '05/03/2026',
        ngayChungTu: '21/02/2026', NgayPhatSinh: '21/02/2026', 'Ngày Chứng Từ': '21/02/2026',
        soHoaDon: 'HD-00135', SoHoaDonDo: 'HD-00135', 'Số Hóa Đơn': 'HD-00135',
        ghiChu: 'Lô hàng giao đợt 1', GhiChu: 'Lô hàng giao đợt 1',
        trangThai: 'Đã tất toán', TrangThai: 'Đã tất toán', 'Trạng Thái': 'Đã tất toán'
      },
      {
        maGD: 'HOAD-305829', maPhatSinh: 'HOAD-305829', MaHoaDon: 'HOAD-305829', 'Mã GD': 'HOAD-305829',
        maDT: 'NCCP-582910', maDoiTac: 'NCCP-582910', MaDoiTac: 'NCCP-582910', 'Mã ĐT': 'NCCP-582910',
        tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', tenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', TenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', 'Tên ĐT': 'Tổng Kho Vật Tư Nam Sài Gòn',
        loaiGD: 'Mua hàng', loai: 'Mua hàng', LoaiGD: 'PHAI_TRA', 'Loại GD': 'Mua hàng',
        soTien: 45000000, SoTien: 45000000, SoTienGoc: 45000000, 'Số Tiền': 45000000,
        daTra: 20000000, daThanhToan: 20000000, DaTra: 20000000, 'Đã Thanh Toán': 20000000,
        conLai: 25000000, conNo: 25000000, ConLai: 25000000, 'Còn Lại': 25000000,
        hanThanhToan: '20/02/2026', HanThanhToan: '20/02/2026', 'Hạn Thanh Toán': '20/02/2026',
        ngayChungTu: '06/01/2026', NgayPhatSinh: '06/01/2026', 'Ngày Chứng Từ': '06/01/2026',
        soHoaDon: 'PO-2026-08', SoHoaDonDo: 'PO-2026-08', 'Số Hóa Đơn': 'PO-2026-08',
        ghiChu: 'Nhập gỗ An Cường đợt đầu', GhiChu: 'Nhập gỗ An Cường đợt đầu',
        trangThai: 'Còn nợ', TrangThai: 'Còn nợ', 'Trạng Thái': 'Còn nợ'
      },
      {
        maGD: 'HOAD-492019', maPhatSinh: 'HOAD-492019', MaHoaDon: 'HOAD-492019', 'Mã GD': 'HOAD-492019',
        maDT: 'KHNG-102938', maDoiTac: 'KHNG-102938', MaDoiTac: 'KHNG-102938', 'Mã ĐT': 'KHNG-102938',
        tenDT: 'Công ty CP Đầu Tư Alpha', tenDoiTac: 'Công ty CP Đầu Tư Alpha', TenDoiTac: 'Công ty CP Đầu Tư Alpha', 'Tên ĐT': 'Công ty CP Đầu Tư Alpha',
        loaiGD: 'Bán hàng', loai: 'Bán hàng', LoaiGD: 'PHAI_THU', 'Loại GD': 'Bán hàng',
        soTien: 12500000, SoTien: 12500000, SoTienGoc: 12500000, 'Số Tiền': 12500000,
        daTra: 0, daThanhToan: 0, DaTra: 0, 'Đã Thanh Toán': 0,
        conLai: 12500000, conNo: 12500000, ConLai: 12500000, 'Còn Lại': 12500000,
        hanThanhToan: '10/01/2026', HanThanhToan: '10/01/2026', 'Hạn Thanh Toán': '10/01/2026',
        ngayChungTu: '25/12/2025', NgayPhatSinh: '25/12/2025', 'Ngày Chứng Từ': '25/12/2025',
        soHoaDon: 'HD-00118', SoHoaDonDo: 'HD-00118', 'Số Hóa Đơn': 'HD-00118',
        ghiChu: 'Cung cấp phụ kiện decor', GhiChu: 'Cung cấp phụ kiện decor',
        trangThai: 'Còn nợ', TrangThai: 'Còn nợ', 'Trạng Thái': 'Còn nợ'
      }
    ],
    thanhToan: [
      {
        maTT: 'PTHU-102938', maThanhToan: 'PTHU-102938', 'Mã TT': 'PTHU-102938',
        maGD: 'HOAD-102931', maPhatSinh: 'HOAD-102931', MaHoaDon: 'HOAD-102931', 'Mã GD': 'HOAD-102931',
        maDT: 'KHNG-102938', maDoiTac: 'KHNG-102938', MaDoiTac: 'KHNG-102938', 'Mã ĐT': 'KHNG-102938',
        tenDT: 'Công ty CP Đầu Tư Alpha', tenDoiTac: 'Công ty CP Đầu Tư Alpha', TenDoiTac: 'Công ty CP Đầu Tư Alpha', 'Tên ĐT': 'Công ty CP Đầu Tư Alpha',
        loaiTT: 'Thu nợ', loaiThanhToan: 'Thu nợ', 'Loại TT': 'Thu nợ',
        soTien: 10000000, SoTien: 10000000, 'Số Tiền': 10000000,
        phuongThuc: 'Chuyển khoản VietQR', PhuongThuc: 'Chuyển khoản VietQR', 'Phương Thức': 'Chuyển khoản VietQR',
        ngayTT: '18/01/2026', ngayThanhToan: '18/01/2026', 'Ngày TT': '18/01/2026',
        ghiChu: 'Tạm ứng đợt 1 hợp đồng', GhiChu: 'Tạm ứng đợt 1 hợp đồng',
        maThamChieu: 'VCB-98230192', MaThamChieu: 'VCB-98230192'
      },
      {
        maTT: 'PTHU-203948', maThanhToan: 'PTHU-203948', 'Mã TT': 'PTHU-203948',
        maGD: 'HOAD-204918', maPhatSinh: 'HOAD-204918', MaHoaDon: 'HOAD-204918', 'Mã GD': 'HOAD-204918',
        maDT: 'KHNG-294819', maDoiTac: 'KHNG-294819', MaDoiTac: 'KHNG-294819', 'Mã ĐT': 'KHNG-294819',
        tenDT: 'Đại Lý Phân Phối Minh Khang', tenDoiTac: 'Đại Lý Phân Phối Minh Khang', TenDoiTac: 'Đại Lý Phân Phối Minh Khang', 'Tên ĐT': 'Đại Lý Phân Phối Minh Khang',
        loaiTT: 'Thu nợ', loaiThanhToan: 'Thu nợ', 'Loại TT': 'Thu nợ',
        soTien: 18000000, SoTien: 18000000, 'Số Tiền': 18000000,
        phuongThuc: 'Chuyển khoản VietQR', PhuongThuc: 'Chuyển khoản VietQR', 'Phương Thức': 'Chuyển khoản VietQR',
        ngayTT: '28/02/2026', ngayThanhToan: '28/02/2026', 'Ngày TT': '28/02/2026',
        ghiChu: 'Tất toán hóa đơn HD-00135', GhiChu: 'Tất toán hóa đơn HD-00135',
        maThamChieu: 'TCB-81923011', MaThamChieu: 'TCB-81923011'
      },
      {
        maTT: 'PTRA-304918', maThanhToan: 'PTRA-304918', 'Mã TT': 'PTRA-304918',
        maGD: 'HOAD-305829', maPhatSinh: 'HOAD-305829', MaHoaDon: 'HOAD-305829', 'Mã GD': 'HOAD-305829',
        maDT: 'NCCP-582910', maDoiTac: 'NCCP-582910', MaDoiTac: 'NCCP-582910', 'Mã ĐT': 'NCCP-582910',
        tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', tenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', TenDoiTac: 'Tổng Kho Vật Tư Nam Sài Gòn', 'Tên ĐT': 'Tổng Kho Vật Tư Nam Sài Gòn',
        loaiTT: 'Trả nợ', loaiThanhToan: 'Trả nợ', 'Loại TT': 'Trả nợ',
        soTien: 20000000, SoTien: 20000000, 'Số Tiền': 20000000,
        phuongThuc: 'Chuyển khoản', PhuongThuc: 'Chuyển khoản', 'Phương Thức': 'Chuyển khoản',
        ngayTT: '15/01/2026', ngayThanhToan: '15/01/2026', 'Ngày TT': '15/01/2026',
        ghiChu: 'Thanh toán đợt 1 tiền vật tư', GhiChu: 'Thanh toán đợt 1 tiền vật tư',
        maThamChieu: 'MB-39102831', MaThamChieu: 'MB-39102831'
      }
    ],
    danhMuc: [
      { Nhom: 'HinhThucThanhToan', loai: 'HINH_THUC_TT', LoaiDanhMuc: 'HINH_THUC_TT', Ma: 'CK_VIETQR', maDanhMuc: 'CK_VIETQR', Ten: 'Chuyển khoản VietQR', giaTri: 'Chuyển khoản VietQR', GhiChu: 'Thanh toán quét mã ngân hàng', ghiChu: 'Thanh toán quét mã ngân hàng' },
      { Nhom: 'HinhThucThanhToan', loai: 'HINH_THUC_TT', LoaiDanhMuc: 'HINH_THUC_TT', Ma: 'TIEN_MAT', maDanhMuc: 'TIEN_MAT', Ten: 'Tiền mặt', giaTri: 'Tiền mặt', GhiChu: 'Thu/chi tiền mặt trực tiếp', ghiChu: 'Thu/chi tiền mặt trực tiếp' },
      { Nhom: 'HinhThucThanhToan', loai: 'HINH_THUC_TT', LoaiDanhMuc: 'HINH_THUC_TT', Ma: 'CHUYEN_KHOAN', maDanhMuc: 'CHUYEN_KHOAN', Ten: 'Chuyển khoản thường', giaTri: 'Chuyển khoản thường', GhiChu: 'Internet Banking thông thường', ghiChu: 'Internet Banking thông thường' },
      { Nhom: 'LoaiDoiTac', loai: 'LOAI_DOI_TAC', LoaiDanhMuc: 'LOAI_DOI_TAC', Ma: 'KHACH_HANG', maDanhMuc: 'KHACH_HANG', Ten: 'Khách hàng', giaTri: 'Khách hàng', GhiChu: 'Đối tác phát sinh công nợ phải thu', ghiChu: 'Đối tác phát sinh công nợ phải thu' },
      { Nhom: 'LoaiDoiTac', loai: 'LOAI_DOI_TAC', LoaiDanhMuc: 'LOAI_DOI_TAC', Ma: 'NHA_CUNG_CAP', maDanhMuc: 'NHA_CUNG_CAP', Ten: 'Nhà cung cấp', giaTri: 'Nhà cung cấp', GhiChu: 'Đối tác phát sinh công nợ phải trả', ghiChu: 'Đối tác phát sinh công nợ phải trả' },
      { Nhom: 'TrangThaiNo', loai: 'TRANG_THAI_NO', LoaiDanhMuc: 'TRANG_THAI_NO', Ma: 'CON_NO', maDanhMuc: 'CON_NO', Ten: 'Còn nợ', giaTri: 'Còn nợ', GhiChu: 'Hóa đơn chưa thanh toán hoặc thanh toán 1 phần', ghiChu: 'Hóa đơn chưa thanh toán hoặc thanh toán 1 phần' },
      { Nhom: 'TrangThaiNo', loai: 'TRANG_THAI_NO', LoaiDanhMuc: 'TRANG_THAI_NO', Ma: 'DA_TAT_TOAN', maDanhMuc: 'DA_TAT_TOAN', Ten: 'Đã tất toán', giaTri: 'Đã tất toán', GhiChu: 'Đã thanh toán đủ toàn bộ', ghiChu: 'Đã thanh toán đủ toàn bộ' },
      { Nhom: 'TrangThaiNo', loai: 'TRANG_THAI_NO', LoaiDanhMuc: 'TRANG_THAI_NO', Ma: 'QUA_HAN', maDanhMuc: 'QUA_HAN', Ten: 'Quá hạn', giaTri: 'Quá hạn', GhiChu: 'Còn nợ và đã vượt quá hạn thanh toán', ghiChu: 'Còn nợ và đã vượt quá hạn thanh toán' }
    ],
    caiDat: {
      tenDoanhNghiep: 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM',
      TenCoSo: 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM',
      TEN_DON_VI: 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM',
      diaChi: 'Tòa nhà Innovation Hub, Quận 1, TP.HCM',
      DiaChi: 'Tòa nhà Innovation Hub, Quận 1, TP.HCM',
      DIA_CHI: 'Tòa nhà Innovation Hub, Quận 1, TP.HCM',
      hotline: '0901234567',
      Hotline: '0901234567',
      SO_DIEN_THOAI: '0901234567',
      email: 'contact@filedilam.com',
      Email: 'contact@filedilam.com',
      EMAIL: 'contact@filedilam.com',
      nganHang: 'Vietcombank',
      NganHang: 'Vietcombank',
      NGAN_HANG: 'Vietcombank',
      soTaiKhoan: '9901234567',
      SoTaiKhoan: '9901234567',
      STK: '9901234567',
      chuTaiKhoan: 'CONG TY TNHH FILE DI LAM',
      ChuTaiKhoan: 'CONG TY TNHH FILE DI LAM',
      CHU_TAI_KHOAN: 'CONG TY TNHH FILE DI LAM',
      mauNhacNoZalo: 'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ đến ngày {NGAY_HIEN_TAI}: Tổng dư nợ còn lại là {CON_LAI} đ. Hạn thanh toán: {HAN_THANH_TOAN}. Vui lòng chuyển khoản về STK {STK} ({NGAN_HANG}) - CTK {CHU_TAI_KHOAN}. Xin chân thành cảm ơn Quý đối tác!',
      MAU_NHAC_NO_ZALO: 'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ đến ngày {NGAY_HIEN_TAI}: Tổng dư nợ còn lại là {CON_LAI} đ. Hạn thanh toán: {HAN_THANH_TOAN}. Vui lòng chuyển khoản về STK {STK} ({NGAN_HANG}) - CTK {CHU_TAI_KHOAN}. Xin chân thành cảm ơn Quý đối tác!'
    }
  }
};
var AppState = window.AppState;

// 2. TAB TITLES METADATA
const TabMeta = {
  'tab-dashboard': { title: 'Tổng Quan & Nhắc Nợ', subtitle: 'Theo dõi tổng quan công nợ, hạn thu trả và gửi tin nhắc nợ' },
  'tab-transactions': { title: 'Thu - Trả Nợ', subtitle: 'Ghi nhận phiếu thu tiền khách hàng và phiếu trả nợ nhà cung cấp' },
  'tab-invoices': { title: 'Sổ Hóa Đơn & Nợ', subtitle: 'Quản lý phát sinh nợ chi tiết, hóa đơn mua/bán và đối soát chứng từ' },
  'tab-partners': { title: 'Hồ Sơ Đối Tác', subtitle: 'Danh bạ Khách hàng và Nhà cung cấp kèm sổ công nợ chi tiết' },
  'tab-categories': { title: 'Danh Mục Hệ Thống', subtitle: 'Phân loại nhóm khách hàng, nhà cung cấp và hình thức thanh toán' },
  'tab-settings': { title: 'Cài Đặt & Cấu Hình QR', subtitle: 'Thông tin cơ sở kinh doanh, tài khoản ngân hàng và mã VietQR' },
  'tab-help': { title: 'Hướng Dẫn Sử Dụng', subtitle: 'Quy trình vận hành chuẩn 3 bước và kênh hỗ trợ FILE ĐI LÀM' }
};

// 3. CENTRAL ROUTER: switchTab(tabId)
function switchTab(tabId) {
  if (!tabId) return;
  if (!tabId.startsWith('tab-')) {
    tabId = 'tab-' + tabId;
  }
  if (!TabMeta[tabId]) return;
  AppState.currentTab = tabId;

  // 1. Ẩn tất cả tab-pane và kích hoạt tab đang chọn
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.remove('hidden');

  // 2. Kích hoạt trực tiếp hàm render tương ứng
  if (tabId === 'tab-dashboard') renderDashboard();
  else if (tabId === 'tab-transactions') renderTransactions();
  else if (tabId === 'tab-invoices') renderInvoices();
  else if (tabId === 'tab-partners') renderPartners();
  else if (tabId === 'tab-categories') renderCategories();
  else if (tabId === 'tab-settings') renderSettings();
  else if (tabId === 'tab-help') renderHelp();

  // 3. Cập nhật tiêu đề Header
  const topTitle = document.getElementById('top-header-title') || document.getElementById('top-page-title');
  if (topTitle) topTitle.innerText = TabMeta[tabId].title;
  const topSubtitle = document.getElementById('top-header-subtitle') || document.getElementById('top-page-subtitle');
  if (topSubtitle) topSubtitle.innerText = TabMeta[tabId].subtitle;

  // 4. Cập nhật Sidebar Desktop Active
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-brand-50', 'text-brand-600', 'font-bold');
    el.classList.add('text-slate-600');
  });
  const rawId = tabId.replace('tab-', '');
  const activeNav = document.getElementById('nav-' + tabId) ||
                    document.getElementById('nav-tab-' + rawId) ||
                    document.getElementById('nav-btn-' + rawId);
  if (activeNav) {
    activeNav.classList.remove('text-slate-600');
    activeNav.classList.add('bg-brand-50', 'text-brand-600', 'font-bold');
  }

  // 5. Cập nhật Mobile Bottom Dock Active
  document.querySelectorAll('.dock-item, .mobile-nav-item').forEach(el => {
    el.classList.remove('text-brand-600', 'font-bold');
    el.classList.add('text-slate-400');
  });
  const activeMob = document.getElementById('mobile-' + tabId) ||
                    document.getElementById('mobile-tab-' + rawId) ||
                    document.getElementById('dock-btn-' + rawId);
  if (activeMob) {
    activeMob.classList.remove('text-slate-400');
    activeMob.classList.add('text-brand-600', 'font-bold');
  }

  // 6. Vẽ lại icon Lucide
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// 4. CHART.JS LIFECYCLE MANAGEMENT
let ChartInstances = {};
if (typeof window !== 'undefined') {
  window.ChartInstances = ChartInstances;
}

function destroyChart(key) {
  if (ChartInstances[key]) {
    try {
      ChartInstances[key].destroy();
    } catch (e) {
      // Ignore destroy error
    }
    ChartInstances[key] = null;
  }
}

function destroyAllCharts() {
  Object.keys(ChartInstances).forEach(k => destroyChart(k));
}

// 5. FORMATTING & CORE UTILITIES
function formatVND(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' đ';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('/')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return String(dateStr);
  }
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysOverdue(targetDate) {
  if (!targetDate) return -1;
  const target = parseDate(targetDate);
  if (!target) return -1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - target.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function generateId(prefix) {
  const p = prefix ? prefix.toUpperCase() : 'REC';
  const rand = Math.floor(100000 + Math.random() * 900000);
  return p + '-' + rand;
}

function numberToWords(num) {
  if (!num || num === 0) return 'Không đồng';
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];

  let strNum = Math.abs(Math.round(num)).toString();
  let groups = [];
  while (strNum.length > 0) {
    groups.unshift(strNum.slice(Math.max(0, strNum.length - 3)));
    strNum = strNum.slice(0, Math.max(0, strNum.length - 3));
  }

  function readGroup(g, isLast) {
    let n = parseInt(g, 10);
    if (n === 0) return '';
    let tram = Math.floor(n / 100);
    let chuc = Math.floor((n % 100) / 10);
    let donVi = n % 10;
    let res = '';
    if (tram > 0 || !isLast) {
      res += digits[tram] + ' trăm ';
    }
    if (chuc > 1) {
      res += digits[chuc] + ' mươi ';
      if (donVi === 1) res += 'mốt ';
      else if (donVi === 5) res += 'lăm ';
      else if (donVi > 0) res += digits[donVi] + ' ';
    } else if (chuc === 1) {
      res += 'mười ';
      if (donVi === 5) res += 'lăm ';
      else if (donVi > 0) res += digits[donVi] + ' ';
    } else {
      if (tram > 0 && donVi > 0) res += 'lẻ ' + digits[donVi] + ' ';
      else if (donVi > 0) res += digits[donVi] + ' ';
    }
    return res.trim();
  }

  let resultWords = [];
  for (let i = 0; i < groups.length; i++) {
    let grp = groups[i];
    let unitIdx = groups.length - 1 - i;
    let grpWords = readGroup(grp, i === 0);
    if (grpWords) {
      resultWords.push(grpWords + (units[unitIdx] ? ' ' + units[unitIdx] : ''));
    }
  }

  let finalStr = resultWords.join(' ').trim();
  if (!finalStr) return 'Không đồng';
  finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1) + ' đồng';
  return finalStr;
}

// 6. UI NOTIFICATION & MODAL CONTROLS
function showToast(title, message = '', type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const isErr = type === 'error';
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-xs max-w-sm w-full transform transition-all duration-300 translate-y-2 opacity-0 bg-white ${isErr ? 'border-rose-200' : 'border-emerald-200'}`;

  const iconName = isErr ? 'alert-circle' : 'check-circle';
  const iconColor = isErr ? 'text-rose-600' : 'text-emerald-600';

  toast.innerHTML = `
    <div class="shrink-0 ${iconColor} mt-0.5"><i data-lucide="${iconName}" class="w-4 h-4"></i></div>
    <div class="flex-1 min-w-0">
      <div class="font-bold text-slate-900">${title}</div>
      ${message ? `<div class="text-slate-500 mt-0.5 leading-relaxed truncate">${message}</div>` : ''}
    </div>
  `;

  container.appendChild(toast);
  if (window.lucide && typeof window.lucide.createIcons === 'function') lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

let pendingConfirmAction = null;
function showConfirmModal(title, message, onConfirm) {
  if (typeof title === 'object') {
    onConfirm = title.onConfirm;
    message = title.message;
    title = title.title;
  }
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-msg');
  if (titleEl) titleEl.innerText = title || 'Xác nhận thao tác';
  if (msgEl) msgEl.innerText = message || 'Bạn có chắc chắn muốn thực hiện hành động này?';
  pendingConfirmAction = onConfirm;
  if (modal) modal.classList.remove('hidden');
}

const confirmCancelBtn = document.getElementById('confirm-modal-cancel');
if (confirmCancelBtn) {
  confirmCancelBtn.onclick = () => {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
    pendingConfirmAction = null;
  };
}

const confirmOkBtn = document.getElementById('confirm-modal-ok');
if (confirmOkBtn) {
  confirmOkBtn.onclick = () => {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
    if (typeof pendingConfirmAction === 'function') {
      pendingConfirmAction();
    }
    pendingConfirmAction = null;
  };
}

// 7. DRAWER (DESKTOP SLIDE-OVER & MOBILE BOTTOM SHEET)
function openDrawer(title, htmlContent) {
  const drawer = document.getElementById('action-drawer');
  const backdrop = document.getElementById('action-drawer-backdrop');
  if (title && document.getElementById('drawer-title')) {
    document.getElementById('drawer-title').innerText = title;
  }
  if (htmlContent && document.getElementById('drawer-body')) {
    document.getElementById('drawer-body').innerHTML = htmlContent;
  }
  if (backdrop) backdrop.classList.remove('hidden');
  if (drawer) {
    drawer.classList.remove('hidden');
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        drawer.classList.remove('lg:translate-x-full', 'translate-y-full');
      });
    } else {
      drawer.classList.remove('lg:translate-x-full', 'translate-y-full');
    }
  }
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function closeDrawer() {
  const drawer = document.getElementById('action-drawer');
  const backdrop = document.getElementById('action-drawer-backdrop');
  if (backdrop) backdrop.classList.add('hidden');
  if (drawer) {
    drawer.classList.add('lg:translate-x-full', 'translate-y-full');
    setTimeout(() => {
      drawer.classList.add('hidden');
    }, 300);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('desktop-sidebar');
  if (!sidebar) return;
  AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
  if (AppState.sidebarCollapsed) {
    sidebar.classList.remove('w-60');
    sidebar.classList.add('w-16');
    document.querySelectorAll('.sidebar-text').forEach(el => el.classList.add('hidden'));
  } else {
    sidebar.classList.remove('w-16');
    sidebar.classList.add('w-60');
    document.querySelectorAll('.sidebar-text').forEach(el => el.classList.remove('hidden'));
  }
}

function setLoading(isLoading) {
  const bar = document.getElementById('top-loading-bar');
  if (!bar) return;
  if (isLoading) {
    bar.classList.remove('-translate-y-full');
  } else {
    bar.classList.add('-translate-y-full');
  }
}

function handleQuickPayment() {
  openTransactionDrawer('PTHU');
}

// 8. DATA SYNC & API BRIDGE
function refreshData() {
  setLoading(true);
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        setLoading(false);
        if (res && res.success && res.data) {
          AppState.data = res.data;
          switchTab(AppState.currentTab);
          showToast('Đồng bộ thành công', 'Dữ liệu công nợ đã cập nhật mới nhất từ Google Sheets.');
        } else {
          showToast('Thông báo nạp dữ liệu', res.error || 'Dùng dữ liệu cục bộ.', 'info');
        }
      })
      .withFailureHandler(err => {
        setLoading(false);
        showToast('Chế độ Ngoại Tuyến', 'Đang sử dụng dữ liệu mẫu dự phòng.', 'info');
      })
      .getInitialData();
  } else {
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
}

// =============================================================================
// MODULE 1: RENDER DASHBOARD & 8 CHARTS & DAILY ACTION CENTER
// =============================================================================
function renderDashboard() {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  const invoices = data.phatSinhNo || [];
  const payments = data.thanhToan || [];

  // 1. TÍNH TOÁN CÁC CHỈ SỐ KPI TÀI CHÍNH
  let totalAR = 0; // Phải thu khách hàng
  let totalAP = 0; // Phải trả nhà cung cấp
  let totalOverdueAmount = 0;
  let overdueCount = 0;

  const partnerMap = {};
  partners.forEach(p => {
    const ma = p.maDT || p.MaDoiTac || p.maDoiTac;
    partnerMap[ma] = {
      ...p,
      maDT: ma,
      tenDT: p.tenDT || p.TenDoiTac || p.tenDoiTac || '',
      sdt: p.sdt || p.SoDienThoai || '',
      loaiDT: p.loaiDT || p.LoaiDoiTac || p.loai || 'Khách hàng',
      conNo: 0
    };
  });

  const dueList = [];

  invoices.forEach(inv => {
    const maDT = inv.maDT || inv.MaDoiTac || inv.maDoiTac;
    const conLai = Number(inv.conLai !== undefined ? inv.conLai : (Number(inv.soTien || 0) - Number(inv.daTra || 0))) || 0;
    const loaiGD = inv.loaiGD || inv.LoaiGD || inv['Loại GD'] || 'Bán hàng';
    const isThu = loaiGD.includes('Bán') || loaiGD.includes('THU') || (partnerMap[maDT] && partnerMap[maDT].loaiDT.includes('Khách'));

    if (isThu) {
      totalAR += conLai;
    } else {
      totalAP += conLai;
    }

    if (partnerMap[maDT]) {
      partnerMap[maDT].conNo += (isThu ? conLai : -conLai);
    }

    // Kiểm tra quá hạn
    if (conLai > 0 && inv.hanThanhToan) {
      const daysOverdue = getDaysOverdue(inv.hanThanhToan);
      if (daysOverdue >= 0) {
        totalOverdueAmount += conLai;
        overdueCount++;
        dueList.push({
          maDT: maDT,
          tenDT: inv.tenDT || (partnerMap[maDT] ? partnerMap[maDT].tenDT : maDT),
          sdt: partnerMap[maDT] ? partnerMap[maDT].sdt : '',
          maHD: inv.maGD || inv.MaHoaDon || inv.soHoaDon || 'HD-CÔNG-NỢ',
          soTien: conLai,
          hanTT: inv.hanThanhToan,
          daysOverdue: daysOverdue
        });
      }
    }
  });

  const netCashFlow = totalAR - totalAP;
  const activeDebtorsCount = Object.values(partnerMap).filter(p => Math.abs(p.conNo) > 1000).length;

  // 2. RENDER 5 THẺ KPI
  const kpiContainer = document.getElementById('dash-kpi-container');
  if (kpiContainer) {
    const cards = [
      {
        title: 'Tổng Phải Thu (AR)',
        sub: 'Khách hàng nợ mình',
        value: formatVND(totalAR),
        icon: 'arrow-down-left',
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        valColor: 'text-emerald-700'
      },
      {
        title: 'Tổng Phải Trả (AP)',
        sub: 'Mình nợ nhà cung cấp',
        value: formatVND(totalAP),
        icon: 'arrow-up-right',
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
        valColor: 'text-amber-700'
      },
      {
        title: 'Dòng Tiền Thuần',
        sub: 'Phải Thu - Phải Trả',
        value: formatVND(netCashFlow),
        icon: 'wallet',
        iconBg: netCashFlow >= 0 ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-rose-50 text-rose-600 border border-rose-100',
        valColor: netCashFlow >= 0 ? 'text-teal-700' : 'text-rose-700'
      },
      {
        title: 'Nợ Đã Quá Hạn',
        sub: overdueCount + ' khoản nợ trễ hẹn',
        value: formatVND(totalOverdueAmount),
        icon: 'alert-triangle',
        iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
        valColor: 'text-rose-700'
      },
      {
        title: 'Đối Tác Đang Có Nợ',
        sub: 'Khách hàng & Nhà cung cấp',
        value: (activeDebtorsCount || partners.length) + ' đối tác',
        icon: 'users',
        iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
        valColor: 'text-slate-800'
      }
    ];

    kpiContainer.innerHTML = cards.map(c => `
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${c.title}</span>
          <div class="w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0">
            <i data-lucide="${c.icon}" class="w-4 h-4"></i>
          </div>
        </div>
        <div>
          <div class="text-base sm:text-lg font-bold ${c.valColor} font-mono tracking-tight">${c.value}</div>
          <div class="text-xs text-slate-400 mt-1">${c.sub}</div>
        </div>
      </div>
    `).join('');
  }

  // 3. RENDER LỊCH NHẮC NỢ HÔM NAY (DAILY ACTION CENTER)
  const dueBadge = document.getElementById('dash-due-count-badge');
  const dateLabel = document.getElementById('dash-current-date-label');
  const dueListContainer = document.getElementById('dash-due-list-container');

  if (dueBadge) {
    dueBadge.textContent = dueList.length + ' khoản';
    dueBadge.className = dueList.length > 0 
      ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 font-mono'
      : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 font-mono';
  }

  if (dateLabel) {
    const now = new Date();
    dateLabel.textContent = `Hôm nay, ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }

  if (dueListContainer) {
    if (dueList.length === 0) {
      dueListContainer.innerHTML = `
        <div class="p-8 text-center">
          <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3 border border-emerald-100">
            <i data-lucide="shield-check" class="w-6 h-6"></i>
          </div>
          <h4 class="text-sm font-bold text-slate-700">Tuyệt vời! Không có khoản nợ nào quá hạn hôm nay</h4>
          <p class="text-xs text-slate-400 mt-1">Tất cả khách hàng và nhà cung cấp đều đang trong hạn cam kết an toàn.</p>
        </div>
      `;
    } else {
      dueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
      dueListContainer.innerHTML = dueList.map(item => {
        const isOverdue = item.daysOverdue > 0;
        const statusText = isOverdue ? `Quá hạn ${item.daysOverdue} ngày` : 'Đến hạn hôm nay';
        const statusDot = isOverdue ? 'bg-rose-500' : 'bg-amber-500';
        const statusColor = isOverdue ? 'text-rose-600' : 'text-amber-600';
        const phoneHtml = item.sdt 
          ? `<a href="tel:${item.sdt}" class="inline-flex items-center gap-1 text-xs text-emerald-600 font-mono hover:underline">
               <i data-lucide="phone" class="w-3.5 h-3.5"></i>
               <span>${item.sdt}</span>
             </a>`
          : `<span class="text-xs text-slate-400 italic">Chưa có SĐT</span>`;

        return `
          <div class="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-semibold text-slate-600">${item.maDT}</span>
                <span class="inline-flex items-center gap-1.5 text-xs font-medium ${statusColor}">
                  <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                  <span>${statusText}</span>
                </span>
                <span class="text-slate-300">|</span>
                <span class="font-mono text-xs text-slate-400">${item.maHD}</span>
              </div>
              <div class="text-sm font-bold text-slate-800">${item.tenDT}</div>
              <div>${phoneHtml}</div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div class="text-left sm:text-right">
                <div class="text-[11px] text-slate-400">Số tiền nợ</div>
                <div class="text-sm font-bold text-rose-600 font-mono">${formatVND(item.soTien)}</div>
              </div>
              <button onclick="copyZaloReminder('${item.maDT}', ${item.soTien})" 
                      class="h-9 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs border border-emerald-200 transition-colors inline-flex items-center gap-1.5 active:scale-95">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Mẫu Nhắc Nợ</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. RENDER 8 BIỂU ĐỒ CHART.JS
  render8Charts({
    totalAR: totalAR,
    totalAP: totalAP,
    partners: partners,
    invoices: invoices,
    payments: payments,
    partnerMap: partnerMap
  });

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function copyZaloReminder(maDT, soTien) {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  const settings = data.caiDat || {};

  const dt = partners.find(d => (d.maDT || d.MaDoiTac) === maDT) || {
    tenDT: 'Quý đối tác',
    sdt: ''
  };

  const tenDoanhNghiep = settings.tenDoanhNghiep || settings.TEN_DON_VI || 'Bộ phận Kế toán';
  const nganHang = settings.nganHang || settings.NGAN_HANG || 'Vietcombank';
  const soTaiKhoan = settings.soTaiKhoan || settings.STK || '0123456789';
  const chuTaiKhoan = settings.chuTaiKhoan || settings.CHU_TAI_KHOAN || 'NGUYEN VAN A';
  const hotline = settings.hotline || settings.SO_DIEN_THOAI || '';

  const tienStr = formatVND(soTien);
  const noiDungCK = 'TT ' + maDT;
  const vietQrLink = `https://img.vietqr.io/image/${nganHang}-${soTaiKhoan}-compact2.png?amount=${Math.round(soTien)}&addInfo=${encodeURIComponent(noiDungCK)}&accountName=${encodeURIComponent(chuTaiKhoan)}`;

  const message = `Kính gửi: ${dt.tenDT} (${maDT})
Từ: ${tenDoanhNghiep}

Bộ phận Kế toán xin gửi thông báo đối soát công nợ tính đến hôm nay:
- Số tiền cần thanh toán: ${tienStr}
- Nội dung chuyển khoản: ${noiDungCK}

Thông tin tài khoản thụ hưởng:
- Ngân hàng: ${nganHang}
- Số tài khoản: ${soTaiKhoan}
- Chủ tài khoản: ${chuTaiKhoan}
- Quét mã VietQR nhanh: ${vietQrLink}

Kính nhờ Quý đối tác thu xếp thanh toán đúng hạn. Nếu đã chuyển khoản, vui lòng phản hồi biên lai giúp chúng tôi.
Trân trọng cảm ơn!${hotline ? '\nHotline hỗ trợ: ' + hotline : ''}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(message)
      .then(() => showToast('Đã sao chép tin nhắn Zalo!', 'Bạn có thể dán trực tiếp vào khung chat Zalo/SMS.'))
      .catch(() => fallbackCopy(message));
  } else {
    fallbackCopy(message);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('Đã sao chép tin nhắn Zalo!', 'Bạn có thể dán vào Zalo ngay.');
  } catch (e) {
    showToast('Sao chép thất bại', 'Vui lòng chọn thủ công nội dung.', 'error');
  }
  document.body.removeChild(textArea);
}

function render8Charts(params) {
  if (typeof Chart === 'undefined') return;

  const mint = '#059669';
  const amber = '#f59e0b';
  const rose = '#f43f5e';
  const blue = '#0284c7';
  const slate = '#64748b';

  // 1. Dòng tiền thu - chi 6 tháng
  destroyChart('cashflow');
  const ctxCashflow = document.getElementById('dash-chart-cashflow');
  if (ctxCashflow) {
    const months = ['T6', 'T7', 'T8', 'T9', 'T10', 'T11'];
    const dataIn = [25000000, 32000000, 28000000, 45000000, 38000000, 52000000];
    const dataOut = [18000000, 22000000, 19000000, 30000000, 25000000, 34000000];
    ChartInstances.cashflow = new Chart(ctxCashflow, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Thực Thu', data: dataIn, backgroundColor: mint, borderRadius: 6 },
          { label: 'Thực Chi', data: dataOut, backgroundColor: amber, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => (v / 1000000) + 'Tr' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 2. Tỷ lệ nợ phải thu / phải trả
  destroyChart('arApRatio');
  const ctxArAp = document.getElementById('dash-chart-ar-ap-ratio');
  if (ctxArAp) {
    const ar = params.totalAR > 0 ? params.totalAR : 42500000;
    const ap = params.totalAP > 0 ? params.totalAP : 25000000;
    ChartInstances.arApRatio = new Chart(ctxArAp, {
      type: 'doughnut',
      data: {
        labels: ['Phải Thu Khách Hàng', 'Phải Trả Nhà Cung Cấp'],
        datasets: [{
          data: [ar, ap],
          backgroundColor: [mint, amber],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } }
      }
    });
  }

  // 3. Phân tích tuổi nợ
  destroyChart('aging');
  const ctxAging = document.getElementById('dash-chart-aging');
  if (ctxAging) {
    ChartInstances.aging = new Chart(ctxAging, {
      type: 'bar',
      data: {
        labels: ['Dưới 30 ngày', '30 - 60 ngày', '60 - 90 ngày', 'Trên 90 ngày'],
        datasets: [{
          label: 'Dư Nợ',
          data: [27500000, 15000000, 8500000, 4000000],
          backgroundColor: [mint, blue, amber, rose],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => (v / 1000000) + 'Tr' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // 4. Top 5 khách hàng nợ nhiều nhất
  destroyChart('topCustomers');
  const ctxTopCust = document.getElementById('dash-chart-top-customers');
  if (ctxTopCust) {
    ChartInstances.topCustomers = new Chart(ctxTopCust, {
      type: 'bar',
      data: {
        labels: ['CP Đầu Tư Alpha', 'ĐL Minh Khang', 'Nội Thất Hoàn Mỹ', 'Cty TM Toàn Thắng', 'Decor Sài Gòn'],
        datasets: [{
          label: 'Dư nợ (VNĐ)',
          data: [27500000, 18000000, 12000000, 9500000, 6000000],
          backgroundColor: mint,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { callback: v => (v / 1000000) + 'Tr' }, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // 5. Top 5 nhà cung cấp cần trả
  destroyChart('topSuppliers');
  const ctxTopSupp = document.getElementById('dash-chart-top-suppliers');
  if (ctxTopSupp) {
    ChartInstances.topSuppliers = new Chart(ctxTopSupp, {
      type: 'bar',
      data: {
        labels: ['Kho Vật Tư Nam SG', 'Bao Bì Toàn Cầu', 'Gỗ An Cường', 'Vận Tải Á Châu', 'Phụ Kiện Việt'],
        datasets: [{
          label: 'Phải trả (VNĐ)',
          data: [25000000, 12000000, 8500000, 5500000, 3200000],
          backgroundColor: amber,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { callback: v => (v / 1000000) + 'Tr' }, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // 6. Tỷ lệ thu hồi nợ đúng hạn
  destroyChart('recoveryRate');
  const ctxRecovery = document.getElementById('dash-chart-recovery-rate');
  if (ctxRecovery) {
    ChartInstances.recoveryRate = new Chart(ctxRecovery, {
      type: 'pie',
      data: {
        labels: ['Đúng Hạn (78%)', 'Trễ Hạn (22%)'],
        datasets: [{
          data: [78, 22],
          backgroundColor: [mint, rose],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } }
      }
    });
  }

  // 7. Cơ cấu phương thức thanh toán
  destroyChart('paymentMethods');
  const ctxMethod = document.getElementById('dash-chart-payment-methods');
  if (ctxMethod) {
    ChartInstances.paymentMethods = new Chart(ctxMethod, {
      type: 'doughnut',
      data: {
        labels: ['VietQR / Banking (82%)', 'Tiền Mặt (18%)'],
        datasets: [{
          data: [82, 18],
          backgroundColor: [blue, slate],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } }
      }
    });
  }

  // 8. Dự báo dòng tiền 4 tuần tới
  destroyChart('forecast');
  const ctxForecast = document.getElementById('dash-chart-forecast');
  if (ctxForecast) {
    ChartInstances.forecast = new Chart(ctxForecast, {
      type: 'line',
      data: {
        labels: ['Tuần 1 (+7 ngày)', 'Tuần 2 (+14 ngày)', 'Tuần 3 (+21 ngày)', 'Tuần 4 (+28 ngày)'],
        datasets: [
          {
            label: 'Dự Kiến Thu',
            data: [15000000, 22000000, 18500000, 31000000],
            borderColor: mint,
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4
          },
          {
            label: 'Dự Kiến Phải Trả',
            data: [8000000, 14000000, 11000000, 19000000],
            borderColor: amber,
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => (v / 1000000) + 'Tr' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

// =============================================================================
// MODULE 2: RENDER TRANSACTIONS (THU - TRẢ NỢ)
// =============================================================================
let currentTxFilter = 'ALL';
let currentTxKeyword = '';

function filterTransactions(type) {
  currentTxFilter = type;
  document.querySelectorAll('.tx-filter-btn').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white', 'shadow-xs');
    btn.classList.add('bg-slate-100', 'text-slate-600');
  });
  const activeBtn = document.getElementById('tx-filter-' + type);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
    activeBtn.classList.add('bg-slate-900', 'text-white', 'shadow-xs');
  }
  renderTransactions();
}

function searchTransactions(val) {
  currentTxKeyword = (val || '').toLowerCase().trim();
  renderTransactions();
}

function renderTransactions() {
  const data = AppState.data || {};
  const list = data.thanhToan || [];

  const filtered = list.filter(item => {
    const maTT = item.maTT || item.MaThanhToan || '';
    const loaiTT = item.loaiTT || item.LoaiTT || item.Loai || 'Thu nợ';
    const isThu = maTT.startsWith('PTHU') || loaiTT.includes('Thu');
    const isTra = maTT.startsWith('PTRA') || loaiTT.includes('Trả');

    if (currentTxFilter === 'PTHU' && !isThu) return false;
    if (currentTxFilter === 'PTRA' && !isTra) return false;

    if (currentTxKeyword) {
      const tenDT = (item.tenDT || item.TenDoiTac || '').toLowerCase();
      const maDT = (item.maDT || item.MaDoiTac || '').toLowerCase();
      const maGD = (item.maGD || item.MaHoaDon || '').toLowerCase();
      const ghiChu = (item.ghiChu || item.GhiChu || '').toLowerCase();
      const match = maTT.toLowerCase().includes(currentTxKeyword) ||
                    tenDT.includes(currentTxKeyword) ||
                    maDT.includes(currentTxKeyword) ||
                    maGD.includes(currentTxKeyword) ||
                    ghiChu.includes(currentTxKeyword);
      if (!match) return false;
    }
    return true;
  });

  const tbody = document.getElementById('tx-table-body');
  const cardsList = document.getElementById('tx-cards-list');
  const emptyState = document.getElementById('tx-empty-state');

  if (!tbody || !cardsList) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    cardsList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  // Desktop Master-Table
  tbody.innerHTML = filtered.map(item => {
    const maTT = item.maTT || item.MaThanhToan || '';
    const loaiTT = item.loaiTT || item.LoaiTT || 'Thu nợ';
    const isThu = maTT.startsWith('PTHU') || loaiTT.includes('Thu');
    const soTien = Number(item.soTien || item.SoTien || 0);
    const ngayTT = formatDate(item.ngayTT || item.NgayTT || '');
    const phuongThuc = item.phuongThuc || item.PhuongThuc || 'Chuyển khoản VietQR';

    const typeBadge = isThu
      ? '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Thu Nợ KH</span>'
      : '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Trả Nợ NCC</span>';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">${maTT}</td>
        <td class="py-3 px-4 text-slate-600 whitespace-nowrap">${ngayTT}</td>
        <td class="py-3 px-4 whitespace-nowrap">${typeBadge}</td>
        <td class="py-3 px-4">
          <div class="font-medium text-slate-900">${item.tenDT || item.TenDoiTac}</div>
          <div class="font-mono text-[11px] text-slate-400">${item.maDT || ''}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="font-mono text-xs text-slate-600">${item.maGD || 'Thu/Trả tự do'}</span>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap font-mono font-bold ${isThu ? 'text-emerald-700' : 'text-rose-700'}">
          ${isThu ? '+' : '-'}${formatVND(soTien)}
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-slate-600">${phuongThuc}</td>
        <td class="py-3 px-4 text-slate-500 max-w-xs truncate">${item.ghiChu || '—'}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="printTransactionSlip('${maTT}')" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition" title="In phiếu">
              <i data-lucide="printer" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteTransaction('${maTT}')" class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Xóa phiếu">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Mobile Cards List
  cardsList.innerHTML = filtered.map(item => {
    const maTT = item.maTT || item.MaThanhToan || '';
    const loaiTT = item.loaiTT || item.LoaiTT || 'Thu nợ';
    const isThu = maTT.startsWith('PTHU') || loaiTT.includes('Thu');
    const soTien = Number(item.soTien || item.SoTien || 0);
    const ngayTT = formatDate(item.ngayTT || item.NgayTT || '');

    return `
      <div class="p-3 bg-white rounded-xl border border-slate-100 mb-2 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-semibold text-slate-700">${maTT}</span>
            <span class="text-[11px] font-medium ${isThu ? 'text-emerald-600' : 'text-rose-600'}">● ${loaiTT}</span>
          </div>
          <span class="font-mono text-xs font-bold ${isThu ? 'text-emerald-700' : 'text-rose-700'}">${isThu ? '+' : '-'}${formatVND(soTien)}</span>
        </div>
        <div class="text-xs font-bold text-slate-900">${item.tenDT || item.TenDoiTac}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
          <span>${ngayTT} • ${item.phuongThuc || 'VietQR'}</span>
          <div class="flex items-center gap-2">
            <button onclick="printTransactionSlip('${maTT}')" class="text-slate-500 hover:text-slate-800"><i data-lucide="printer" class="w-3.5 h-3.5"></i></button>
            <button onclick="deleteTransaction('${maTT}')" class="text-rose-500 hover:text-rose-700"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function openTransactionDrawer(defaultType = 'PTHU', defaultInvoiceId = '') {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  const invoices = data.phatSinhNo || [];
  const settings = data.caiDat || {};

  const partnerOptions = partners.map(p => `
    <option value="${p.maDT}" data-name="${p.tenDT}">${p.maDT} - ${p.tenDT} (${p.loaiDT})</option>
  `).join('');

  const invoiceOptions = invoices.map(i => `
    <option value="${i.maGD}" data-dt="${i.maDT}" data-balance="${i.conLai}">
      ${i.maGD} - ${i.tenDT} (Còn nợ: ${formatVND(i.conLai)})
    </option>
  `).join('');

  const isThu = defaultType === 'PTHU';
  const title = isThu ? 'Lập Phiếu Thu Nợ Khách Hàng' : 'Lập Phiếu Trả Nợ Nhà Cung Cấp';

  const formHtml = `
    <form id="tx-form" onsubmit="handleTransactionSubmit(event)" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Loại giao dịch <span class="text-rose-500">*</span></label>
        <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button type="button" onclick="setDrawerTxType('PTHU')" id="btn-txtype-thu" class="h-9 rounded-lg text-xs font-semibold ${isThu ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500'} transition">
            Thu nợ (PTHU)
          </button>
          <button type="button" onclick="setDrawerTxType('PTRA')" id="btn-txtype-tra" class="h-9 rounded-lg text-xs font-semibold ${!isThu ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500'} transition">
            Trả nợ (PTRA)
          </button>
        </div>
        <input type="hidden" id="form-tx-type" value="${defaultType}">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Đối tác liên quan <span class="text-rose-500">*</span></label>
        <select id="form-tx-partner" required onchange="onTxPartnerChange()" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="">-- Chọn khách hàng hoặc NCC --</option>
          ${partnerOptions}
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Hóa đơn cấn trừ công nợ</label>
        <select id="form-tx-invoice" onchange="onTxInvoiceChange()" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="">-- Thu/Trả tự do (không liên kết HĐ) --</option>
          ${invoiceOptions}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Số tiền thanh toán (đ) <span class="text-rose-500">*</span></label>
          <input type="number" id="form-tx-amount" required placeholder="0" oninput="updateDrawerVietQR()" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:border-brand-500 focus:ring-brand-500/20">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ngày thanh toán <span class="text-rose-500">*</span></label>
          <input type="text" id="form-tx-date" value="${formatDate(new Date())}" required placeholder="dd/mm/yyyy" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Hình thức thanh toán</label>
        <select id="form-tx-method" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="Chuyển khoản VietQR">Chuyển khoản VietQR</option>
          <option value="Tiền mặt">Tiền mặt</option>
          <option value="Chuyển khoản thường">Chuyển khoản thường</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Mã tham chiếu / Số biên nhận</label>
        <input type="text" id="form-tx-ref" placeholder="VCB-98230192..." class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú diễn giải</label>
        <textarea id="form-tx-notes" rows="2" placeholder="Diễn giải thêm nếu có..." class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20"></textarea>
      </div>

      <!-- Khối VietQR Động -->
      <div id="drawer-qr-container" class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
        <div class="w-16 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0">
          <img id="drawer-qr-img" src="https://img.vietqr.io/image/${settings.nganHang || 'Vietcombank'}-${settings.soTaiKhoan || '9901234567'}-compact2.png?amount=0" alt="VietQR" class="w-full h-full object-contain">
        </div>
        <div class="text-[11px] text-slate-600">
          <div class="font-bold text-slate-800">VietQR Tự Động Tạo</div>
          <div>STK: <span class="font-mono font-bold">${settings.soTaiKhoan || '9901234567'}</span> (${settings.nganHang || 'Vietcombank'})</div>
          <div class="text-slate-400">Khách quét mã chuyển tiền chính xác 100%</div>
        </div>
      </div>

      <div class="pt-3 flex items-center gap-3">
        <button type="button" onclick="closeDrawer()" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy bỏ</button>
        <button type="submit" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition">Lưu Phiếu Thanh Toán</button>
      </div>
    </form>
  `;

  openDrawer(title, formHtml);

  if (defaultInvoiceId) {
    const invEl = document.getElementById('form-tx-invoice');
    if (invEl) {
      invEl.value = defaultInvoiceId;
      onTxInvoiceChange();
    }
  }
}

function setDrawerTxType(type) {
  const input = document.getElementById('form-tx-type');
  if (input) input.value = type;
  const isThu = type === 'PTHU';
  const btnThu = document.getElementById('btn-txtype-thu');
  const btnTra = document.getElementById('btn-txtype-tra');
  if (btnThu && btnTra) {
    btnThu.className = `h-9 rounded-lg text-xs font-semibold ${isThu ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500'} transition`;
    btnTra.className = `h-9 rounded-lg text-xs font-semibold ${!isThu ? 'bg-white shadow-xs text-brand-600' : 'text-slate-500'} transition`;
  }
  const titleEl = document.getElementById('drawer-title');
  if (titleEl) {
    titleEl.innerText = isThu ? 'Lập Phiếu Thu Nợ Khách Hàng' : 'Lập Phiếu Trả Nợ Nhà Cung Cấp';
  }
}

function onTxPartnerChange() {
  const pSelect = document.getElementById('form-tx-partner');
  const invSelect = document.getElementById('form-tx-invoice');
  if (!pSelect || !invSelect) return;
  const selectedPartner = pSelect.value;
  Array.from(invSelect.options).forEach((opt, idx) => {
    if (idx === 0) return;
    const optDt = opt.getAttribute('data-dt');
    opt.style.display = (!selectedPartner || optDt === selectedPartner) ? '' : 'none';
  });
}

function onTxInvoiceChange() {
  const invSelect = document.getElementById('form-tx-invoice');
  const amtInput = document.getElementById('form-tx-amount');
  const pSelect = document.getElementById('form-tx-partner');
  if (!invSelect || !amtInput) return;
  const opt = invSelect.options[invSelect.selectedIndex];
  if (opt && opt.value) {
    const bal = opt.getAttribute('data-balance');
    if (bal) amtInput.value = bal;
    const dt = opt.getAttribute('data-dt');
    if (dt && pSelect) pSelect.value = dt;
    updateDrawerVietQR();
  }
}

function updateDrawerVietQR() {
  const amtInput = document.getElementById('form-tx-amount');
  const qrImg = document.getElementById('drawer-qr-img');
  if (!amtInput || !qrImg) return;
  const amount = Number(amtInput.value) || 0;
  const settings = AppState.data.caiDat || {};
  const bank = settings.nganHang || 'Vietcombank';
  const stk = settings.soTaiKhoan || '9901234567';
  qrImg.src = `https://img.vietqr.io/image/${bank}-${stk}-compact2.png?amount=${amount}&addInfo=THANH+TOAN+CONG+NO`;
}

function handleTransactionSubmit(e) {
  e.preventDefault();
  const type = document.getElementById('form-tx-type').value;
  const partnerSelect = document.getElementById('form-tx-partner');
  const maDT = partnerSelect.value;
  const tenDT = partnerSelect.options[partnerSelect.selectedIndex]?.getAttribute('data-name') || maDT;
  const maGD = document.getElementById('form-tx-invoice').value;
  const soTien = Number(document.getElementById('form-tx-amount').value) || 0;
  const ngayTT = document.getElementById('form-tx-date').value;
  const phuongThuc = document.getElementById('form-tx-method').value;
  const maThamChieu = document.getElementById('form-tx-ref').value;
  const ghiChu = document.getElementById('form-tx-notes').value;

  const prefix = type === 'PTHU' ? 'PTHU' : 'PTRA';
  const maTT = generateId(prefix);

  const payload = {
    maTT: maTT,
    maGD: maGD,
    maDT: maDT,
    tenDT: tenDT,
    loaiTT: type === 'PTHU' ? 'Thu nợ' : 'Trả nợ',
    soTien: soTien,
    phuongThuc: phuongThuc,
    ngayTT: ngayTT,
    ghiChu: ghiChu,
    maThamChieu: maThamChieu
  };

  if (!AppState.data.thanhToan) AppState.data.thanhToan = [];
  AppState.data.thanhToan.unshift(payload);

  // Cấn trừ tự động hóa đơn nếu có
  if (maGD && AppState.data.phatSinhNo) {
    const inv = AppState.data.phatSinhNo.find(i => (i.maGD || i.MaHoaDon) === maGD);
    if (inv) {
      inv.daTra = (Number(inv.daTra) || 0) + soTien;
      inv.conLai = Math.max(0, (Number(inv.soTien) || 0) - inv.daTra);
      inv.trangThai = inv.conLai === 0 ? 'Đã tất toán' : 'Còn nợ';
    }
  }

  closeDrawer();
  renderTransactions();
  showToast('Lưu phiếu thành công', `Đã tạo ${maTT} cho ${tenDT}`);

  // Gọi RPC Google Apps Script
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.saveThanhToan(payload);
  }
}

function deleteTransaction(maTT) {
  showConfirmModal('Xóa phiếu thanh toán', `Bạn có chắc muốn xóa phiếu ${maTT}? Số tiền sẽ được khôi phục lại vào dư nợ hóa đơn.`, () => {
    if (AppState.data && AppState.data.thanhToan) {
      const idx = AppState.data.thanhToan.findIndex(t => (t.maTT || t.MaThanhToan) === maTT);
      if (idx !== -1) {
        const item = AppState.data.thanhToan[idx];
        const maGD = item.maGD || item.MaHoaDon;
        const soTien = Number(item.soTien) || 0;
        AppState.data.thanhToan.splice(idx, 1);

        // Khôi phục nợ hóa đơn
        if (maGD && AppState.data.phatSinhNo) {
          const inv = AppState.data.phatSinhNo.find(i => (i.maGD || i.MaHoaDon) === maGD);
          if (inv) {
            inv.daTra = Math.max(0, (Number(inv.daTra) || 0) - soTien);
            inv.conLai = Math.max(0, (Number(inv.soTien) || 0) - inv.daTra);
            inv.trangThai = inv.conLai === 0 ? 'Đã tất toán' : 'Còn nợ';
          }
        }
      }
    }
    renderTransactions();
    showToast('Đã xóa phiếu', `Phiếu ${maTT} đã được xóa thành công.`);

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run.deleteThanhToan(maTT);
    }
  });
}

function printTransactionSlip(maTT) {
  const data = AppState.data || {};
  const item = (data.thanhToan || []).find(t => (t.maTT || t.MaThanhToan) === maTT) || {
    maTT: maTT,
    tenDT: 'Khách hàng',
    soTien: 10000000,
    ngayTT: formatDate(new Date()),
    phuongThuc: 'Chuyển khoản VietQR',
    ghiChu: 'Thanh toán công nợ'
  };

  const compName = (data.caiDat && data.caiDat.tenDoanhNghiep) || 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM';
  const isThu = (item.maTT || '').startsWith('PTHU') || (item.loaiTT || '').includes('Thu');
  const title = isThu ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN';

  const printWin = window.open('', '_blank', 'width=700,height=800');
  if (!printWin) {
    showToast('Vui lòng bật quyền mở Popup để in phiếu', 'error');
    return;
  }

  printWin.document.write(`
    <html><head><title>${title} - ${item.maTT}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; }
      h2 { text-align: center; margin: 10px 0 4px; font-size: 20px; text-transform: uppercase; }
      .meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
      .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
      .amount-box { margin: 24px 0; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; color: ${isThu ? '#047857' : '#e11d48'}; }
      .sign { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-size: 13px; }
    </style></head><body>
      <div style="font-size:12px; font-weight:bold; color:#475569;">${compName}</div>
      <h2>${title}</h2>
      <div class="meta">Mã phiếu: <b>${item.maTT}</b> — Ngày: ${formatDate(item.ngayTT)}</div>
      <div class="info-row"><span>Đối tượng nộp/nhận:</span><b>${item.tenDT}</b></div>
      <div class="info-row"><span>Mã hóa đơn liên kết:</span><span>${item.maGD || 'Thu/Trả tự do'}</span></div>
      <div class="info-row"><span>Phương thức:</span><span>${item.phuongThuc || 'Chuyển khoản'}</span></div>
      <div class="info-row"><span>Diễn giải lý do:</span><span>${item.ghiChu || 'Thanh toán tiền công nợ'}</span></div>
      <div class="amount-box">Số tiền: ${formatVND(item.soTien)}<br><span style="font-size:12px; font-weight:normal; color:#64748b;">(Bằng chữ: ${numberToWords(item.soTien)})</span></div>
      <div class="sign">
        <div><b>NGƯỜI LẬP PHIẾU</b><br><br><br><br>(Ký & họ tên)</div>
        <div><b>NGƯỜI NỘP / NHẬN</b><br><br><br><br>(Ký & họ tên)</div>
        <div><b>THỦ QUỸ / KẾ TOÁN</b><br><br><br><br>(Ký & đóng dấu)</div>
      </div>
    </body></html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 350);
}

// =============================================================================
// MODULE 3: RENDER INVOICES (SỔ HÓA ĐƠN & ĐỐI SOÁT A4)
// =============================================================================
let currentInvFilter = 'ALL';
let currentInvKeyword = '';

function filterInvoices(type) {
  currentInvFilter = type;
  document.querySelectorAll('.inv-filter-btn').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-600');
  });
  const activeBtn = document.getElementById('filter-inv-' + type);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
    activeBtn.classList.add('bg-slate-900', 'text-white');
  }
  renderInvoices();
}

function searchInvoices(val) {
  currentInvKeyword = (val || '').toLowerCase().trim();
  renderInvoices();
}

function renderInvoices() {
  const data = AppState.data || {};
  const list = data.phatSinhNo || [];

  const filtered = list.filter(item => {
    const conLai = Number(item.conLai !== undefined ? item.conLai : (Number(item.soTien || 0) - Number(item.daTra || 0))) || 0;
    const isOverdue = conLai > 0 && getDaysOverdue(item.hanThanhToan) > 0;

    if (currentInvFilter === 'CON_NO' && conLai <= 0) return false;
    if (currentInvFilter === 'DA_XONG' && conLai > 0) return false;
    if (currentInvFilter === 'QUA_HAN' && !isOverdue) return false;

    if (currentInvKeyword) {
      const maGD = (item.maGD || item.MaHoaDon || '').toLowerCase();
      const tenDT = (item.tenDT || item.TenDoiTac || '').toLowerCase();
      const soHD = (item.soHoaDon || item.SoHoaDonDo || '').toLowerCase();
      const match = maGD.includes(currentInvKeyword) ||
                    tenDT.includes(currentInvKeyword) ||
                    soHD.includes(currentInvKeyword);
      if (!match) return false;
    }
    return true;
  });

  const tbody = document.getElementById('invoices-table-body');
  const cardsList = document.getElementById('invoices-cards-list');
  const emptyState = document.getElementById('invoices-empty-state');

  if (!tbody || !cardsList) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    cardsList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(item => {
    const maGD = item.maGD || item.MaHoaDon || '';
    const soTien = Number(item.soTien || item.SoTien || 0);
    const daTra = Number(item.daTra !== undefined ? item.daTra : item.daThanhToan) || 0;
    const conLai = Number(item.conLai !== undefined ? item.conLai : (soTien - daTra)) || 0;
    const percentPaid = soTien > 0 ? Math.min(100, Math.round((daTra / soTien) * 100)) : 0;
    const isOverdue = conLai > 0 && getDaysOverdue(item.hanThanhToan) > 0;

    let statusHtml = '';
    if (conLai === 0) {
      statusHtml = '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đã tất toán</span>';
    } else if (isOverdue) {
      statusHtml = '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Quá hạn</span>';
    } else {
      statusHtml = '<span class="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Còn nợ</span>';
    }

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">${maGD}</td>
        <td class="py-3 px-4 whitespace-nowrap text-slate-600">${item.loaiGD || 'Bán hàng'}</td>
        <td class="py-3 px-4">
          <div class="font-medium text-slate-900">${item.tenDT || item.TenDoiTac}</div>
          <div class="font-mono text-[11px] text-slate-400">${item.maDT || ''} ${item.soHoaDon ? '• Số HĐ: ' + item.soHoaDon : ''}</div>
        </td>
        <td class="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">${formatVND(soTien)}</td>
        <td class="py-3 px-4 text-right font-mono text-emerald-600 whitespace-nowrap">${formatVND(daTra)}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="font-mono font-bold ${conLai > 0 ? 'text-rose-600' : 'text-slate-400'}">${formatVND(conLai)}</div>
          <div class="w-24 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto overflow-hidden">
            <div class="bg-brand-500 h-1.5 rounded-full" style="width: ${percentPaid}%"></div>
          </div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap text-slate-600">${item.hanThanhToan || '—'}</td>
        <td class="py-3 px-4 whitespace-nowrap">${statusHtml}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openStatementModal('${item.maDT}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition" title="In đối soát A4">
              Đối Soát A4
            </button>
            ${conLai > 0 ? `
              <button onclick="openTransactionDrawer('PTHU', '${maGD}')" class="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition" title="Thu nợ nhanh">
                Thu nợ
              </button>
            ` : ''}
            <button onclick="deleteInvoice('${maGD}')" class="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Xóa">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  cardsList.innerHTML = filtered.map(item => {
    const maGD = item.maGD || item.MaHoaDon || '';
    const soTien = Number(item.soTien || item.SoTien || 0);
    const conLai = Number(item.conLai !== undefined ? item.conLai : (soTien - Number(item.daTra || 0))) || 0;
    return `
      <div class="p-3 bg-white rounded-xl border border-slate-100 mb-2 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-semibold text-slate-700">${maGD}</span>
          <span class="font-mono text-xs font-bold text-rose-600">${formatVND(conLai)}</span>
        </div>
        <div class="text-xs font-bold text-slate-900">${item.tenDT || item.TenDoiTac}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
          <span>Hạn: ${item.hanThanhToan || '—'}</span>
          <div class="flex items-center gap-2">
            <button onclick="openStatementModal('${item.maDT}')" class="text-brand-600 font-semibold hover:underline">Đối Soát</button>
            <button onclick="deleteInvoice('${maGD}')" class="text-rose-500 hover:text-rose-700"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function openInvoiceDrawer(maGD = '') {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  let existing = null;
  if (maGD) {
    existing = (data.phatSinhNo || []).find(i => (i.maGD || i.MaHoaDon) === maGD);
  }

  const partnerOptions = partners.map(p => `
    <option value="${p.maDT}" ${existing && existing.maDT === p.maDT ? 'selected' : ''}>${p.maDT} - ${p.tenDT}</option>
  `).join('');

  const formHtml = `
    <form id="inv-form" onsubmit="handleInvoiceSubmit(event)" class="space-y-4">
      <input type="hidden" id="form-inv-id" value="${maGD || ''}">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Đối tác liên quan <span class="text-rose-500">*</span></label>
        <select id="form-inv-partner" required class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="">-- Chọn khách hàng hoặc nhà cung cấp --</option>
          ${partnerOptions}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Loại giao dịch <span class="text-rose-500">*</span></label>
          <select id="form-inv-type" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
            <option value="Bán hàng" ${existing && existing.loaiGD === 'Bán hàng' ? 'selected' : ''}>Bán hàng (Phải thu)</option>
            <option value="Mua hàng" ${existing && existing.loaiGD === 'Mua hàng' ? 'selected' : ''}>Mua hàng (Phải trả)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Số tiền phát sinh (đ) <span class="text-rose-500">*</span></label>
          <input type="number" id="form-inv-amount" value="${existing ? existing.soTien : ''}" required placeholder="0" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-brand-500 focus:ring-brand-500/20">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Hạn thanh toán <span class="text-rose-500">*</span></label>
          <input type="text" id="form-inv-due" value="${existing ? existing.hanThanhToan : ''}" required placeholder="dd/mm/yyyy" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ngày chứng từ</label>
          <input type="text" id="form-inv-date" value="${existing ? existing.ngayChungTu : formatDate(new Date())}" placeholder="dd/mm/yyyy" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Số hóa đơn VAT / Phiếu PO</label>
        <input type="text" id="form-inv-no" value="${existing ? (existing.soHoaDon || '') : ''}" placeholder="HD-00129..." class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú diễn giải</label>
        <textarea id="form-inv-notes" rows="2" placeholder="Diễn giải nội dung đơn hàng..." class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">${existing ? (existing.ghiChu || '') : ''}</textarea>
      </div>

      <div class="pt-3 flex items-center gap-3">
        <button type="button" onclick="closeDrawer()" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy bỏ</button>
        <button type="submit" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition">Lưu Hóa Đơn</button>
      </div>
    </form>
  `;

  openDrawer(maGD ? 'Cập Nhật Hóa Đơn Nợ' : 'Tạo Hóa Đơn Phát Sinh Nợ', formHtml);
}

function handleInvoiceSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-inv-id').value;
  const pSelect = document.getElementById('form-inv-partner');
  const maDT = pSelect.value;
  const tenDT = pSelect.options[pSelect.selectedIndex]?.text?.split(' - ')[1] || maDT;
  const loaiGD = document.getElementById('form-inv-type').value;
  const soTien = Number(document.getElementById('form-inv-amount').value) || 0;
  const hanTT = document.getElementById('form-inv-due').value;
  const ngayCT = document.getElementById('form-inv-date').value;
  const soHD = document.getElementById('form-inv-no').value;
  const ghiChu = document.getElementById('form-inv-notes').value;

  const maGD = id || generateId('HOAD');

  const payload = {
    maGD: maGD,
    maDT: maDT,
    tenDT: tenDT,
    loaiGD: loaiGD,
    soTien: soTien,
    daTra: 0,
    conLai: soTien,
    hanThanhToan: hanTT,
    ngayChungTu: ngayCT,
    soHoaDon: soHD,
    ghiChu: ghiChu,
    trangThai: 'Còn nợ'
  };

  if (!AppState.data.phatSinhNo) AppState.data.phatSinhNo = [];

  if (id) {
    const idx = AppState.data.phatSinhNo.findIndex(i => (i.maGD || i.MaHoaDon) === id);
    if (idx !== -1) {
      payload.daTra = AppState.data.phatSinhNo[idx].daTra || 0;
      payload.conLai = Math.max(0, soTien - payload.daTra);
      payload.trangThai = payload.conLai === 0 ? 'Đã tất toán' : 'Còn nợ';
      AppState.data.phatSinhNo[idx] = payload;
    }
  } else {
    AppState.data.phatSinhNo.unshift(payload);
  }

  closeDrawer();
  renderInvoices();
  showToast('Đã lưu hóa đơn', `${maGD} - ${formatVND(soTien)}`);

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.savePhatSinhNo(payload);
  }
}

function deleteInvoice(maGD) {
  showConfirmModal('Xóa chứng từ công nợ', `Bạn có chắc muốn xóa hóa đơn ${maGD}? Thao tác này không thể hoàn tác.`, () => {
    if (AppState.data && AppState.data.phatSinhNo) {
      const idx = AppState.data.phatSinhNo.findIndex(i => (i.maGD || i.MaHoaDon) === maGD);
      if (idx !== -1) {
        AppState.data.phatSinhNo.splice(idx, 1);
      }
    }
    renderInvoices();
    showToast('Đã xóa chứng từ', `Hóa đơn ${maGD} đã được xóa thành công.`);

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run.deletePhatSinhNo(maGD);
    }
  });
}

// STATEMENT MODAL (BIÊN BẢN ĐỐI SOÁT A4)
function openStatementModal(maDT) {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  const invoices = data.phatSinhNo || [];
  const payments = data.thanhToan || [];
  const settings = data.caiDat || {};

  const partner = partners.find(p => (p.maDT || p.MaDoiTac) === maDT) || {
    maDT: maDT || 'KHNG-000000',
    tenDT: 'Khách Hàng / Đối Tác Đối Soát',
    loaiDT: 'Khách hàng',
    sdt: '—',
    diaChi: '—'
  };

  const doiSoatCode = 'DOIS-' + Math.floor(100000 + Math.random() * 900000);

  const codeElem = document.getElementById('stmt-modal-code');
  const subtitleElem = document.getElementById('stmt-code-subtitle');
  if (codeElem) codeElem.textContent = doiSoatCode;
  if (subtitleElem) subtitleElem.textContent = `Số: ${doiSoatCode}`;

  const compName = document.getElementById('stmt-company-name');
  const compAddr = document.getElementById('stmt-company-address');
  const compPhone = document.getElementById('stmt-company-phone');
  const sideAName = document.getElementById('stmt-side-a-name');
  const signAName = document.getElementById('stmt-sign-a-name');
  const cName = settings.tenDoanhNghiep || settings.TEN_DON_VI || 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM';

  if (compName) compName.textContent = cName;
  if (compAddr) compAddr.textContent = 'Địa chỉ: ' + (settings.diaChi || settings.DIA_CHI || 'Tòa nhà Innovation Hub, Quận 1, TP.HCM');
  if (compPhone) compPhone.textContent = 'Hotline: ' + (settings.hotline || settings.SO_DIEN_THOAI || '0901234567');
  if (sideAName) sideAName.textContent = cName;
  if (signAName) signAName.textContent = cName;

  const now = new Date();
  const dateStr = `Ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  const dateNowElem = document.getElementById('stmt-date-now');
  if (dateNowElem) dateNowElem.textContent = dateStr;

  const bName = document.getElementById('stmt-side-b-name');
  const bCode = document.getElementById('stmt-side-b-code');
  const bType = document.getElementById('stmt-side-b-type');
  const bPhone = document.getElementById('stmt-side-b-phone');
  const bAddr = document.getElementById('stmt-side-b-address');
  const signBName = document.getElementById('stmt-sign-b-name');

  if (bName) bName.textContent = partner.tenDT || '—';
  if (bCode) bCode.textContent = partner.maDT || '—';
  if (bType) bType.textContent = partner.loaiDT || 'Khách hàng';
  if (bPhone) bPhone.textContent = partner.sdt || '—';
  if (bAddr) bAddr.textContent = partner.diaChi || '—';
  if (signBName) signBName.textContent = partner.tenDT || '—';

  // Hóa đơn phát sinh của đối tác này
  const partnerInvoices = invoices.filter(i => (i.maDT || i.MaDoiTac) === partner.maDT);
  let sumOriginal = 0;
  let sumPaid = 0;
  let sumRemaining = 0;

  const invRows = partnerInvoices.map(inv => {
    const orig = Number(inv.soTien || inv.SoTien || 0);
    const paid = Number(inv.daTra !== undefined ? inv.daTra : inv.daThanhToan) || 0;
    const rem = Number(inv.conLai !== undefined ? inv.conLai : (orig - paid)) || 0;
    sumOriginal += orig;
    sumPaid += paid;
    sumRemaining += rem;

    return `
      <tr class="hover:bg-slate-50/60">
        <td class="py-2.5 px-3 font-mono font-semibold text-slate-800">${inv.maGD || ''}</td>
        <td class="py-2.5 px-3 text-slate-600">${inv.ngayChungTu || '—'}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600">${inv.soHoaDon || '—'}</td>
        <td class="py-2.5 px-3 text-slate-600">${inv.hanThanhToan || '—'}</td>
        <td class="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">${formatVND(orig)}</td>
        <td class="py-2.5 px-3 text-right font-mono text-emerald-600 font-medium">${formatVND(paid)}</td>
        <td class="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">${formatVND(rem)}</td>
      </tr>
    `;
  }).join('');

  const invTbody = document.getElementById('stmt-invoices-tbody');
  if (invTbody) {
    invTbody.innerHTML = invRows || '<tr><td colspan="7" class="py-4 text-center text-slate-400 italic">Không có hóa đơn phát sinh nào trong kỳ</td></tr>';
  }

  const sumOrigEl = document.getElementById('stmt-sum-original');
  const sumPaidEl = document.getElementById('stmt-sum-paid');
  const sumRemEl = document.getElementById('stmt-sum-remaining');
  if (sumOrigEl) sumOrigEl.textContent = formatVND(sumOriginal);
  if (sumPaidEl) sumPaidEl.textContent = formatVND(sumPaid);
  if (sumRemEl) sumRemEl.textContent = formatVND(sumRemaining);

  // Thanh toán đã nhận
  const partnerPayments = payments.filter(pm => (pm.maDT || pm.MaDoiTac) === partner.maDT);
  let sumPayments = 0;
  const payRows = partnerPayments.map(pm => {
    const amt = Number(pm.soTien || pm.SoTien || 0);
    sumPayments += amt;
    return `
      <tr class="hover:bg-slate-50/60">
        <td class="py-2.5 px-3 font-mono font-semibold text-slate-800">${pm.maTT || ''}</td>
        <td class="py-2.5 px-3 text-slate-600">${formatDate(pm.ngayTT || '')}</td>
        <td class="py-2.5 px-3 text-slate-700">${pm.phuongThuc || 'Chuyển khoản'}</td>
        <td class="py-2.5 px-3 font-mono text-slate-600">${pm.maGD || '—'}</td>
        <td class="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">${formatVND(amt)}</td>
      </tr>
    `;
  }).join('');

  const payTbody = document.getElementById('stmt-payments-tbody');
  if (payTbody) {
    payTbody.innerHTML = payRows || '<tr><td colspan="5" class="py-4 text-center text-slate-400 italic">Chưa có giao dịch thanh toán nào được ghi nhận</td></tr>';
  }

  const sumPayEl = document.getElementById('stmt-sum-payments');
  if (sumPayEl) sumPayEl.textContent = formatVND(sumPayments);

  const balanceEl = document.getElementById('stmt-balance-amount');
  const wordsEl = document.getElementById('stmt-balance-in-words');
  const textEl = document.getElementById('stmt-balance-text');

  if (balanceEl) balanceEl.textContent = formatVND(sumRemaining);
  if (wordsEl) wordsEl.textContent = `(Bằng chữ: ${numberToWords(sumRemaining)})`;
  if (textEl) {
    textEl.textContent = partner.loaiDT === 'Nhà cung cấp'
      ? 'Số dư nợ Bên A (Doanh nghiệp) còn phải thanh toán cho Bên B (Nhà Cung Cấp).'
      : 'Số dư nợ Bên B (Khách Hàng) còn phải thanh toán cho Bên A (Doanh nghiệp).';
  }

  const modal = document.getElementById('statement-modal');
  if (modal) modal.classList.remove('hidden');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function closeStatementModal() {
  const modal = document.getElementById('statement-modal');
  if (modal) modal.classList.add('hidden');
}

function printStatementA4() {
  const printArea = document.getElementById('statement-print-area');
  if (!printArea) return;
  const printWin = window.open('', '_blank', 'width=800,height=900');
  if (!printWin) {
    showToast('Vui lòng bật quyền popup để in A4', 'error');
    return;
  }
  printWin.document.write(`
    <html><head><title>Biên Bản Đối Soát Công Nợ A4</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; font-size: 12px; color: #0f172a; line-height: 1.5; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f8fafc; font-weight: bold; }
      .text-right { text-align: right; }
      @media print { body { padding: 0; } }
    </style></head><body>
      ${printArea.innerHTML}
    </body></html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 350);
}

// =============================================================================
// MODULE 4: RENDER PARTNERS (HỒ SƠ ĐỐI TÁC KHÁCH HÀNG / NCC)
// =============================================================================
let currentPartnerFilter = 'ALL';
let currentPartnerKeyword = '';

function filterPartners(type) {
  currentPartnerFilter = type;
  document.querySelectorAll('.partner-filter-btn').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-600');
  });
  const activeBtn = document.getElementById('filter-partner-' + type);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
    activeBtn.classList.add('bg-slate-900', 'text-white');
  }
  renderPartners();
}

function searchPartners(val) {
  currentPartnerKeyword = (val || '').toLowerCase().trim();
  renderPartners();
}

function renderPartners() {
  const data = AppState.data || {};
  const partners = data.doiTac || [];
  const invoices = data.phatSinhNo || [];

  const filtered = partners.filter(p => {
    const loai = (p.loaiDT || p.LoaiDoiTac || p.loai || '').toUpperCase();
    const isKH = loai.includes('KH') || loai.includes('KHÁCH');
    const isNCC = loai.includes('NCC') || loai.includes('CUNG CẤP');

    if (currentPartnerFilter === 'KH' && !isKH) return false;
    if (currentPartnerFilter === 'NCC' && !isNCC) return false;

    if (currentPartnerKeyword) {
      const ten = (p.tenDT || p.TenDoiTac || '').toLowerCase();
      const ma = (p.maDT || p.MaDoiTac || '').toLowerCase();
      const sdt = (p.sdt || p.SoDienThoai || '').toLowerCase();
      const match = ten.includes(currentPartnerKeyword) ||
                    ma.includes(currentPartnerKeyword) ||
                    sdt.includes(currentPartnerKeyword);
      if (!match) return false;
    }
    return true;
  });

  const tbody = document.getElementById('partners-table-body');
  const cardsList = document.getElementById('partners-cards-list');
  const emptyState = document.getElementById('partners-empty-state');

  if (!tbody || !cardsList) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    cardsList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(p => {
    const maDT = p.maDT || p.MaDoiTac || '';
    const loaiDT = p.loaiDT || p.LoaiDoiTac || 'Khách hàng';
    const isKH = loaiDT.includes('Khách') || loaiDT.includes('KH');
    const limit = Number(p.hanMucTinDung || p.HanMucTinDung) || 0;

    // Tính dư nợ từ invoices
    let currentDebt = 0;
    invoices.forEach(inv => {
      if ((inv.maDT || inv.MaDoiTac) === maDT) {
        const conLai = Number(inv.conLai !== undefined ? inv.conLai : (Number(inv.soTien || 0) - Number(inv.daTra || 0))) || 0;
        currentDebt += conLai;
      }
    });

    const isExceeded = limit > 0 && currentDebt > limit;
    const warningBadge = isExceeded
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
           <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Vượt ${Math.round(((currentDebt - limit) / limit) * 100)}%
         </span>`
      : `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
           <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> An toàn
         </span>`;

    const phoneHtml = p.sdt 
      ? `<a href="tel:${p.sdt}" class="font-mono text-xs font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1">
           <i data-lucide="phone" class="w-3.5 h-3.5"></i>
           <span>${p.sdt}</span>
         </a>`
      : `<span class="text-xs text-slate-400 italic">Chưa có</span>`;

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">${maDT}</td>
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="text-xs font-medium ${isKH ? 'text-emerald-700' : 'text-amber-700'}">● ${loaiDT}</span>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${p.tenDT || p.TenDoiTac}</div>
          <div class="text-[11px] text-slate-400 truncate max-w-xs">${p.diaChi || '—'}</div>
        </td>
        <td class="py-3 px-4 whitespace-nowrap">${phoneHtml}</td>
        <td class="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap">${limit > 0 ? formatVND(limit) : 'Không giới hạn'}</td>
        <td class="py-3 px-4 text-right font-mono font-bold ${currentDebt > 0 ? 'text-rose-600' : 'text-slate-400'} whitespace-nowrap">${formatVND(currentDebt)}</td>
        <td class="py-3 px-4 whitespace-nowrap">${warningBadge}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1">
            <button onclick="openStatementModal('${maDT}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition" title="Đối soát A4">
              Đối Soát
            </button>
            <button onclick="openPartnerDrawer('${maDT}')" class="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition" title="Sửa">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deletePartner('${maDT}')" class="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition" title="Xóa">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  cardsList.innerHTML = filtered.map(p => {
    const maDT = p.maDT || p.MaDoiTac || '';
    return `
      <div class="p-3 bg-white rounded-xl border border-slate-100 mb-2 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs font-semibold text-slate-700">${maDT}</span>
          <span class="text-xs font-medium text-emerald-600">${p.loaiDT || 'Khách hàng'}</span>
        </div>
        <div class="text-xs font-bold text-slate-900">${p.tenDT || p.TenDoiTac}</div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-50">
          <span>${p.sdt ? `<a href="tel:${p.sdt}" class="text-emerald-600 font-mono">${p.sdt}</a>` : 'Chưa có SĐT'}</span>
          <div class="flex items-center gap-2">
            <button onclick="openStatementModal('${maDT}')" class="text-brand-600 font-semibold hover:underline">Đối Soát</button>
            <button onclick="openPartnerDrawer('${maDT}')" class="text-slate-600 hover:text-slate-800"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
            <button onclick="deletePartner('${maDT}')" class="text-rose-500 hover:text-rose-700"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function openPartnerDrawer(maDT = '') {
  const data = AppState.data || {};
  let existing = null;
  if (maDT) {
    existing = (data.doiTac || []).find(p => (p.maDT || p.MaDoiTac) === maDT);
  }

  const formHtml = `
    <form id="partner-form" onsubmit="handlePartnerSubmit(event)" class="space-y-4">
      <input type="hidden" id="form-partner-id" value="${maDT || ''}">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Phân loại đối tác <span class="text-rose-500">*</span></label>
        <select id="form-partner-type" required class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="Khách hàng" ${existing && existing.loaiDT === 'Khách hàng' ? 'selected' : ''}>Khách hàng (Nợ phải thu)</option>
          <option value="Nhà cung cấp" ${existing && existing.loaiDT === 'Nhà cung cấp' ? 'selected' : ''}>Nhà cung cấp (Nợ phải trả)</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Tên đơn vị / Đối tác <span class="text-rose-500">*</span></label>
        <input type="text" id="form-partner-name" value="${existing ? existing.tenDT : ''}" required placeholder="Ví dụ: Công ty CP Đầu Tư Alpha" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Số điện thoại <span class="text-rose-500">*</span></label>
          <input type="tel" id="form-partner-phone" value="${existing ? existing.sdt : ''}" required placeholder="0901234567" inputmode="tel" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono focus:border-brand-500 focus:ring-brand-500/20">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Email liên hệ</label>
          <input type="email" id="form-partner-email" value="${existing ? existing.email : ''}" placeholder="alpha@company.com" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Địa chỉ trụ sở / Giao hàng</label>
        <input type="text" id="form-partner-address" value="${existing ? existing.diaChi : ''}" placeholder="Số 72 Lê Lợi, Quận 1, TP.HCM" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Hạn mức tín dụng (đ)</label>
          <input type="number" id="form-partner-limit" value="${existing ? existing.hanMucTinDung : '50000000'}" placeholder="50000000" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono focus:border-brand-500 focus:ring-brand-500/20">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Hạn nợ tối đa (Ngày)</label>
          <input type="number" id="form-partner-days" value="${existing ? existing.hanNoNgay : '30'}" placeholder="30" class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono focus:border-brand-500 focus:ring-brand-500/20">
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú đặc điểm đối tác</label>
        <textarea id="form-partner-notes" rows="2" placeholder="Khách hàng VIP, đối tác chiến lược..." class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">${existing ? (existing.ghiChu || '') : ''}</textarea>
      </div>

      <div class="pt-3 flex items-center gap-3">
        <button type="button" onclick="closeDrawer()" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy bỏ</button>
        <button type="submit" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition">Lưu Hồ Sơ Đối Tác</button>
      </div>
    </form>
  `;

  openDrawer(maDT ? 'Cập Nhật Đối Tác' : 'Thêm Mới Đối Tác', formHtml);
}

function handlePartnerSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-partner-id').value;
  const loaiDT = document.getElementById('form-partner-type').value;
  const tenDT = document.getElementById('form-partner-name').value;
  const sdt = document.getElementById('form-partner-phone').value;
  const email = document.getElementById('form-partner-email').value;
  const diaChi = document.getElementById('form-partner-address').value;
  const limit = Number(document.getElementById('form-partner-limit').value) || 0;
  const days = Number(document.getElementById('form-partner-days').value) || 30;
  const ghiChu = document.getElementById('form-partner-notes').value;

  const prefix = loaiDT === 'Nhà cung cấp' ? 'NCCP' : 'KHNG';
  const maDT = id || generateId(prefix);

  const payload = {
    maDT: maDT,
    loaiDT: loaiDT,
    tenDT: tenDT,
    sdt: sdt,
    email: email,
    diaChi: diaChi,
    hanMucTinDung: limit,
    hanNoNgay: days,
    ghiChu: ghiChu,
    trangThai: 'Đang giao dịch'
  };

  if (!AppState.data.doiTac) AppState.data.doiTac = [];

  if (id) {
    const idx = AppState.data.doiTac.findIndex(p => (p.maDT || p.MaDoiTac) === id);
    if (idx !== -1) {
      AppState.data.doiTac[idx] = { ...AppState.data.doiTac[idx], ...payload };
    }
  } else {
    AppState.data.doiTac.unshift(payload);
  }

  closeDrawer();
  renderPartners();
  showToast('Đã lưu đối tác', `${maDT} - ${tenDT}`);

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.saveDoiTac(payload);
  }
}

function deletePartner(maDT) {
  showConfirmModal('Xóa hồ sơ đối tác', `Bạn có chắc muốn xóa đối tác ${maDT}? Lưu ý: Không thể xóa đối tác đã có lịch sử hóa đơn công nợ.`, () => {
    // Kiểm tra xem đối tác đã có hóa đơn chưa
    const invoices = (AppState.data && AppState.data.phatSinhNo) || [];
    const hasInv = invoices.some(i => (i.maDT || i.MaDoiTac) === maDT);
    if (hasInv) {
      showToast('Không thể xóa đối tác', 'Đối tác này đang có hóa đơn công nợ trong hệ thống.', 'error');
      return;
    }

    if (AppState.data && AppState.data.doiTac) {
      const idx = AppState.data.doiTac.findIndex(p => (p.maDT || p.MaDoiTac) === maDT);
      if (idx !== -1) {
        AppState.data.doiTac.splice(idx, 1);
      }
    }
    renderPartners();
    showToast('Đã xóa đối tác', `Mã ${maDT} đã được xóa thành công.`);

    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run.deleteDoiTac(maDT);
    }
  });
}

// =============================================================================
// MODULE 5: RENDER CATEGORIES (DANH MỤC HỆ THỐNG)
// =============================================================================
let currentCatFilter = 'ALL';
let currentCatKeyword = '';

function filterCategories(type) {
  currentCatFilter = type;
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.classList.remove('bg-slate-900', 'text-white');
    btn.classList.add('bg-slate-100', 'text-slate-600');
  });
  const activeBtn = document.getElementById('filter-cat-' + type);
  if (activeBtn) {
    activeBtn.classList.remove('bg-slate-100', 'text-slate-600');
    activeBtn.classList.add('bg-slate-900', 'text-white');
  }
  renderCategories();
}

function searchCategories(val) {
  currentCatKeyword = (val || '').toLowerCase().trim();
  renderCategories();
}

function renderCategories() {
  const data = AppState.data || {};
  const list = data.danhMuc || [];

  const filtered = list.filter(item => {
    const loai = (item.loai || item.LoaiDanhMuc || item.Nhom || '').toUpperCase();
    if (currentCatFilter === 'HINH_THUC_TT' && !loai.includes('HINH_THUC') && !loai.includes('THANH_TOAN')) return false;
    if (currentCatFilter === 'LOAI_DOI_TAC' && !loai.includes('DOI_TAC')) return false;
    if (currentCatFilter === 'TRANG_THAI_NO' && !loai.includes('TRANG_THAI')) return false;

    if (currentCatKeyword) {
      const ten = (item.Ten || item.giaTri || item.TenDanhMuc || '').toLowerCase();
      const ma = (item.Ma || item.maDanhMuc || '').toLowerCase();
      const ghiChu = (item.GhiChu || item.ghiChu || '').toLowerCase();
      const match = ten.includes(currentCatKeyword) || ma.includes(currentCatKeyword) || ghiChu.includes(currentCatKeyword);
      if (!match) return false;
    }
    return true;
  });

  const tbody = document.getElementById('categories-table-body');
  const cardsList = document.getElementById('categories-cards-list');
  const emptyState = document.getElementById('categories-empty-state');

  if (!tbody || !cardsList) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    cardsList.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map(item => {
    const ma = item.Ma || item.maDanhMuc || '';
    const ten = item.Ten || item.giaTri || item.TenDanhMuc || '';
    const nhom = item.Nhom || item.loai || item.LoaiDanhMuc || 'Chung';
    const ghiChu = item.GhiChu || item.ghiChu || '—';

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            ${nhom}
          </span>
        </td>
        <td class="py-3 px-4 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">${ma}</td>
        <td class="py-3 px-4 font-bold text-slate-900">${ten}</td>
        <td class="py-3 px-4 text-slate-500 text-xs">${ghiChu}</td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <button onclick="openCategoryDrawer('${ma}')" class="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition" title="Sửa">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  cardsList.innerHTML = filtered.map(item => {
    const ma = item.Ma || item.maDanhMuc || '';
    const ten = item.Ten || item.giaTri || item.TenDanhMuc || '';
    const nhom = item.Nhom || item.loai || item.LoaiDanhMuc || 'Chung';
    return `
      <div class="p-3 bg-white rounded-xl border border-slate-100 mb-2 flex items-center justify-between gap-3">
        <div>
          <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">${nhom}</div>
          <div class="text-xs font-bold text-slate-900 mt-0.5">${ten}</div>
          <div class="font-mono text-[11px] text-slate-500 mt-0.5">${ma}</div>
        </div>
        <button onclick="openCategoryDrawer('${ma}')" class="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
      </div>
    `;
  }).join('');

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function openCategoryDrawer(code = '') {
  const data = AppState.data || {};
  let existing = null;
  if (code) {
    existing = (data.danhMuc || []).find(d => (d.Ma || d.maDanhMuc) === code);
  }

  const formHtml = `
    <form id="cat-form" onsubmit="handleCategorySubmit(event)" class="space-y-4">
      <input type="hidden" id="form-cat-original-code" value="${code || ''}">
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Nhóm danh mục <span class="text-rose-500">*</span></label>
        <select id="form-cat-type" required class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs bg-white focus:border-brand-500 focus:ring-brand-500/20">
          <option value="HinhThucThanhToan" ${existing && (existing.Nhom === 'HinhThucThanhToan' || existing.loai === 'HINH_THUC_TT') ? 'selected' : ''}>Hình thức thanh toán</option>
          <option value="LoaiDoiTac" ${existing && (existing.Nhom === 'LoaiDoiTac' || existing.loai === 'LOAI_DOI_TAC') ? 'selected' : ''}>Loại đối tác</option>
          <option value="TrangThaiNo" ${existing && (existing.Nhom === 'TrangThaiNo' || existing.loai === 'TRANG_THAI_NO') ? 'selected' : ''}>Trạng thái nợ</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Mã danh mục (Rút gọn) <span class="text-rose-500">*</span></label>
        <input type="text" id="form-cat-code" value="${existing ? (existing.Ma || existing.maDanhMuc) : ''}" required placeholder="CK_VIETQR..." class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Tên hiển thị <span class="text-rose-500">*</span></label>
        <input type="text" id="form-cat-name" value="${existing ? (existing.Ten || existing.giaTri) : ''}" required placeholder="Chuyển khoản VietQR..." class="w-full h-[44px] px-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Ghi chú diễn giải</label>
        <textarea id="form-cat-notes" rows="2" placeholder="Ghi chú chi tiết nếu có..." class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-brand-500 focus:ring-brand-500/20">${existing ? (existing.GhiChu || existing.ghiChu || '') : ''}</textarea>
      </div>

      <div class="pt-3 flex items-center gap-3">
        <button type="button" onclick="closeDrawer()" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Hủy bỏ</button>
        <button type="submit" class="flex-1 h-[46px] rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition">Lưu Danh Mục</button>
      </div>
    </form>
  `;

  openDrawer(code ? 'Cập Nhật Mục Danh Mục' : 'Thêm Mục Danh Mục Mới', formHtml);
}

function handleCategorySubmit(e) {
  e.preventDefault();
  const origCode = document.getElementById('form-cat-original-code').value;
  const nhom = document.getElementById('form-cat-type').value;
  const code = document.getElementById('form-cat-code').value.trim().toUpperCase();
  const name = document.getElementById('form-cat-name').value.trim();
  const notes = document.getElementById('form-cat-notes').value.trim();

  const payload = {
    Nhom: nhom,
    loai: nhom,
    Ma: code,
    maDanhMuc: code,
    Ten: name,
    giaTri: name,
    GhiChu: notes,
    ghiChu: notes
  };

  if (!AppState.data.danhMuc) AppState.data.danhMuc = [];

  if (origCode) {
    const idx = AppState.data.danhMuc.findIndex(d => (d.Ma || d.maDanhMuc) === origCode);
    if (idx !== -1) {
      AppState.data.danhMuc[idx] = payload;
    }
  } else {
    AppState.data.danhMuc.push(payload);
  }

  closeDrawer();
  renderCategories();
  showToast('Đã lưu danh mục', `${code} - ${name}`);

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.saveDanhMuc({
      nhom: nhom,
      ma: code,
      ten: name,
      ghiChu: notes
    });
  }
}

// =============================================================================
// MODULE 6: RENDER SETTINGS (CÀI ĐẶT CƠ SỞ & CẤU HÌNH VIETQR)
// =============================================================================
function renderSettings() {
  const data = AppState.data || {};
  const cfg = data.caiDat || {};

  const elTen = document.getElementById('setting-ten-co-so');
  const elSdt = document.getElementById('setting-sdt');
  const elEmail = document.getElementById('setting-email');
  const elDiaChi = document.getElementById('setting-dia-chi');
  const elBank = document.getElementById('setting-ngan-hang');
  const elStk = document.getElementById('setting-so-tai-khoan');
  const elName = document.getElementById('setting-chu-tai-khoan');
  const elMsg = document.getElementById('setting-mau-tin-nhan');

  if (elTen) elTen.value = cfg.tenDoanhNghiep || cfg.TEN_DON_VI || 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM';
  if (elSdt) elSdt.value = cfg.hotline || cfg.SO_DIEN_THOAI || '0901234567';
  if (elEmail) elEmail.value = cfg.email || cfg.EMAIL || 'contact@filedilam.com';
  if (elDiaChi) elDiaChi.value = cfg.diaChi || cfg.DIA_CHI || 'Tòa nhà Innovation Hub, Quận 1, TP.HCM';
  if (elBank) elBank.value = cfg.nganHang || cfg.NGAN_HANG || 'Vietcombank';
  if (elStk) elStk.value = cfg.soTaiKhoan || cfg.STK || '9901234567';
  if (elName) elName.value = cfg.chuTaiKhoan || cfg.CHU_TAI_KHOAN || 'CONG TY TNHH FILE DI LAM';
  if (elMsg) elMsg.value = cfg.mauNhacNoZalo || cfg.MAU_NHAC_NO_ZALO || 'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ...';

  updateQRPreview();

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

function updateQRPreview() {
  const elBank = document.getElementById('setting-ngan-hang');
  const elStk = document.getElementById('setting-so-tai-khoan');
  const elName = document.getElementById('setting-chu-tai-khoan');

  const bank = (elBank?.value || 'Vietcombank').trim();
  const stk = (elStk?.value || '9901234567').trim();
  const name = (elName?.value || 'CONG TY TNHH FILE DI LAM').trim().toUpperCase();

  const previewBank = document.getElementById('preview-bank');
  const previewStk = document.getElementById('preview-stk');
  const previewName = document.getElementById('preview-name');
  const qrImg = document.getElementById('setting-qr-image');
  const qrPlaceholder = document.getElementById('setting-qr-placeholder');

  if (previewBank) previewBank.textContent = bank;
  if (previewStk) previewStk.textContent = stk;
  if (previewName) previewName.textContent = name;

  if (qrImg) {
    const cleanName = encodeURIComponent(name);
    const qrUrl = `https://img.vietqr.io/image/${bank}-${stk}-compact2.png?amount=0&accountName=${cleanName}`;
    qrImg.src = qrUrl;
    qrImg.classList.remove('hidden');
    if (qrPlaceholder) qrPlaceholder.classList.add('hidden');
  }
}

function resetZaloTemplate() {
  const elMsg = document.getElementById('setting-mau-tin-nhan');
  if (elMsg) {
    elMsg.value = 'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ đến ngày {NGAY_HIEN_TAI}: Tổng dư nợ còn lại là {CON_LAI} đ. Hạn thanh toán: {HAN_THANH_TOAN}. Vui lòng chuyển khoản về STK {STK} ({NGAN_HANG}) - CTK {CHU_TAI_KHOAN}. Xin chân thành cảm ơn Quý đối tác!';
    showToast('Đã khôi phục mẫu tin nhắn mặc định');
  }
}

function insertZaloTag(tag) {
  const elMsg = document.getElementById('setting-mau-tin-nhan');
  if (!elMsg) return;
  const start = elMsg.selectionStart || elMsg.value.length;
  const end = elMsg.selectionEnd || elMsg.value.length;
  const text = elMsg.value;
  elMsg.value = text.substring(0, start) + tag + text.substring(end);
  elMsg.focus();
  elMsg.selectionStart = elMsg.selectionEnd = start + tag.length;
}

function handleSettingsSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const elTen = document.getElementById('setting-ten-co-so');
  const elSdt = document.getElementById('setting-sdt');
  const elEmail = document.getElementById('setting-email');
  const elDiaChi = document.getElementById('setting-dia-chi');
  const elBank = document.getElementById('setting-ngan-hang');
  const elStk = document.getElementById('setting-so-tai-khoan');
  const elName = document.getElementById('setting-chu-tai-khoan');
  const elMsg = document.getElementById('setting-mau-tin-nhan');

  const settingsObj = {
    TEN_DON_VI: elTen?.value || '',
    tenDoanhNghiep: elTen?.value || '',
    SO_DIEN_THOAI: elSdt?.value || '',
    hotline: elSdt?.value || '',
    EMAIL: elEmail?.value || '',
    email: elEmail?.value || '',
    DIA_CHI: elDiaChi?.value || '',
    diaChi: elDiaChi?.value || '',
    NGAN_HANG: elBank?.value || '',
    nganHang: elBank?.value || '',
    STK: elStk?.value || '',
    soTaiKhoan: elStk?.value || '',
    CHU_TAI_KHOAN: elName?.value || '',
    chuTaiKhoan: elName?.value || '',
    MAU_NHAC_NO_ZALO: elMsg?.value || '',
    mauNhacNoZalo: elMsg?.value || ''
  };

  if (!AppState.data) AppState.data = {};
  AppState.data.caiDat = settingsObj;

  showToast('Đã lưu cài đặt', 'Thông tin doanh nghiệp & tài khoản VietQR đã được lưu.');

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run.saveCaiDat(settingsObj);
  }
}

// =============================================================================
// MODULE 7: RENDER HELP (HƯỚNG DẪN SỬ DỤNG)
// =============================================================================
function renderHelp() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}

// =============================================================================
// 9. BACKWARD COMPATIBILITY BRIDGES (LEGACY WINDOW MODULE OBJECTS)
// =============================================================================
if (typeof window !== 'undefined') {
  window.switchTab = switchTab;
  window.renderDashboard = renderDashboard;
  window.renderTransactions = renderTransactions;
  window.renderInvoices = renderInvoices;
  window.renderPartners = renderPartners;
  window.renderCategories = renderCategories;
  window.renderSettings = renderSettings;
  window.renderHelp = renderHelp;
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
  window.showToast = showToast;
  window.showConfirmModal = showConfirmModal;
  window.openStatementModal = openStatementModal;
  window.closeStatementModal = closeStatementModal;
  window.printStatementA4 = printStatementA4;
  window.filterTransactions = filterTransactions;
  window.searchTransactions = searchTransactions;
  window.openTransactionDrawer = openTransactionDrawer;
  window.handleTransactionSubmit = handleTransactionSubmit;
  window.deleteTransaction = deleteTransaction;
  window.printTransactionSlip = printTransactionSlip;
  window.filterInvoices = filterInvoices;
  window.searchInvoices = searchInvoices;
  window.openInvoiceDrawer = openInvoiceDrawer;
  window.handleInvoiceSubmit = handleInvoiceSubmit;
  window.deleteInvoice = deleteInvoice;
  window.filterPartners = filterPartners;
  window.searchPartners = searchPartners;
  window.openPartnerDrawer = openPartnerDrawer;
  window.handlePartnerSubmit = handlePartnerSubmit;
  window.deletePartner = deletePartner;
  window.filterCategories = filterCategories;
  window.searchCategories = searchCategories;
  window.openCategoryDrawer = openCategoryDrawer;
  window.handleCategorySubmit = handleCategorySubmit;
  window.updateQRPreview = updateQRPreview;
  window.resetZaloTemplate = resetZaloTemplate;
  window.insertZaloTag = insertZaloTag;
  window.handleSettingsSubmit = handleSettingsSubmit;
  window.refreshData = refreshData;
  window.handleQuickPayment = handleQuickPayment;

  // Bridge Objects for any legacy module calls
  window.ModuleDashboard = {
    render: renderDashboard,
    copyZaloReminder: copyZaloReminder
  };
  window.ModuleTransactions = {
    render: renderTransactions,
    setFilter: filterTransactions,
    onSearch: searchTransactions,
    openDrawer: openTransactionDrawer,
    deleteTransaction: deleteTransaction,
    printTransactionSlip: printTransactionSlip
  };
  window.ModuleInvoices = {
    render: renderInvoices,
    filter: filterInvoices,
    search: searchInvoices,
    openCreateDrawer: openInvoiceDrawer,
    openStatementModal: openStatementModal,
    closeStatementModal: closeStatementModal,
    deleteInvoice: deleteInvoice
  };
  window.ModulePartners = {
    render: renderPartners,
    filter: filterPartners,
    search: searchPartners,
    openCreateDrawer: openPartnerDrawer,
    deletePartner: deletePartner
  };
  window.ModuleCategories = {
    render: renderCategories,
    filterType: filterCategories,
    search: searchCategories,
    openDrawer: openCategoryDrawer
  };
  window.ModuleSettings = {
    render: renderSettings,
    save: handleSettingsSubmit,
    updateQRPreview: updateQRPreview,
    resetZaloTemplate: resetZaloTemplate,
    insertTag: insertZaloTag
  };
  window.ModuleHelp = {
    render: renderHelp
  };
}

// 10. INITIALIZATION
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      lucide.createIcons();
    }
    renderSettings();
    switchTab('tab-dashboard');
    refreshData();
  });
}
