# main.py


from fastapi import FastAPI
from controllers import manual_control_controller

app = FastAPI()

app.include_router(manual_control_controller.router)