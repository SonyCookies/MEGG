# D:\4THYEAR\CAPSTONE\MEGG\iot-backend\utils\logger.py

import logging
import sys

# Create a logger object
logger = logging.getLogger("iot_backend_logger")
logger.setLevel(logging.INFO)  # Set default log level to INFO

# Create console handler to output logs to stdout
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)

# Define a simple log format
formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(name)s - %(message)s'
)
console_handler.setFormatter(formatter)

# Add the console handler to the logger
if not logger.hasHandlers():
    logger.addHandler(console_handler)
