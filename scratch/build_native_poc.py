import os
import pickle
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']
MASTER_SHEET_ID = '1NKFadQSCuw7CdLVtXLoNns_1RDYzceX2Nwg_JUg4XK4'

def main():
    creds = None
    if os.path.exists('token_sheets.pickle'):
        with open('token_sheets.pickle', 'rb') as token:
            creds = pickle.load(token)
            
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0, open_browser=False)
        with open('token_sheets.pickle', 'wb') as token:
            pickle.dump(creds, token)

    drive_service = build('drive', 'v3', credentials=creds)
    sheets_service = build('sheets', 'v4', credentials=creds)

    print("1. Đang clone bản Master Template (Premium)...")
    copied_file = {'name': '🚀 [BẢN GIAO KHÁCH] Quản Lý Công Nợ VIP Pro'}
    new_sheet = drive_service.files().copy(fileId=MASTER_SHEET_ID, body=copied_file).execute()
    new_sheet_id = new_sheet.get('id')
    print(f"-> Tạo thành công file nhân bản ID: {new_sheet_id}")

    print("2. Đang bơm dữ liệu (Inject Data) dành riêng cho khách hàng vào file mới...")
    
    # Bơm dữ liệu vào sheet Cài Đặt Chung (Ví dụ: Tên công ty khách hàng mua phần mềm)
    # Trong sheet "⚙️ Cài Đặt Chung", giả sử tên Shop nằm ở B4
    update_setup = {
        "range": "'⚙️ Cài Đặt Chung'!B4:B5",
        "values": [
            ["Cửa Hàng Vật Liệu Xây Dựng TÁM VUI"], # Tên Shop Mới
            ["0909.888.999"] # Số Điện Thoại Mới
        ]
    }
    
    # Bơm dữ liệu vào DM Khách Hàng
    update_customers = {
        "range": "'👥 DM Khách Hàng'!A3:F5",
        "values": [
            ["KH001", "Trần Văn Khách A", "VIP", "Anh A", "0901111111", "a@gmail.com"],
            ["KH002", "Nguyễn Thị Khách B", "Thường", "Chị B", "0902222222", "b@gmail.com"],
            ["KH003", "Cty TNHH Khách C", "Sỉ", "Chú C", "0903333333", "c@gmail.com"]
        ]
    }

    body = {
        "valueInputOption": "USER_ENTERED",
        "data": [update_setup, update_customers]
    }

    sheets_service.spreadsheets().values().batchUpdate(spreadsheetId=new_sheet_id, body=body).execute()
    
    print("-> Bơm dữ liệu thành công!")
    print("\n=======================================================")
    print(f"🔥 FILE ĐÃ SẴN SÀNG ĐỂ DÙNG NGAY: https://docs.google.com/spreadsheets/d/{new_sheet_id}/edit")
    print("=======================================================\n")

if __name__ == '__main__':
    main()
