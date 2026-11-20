from fastapi import FastAPI, Response
from fastapi.responses import HTMLResponse

app = FastAPI()

BOOKS = [
    'book1',
    'book2',
]

@app.get("/apis/{id}")
async def res(id):
    try:
        id = int(id)
        if id <= len(BOOKS):
            return {'message':'sucess','data':BOOKS[id]}
    except:
        print(id)
    return{'message':'failed-outofbound'}
    