# D:\4TH YEAR\CAPSTONE\MEGG\ai-backend\app\config.py

from app.actions import handle_ping, handle_defect_detection

# Define the mapping of action types to their handler functions
ACTIONS = {
    "ping": handle_ping,
    "defect_detection": handle_defect_detection,
    # Add more actions and their corresponding handlers here
}

# You can add more configuration variables here as needed
WEBSOCKET_PATH = "/ws"