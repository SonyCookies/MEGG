from app.actions.ping import handle_ping
from app.actions.defect_detection import handle_defect_detection

ACTIONS = {
  "ping": handle_ping,
  "defect_detection": handle_defect_detection
}

WEBSOCKET_PATH = "/ws"