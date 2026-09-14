from pathlib import Path
import pickle

from googleapiclient.discovery import build


FILE_ID = "1xir1M-ieP0zqmGE5J4m1rGbxuzTIUaDw7aFoM7GEeZo"
ROOT = Path(__file__).resolve().parents[1]


def main():
    with (ROOT / "token_sheets.pickle").open("rb") as token_file:
        credentials = pickle.load(token_file)

    drive = build("drive", "v3", credentials=credentials, cache_discovery=False)
    permissions = drive.permissions().list(
        fileId=FILE_ID,
        fields="permissions(id,type,role)",
    ).execute().get("permissions", [])

    anyone = next((item for item in permissions if item.get("type") == "anyone"), None)
    if anyone:
        if anyone.get("role") != "reader":
            drive.permissions().update(
                fileId=FILE_ID,
                permissionId=anyone["id"],
                body={"role": "reader"},
            ).execute()
    else:
        drive.permissions().create(
            fileId=FILE_ID,
            body={"type": "anyone", "role": "reader", "allowFileDiscovery": False},
            fields="id,type,role",
        ).execute()

    verified = drive.permissions().list(
        fileId=FILE_ID,
        fields="permissions(id,type,role,allowFileDiscovery)",
    ).execute().get("permissions", [])
    public_permission = next(item for item in verified if item.get("type") == "anyone")
    print({"fileId": FILE_ID, "publicPermission": public_permission})


if __name__ == "__main__":
    main()
