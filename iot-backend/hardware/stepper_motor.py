# D:\4THYEAR\CAPSTONE\MEGG\iot-backend\hardware\stepper_motor.py

from utils.logger import logger
import serial
import time
import platform
from serial.tools import list_ports


class StepperMotorDriver:

    _cached_port = None

    def __init__(self, port=None, baudrate=9600):
        self.logger = logger
        self.baudrate = baudrate
        self.serial_conn = None

        self.logger.info("StepperMotorDriver initialized")
        self.logger.info(f"Detected platform.system(): {platform.system()}")


        if port is None:
           if StepperMotorDriver._cached_port is None:
               StepperMotorDriver._cached_port = self._detect_port()
           port = StepperMotorDriver._cached_port
        self.port = port

        self.logger.info(f"Using serial port: {port}")

        self._connect()
    
    def _connect(self):
        try:
            if self.port is None:
                raise serial.SerialException("No serial port detected")
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            time.sleep(2)
            self.logger.info(f"Serial connected on {self.port} at {self.baudrate}")
        except serial.SerialException as e:
            self.logger.error(f"Failed to connect to Arduino: {e}")
            self.serial_conn = None

    def is_connected(self):
        return self.serial_conn is not None and self.serial_conn.is_open


    def reconnect(self):
        self.logger.info("Reconnecting serial port...")
        try:
            if self.serial_conn:
                self.serial_conn.close()
        except Exception:
            pass
        self._connect()

            
    def _detect_port(self):
      system = platform.system()
      self.logger.info(f"Detected platform.system(): {system}")

      ports = list_ports.comports()
      if not ports:
          self.logger.error("No serial ports found!")
          return None

      self.logger.info("Available serial ports:")
      for p in ports:
          self.logger.info(f"  {p.device} - {p.description}")

      if system == "Windows":
          for port in ports:
              desc = port.description.upper()
              if ("ARDUINO" in desc
                  or "USB SERIAL" in desc
                  or "CH340" in desc):
                  self.logger.info(f"Selected port based on description: {port.device}")
                  return port.device
          self.logger.info(f"No Arduino-like port found, using first port: {ports[0].device}")
          return ports[0].device

      elif system == "Linux":
          for port in ports:
              if "/dev/ttyACM" in port.device or "/dev/ttyUSB" in port.device:
                  self.logger.info(f"Selected port based on device name: {port.device}")
                  return port.device
          self.logger.info(f"No ttyACM or ttyUSB port found, using first port: {ports[0].device}")
          return ports[0].device

      else:
          self.logger.error(f"Unsupported OS: {system}")
          return None


    def move_one_step(self):
        if not self.is_connected():
            self.logger.warning("Serial connection not open, reconnecting...")
            self.reconnect()
            if not self.is_connected():
                self.logger.error("Failed to reconnect serial connection")
                return
        try:
            self.logger.info("Sending move command to Arduino")
            self.serial_conn.write(b'F')
            response = self.serial_conn.readline().decode().strip()
            self.logger.info(f"Arduino response: {response}")
        except Exception as e:
            self.logger.error(f"Communication error: {e}")
        
