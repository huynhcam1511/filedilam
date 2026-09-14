import os
import pickle
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# If modifying these scopes, delete the file token_sheets.pickle.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file']

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

    service = build('sheets', 'v4', credentials=creds)

    # 1. Create a new Spreadsheet
    spreadsheet = {
        'properties': {
            'title': 'Demo Native Google Sheet (VIP Pro)'
        }
    }
    spreadsheet = service.spreadsheets().create(body=spreadsheet, fields='spreadsheetId').execute()
    spreadsheet_id = spreadsheet.get('spreadsheetId')
    
    print(f"Created Spreadsheet ID: {spreadsheet_id}")
    print(f"Link: https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit")

    # 2. Format the default sheet
    # We will: set column widths, add a header row with background color and bold text
    requests = [
        # Resize column A
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": 0,
                    "dimension": "COLUMNS",
                    "startIndex": 0,
                    "endIndex": 1
                },
                "properties": {
                    "pixelSize": 200
                },
                "fields": "pixelSize"
            }
        },
        # Resize column B
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": 0,
                    "dimension": "COLUMNS",
                    "startIndex": 1,
                    "endIndex": 2
                },
                "properties": {
                    "pixelSize": 300
                },
                "fields": "pixelSize"
            }
        },
        # Write Header and Data
        {
            "updateCells": {
                "range": {
                    "sheetId": 0,
                    "startRowIndex": 0,
                    "endRowIndex": 2,
                    "startColumnIndex": 0,
                    "endColumnIndex": 2
                },
                "rows": [
                    {
                        "values": [
                            {
                                "userEnteredValue": {"stringValue": "Mã Sản Phẩm"},
                                "userEnteredFormat": {
                                    "backgroundColor": {"red": 0.2, "green": 0.4, "blue": 0.8},
                                    "textFormat": {"bold": True, "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}}
                                }
                            },
                            {
                                "userEnteredValue": {"stringValue": "Tên Sản Phẩm"},
                                "userEnteredFormat": {
                                    "backgroundColor": {"red": 0.2, "green": 0.4, "blue": 0.8},
                                    "textFormat": {"bold": True, "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}}
                                }
                            }
                        ]
                    },
                    {
                        "values": [
                            {"userEnteredValue": {"stringValue": "SP001"}},
                            {"userEnteredValue": {"stringValue": "Bộ Quản Lý Công Nợ Premium"}}
                        ]
                    }
                ],
                "fields": "userEnteredValue,userEnteredFormat(backgroundColor,textFormat)"
            }
        }
    ]
    
    body = {'requests': requests}
    service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
    print("Formatting applied successfully!")

if __name__ == '__main__':
    main()
