# services/motor_service.py

from hardware.stepper_motor import StepperMotorDriver
from utils.logger import logger

motor = StepperMotorDriver()

def move_nema_motor():
    logger.info("Received move request from AI backend")
    try:

        motor.move_one_step()
        logger.info("Motor moved successfully")
        return "motor moved"
    except Exception as e:
        logger.error(f"Motor move failed: {e}")
        return "motor move failed"