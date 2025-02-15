from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "IoT Backend is running"}