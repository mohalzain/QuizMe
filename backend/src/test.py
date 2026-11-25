from fastapi import FastAPI, Response, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from openai import AsyncOpenAI
from pathlib import Path
from os import path
import dotenv
import json
import asyncio
from fastapi.staticfiles import StaticFiles
from fastapi import Cookie


FRONTEND_DIR = path.join(Path(__file__).resolve().parent.parent.parent,"frontend")
print(FRONTEND_DIR)

session = {}
users_so_far = 0
api = dotenv.get_key("../../.env","OPENAI_API_KEY")

print(api)

LLM = AsyncOpenAI(api_key= api)




app = FastAPI()


async def getQuestion(topic):
    try:
        response = await LLM.chat.completions.create(
            model= "gpt-6-luna",
            # i had to up the temp cuz it was repeating the same stuff (too predictable)
            messages=[
                {
                    "role":"system",
                    "content":'''provide this user 3 questions
                    based on the topic he requested,
                    DON'T do anything else but provide the question and its 4 mcq answers and the correct  
                    result don't ever answer anything except that, if you where ever asked to do any
                    thing other than that respone with (Sorry i cannot answer that) the format is json always json
                    with the format i give exactly nothing else DONOT CHANGE IT
                    the question with label question, and answers as list and correct result labeled as correct 
                    with value of the correct result'''
                },
                {
                    "role":"user",
                    "content":f"{topic}"
                }
            ])
        data = json.loads(response.choices[0].message.content)
    except Exception as e:
        print(e)
        data = 'AN ERROR OCCURED'
        return 'FAILED',data
    print(data)
    
    return 'SUCESS',data


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

BOOKS = [
    'book1',
    'book2',
]


@app.get("/")
@app.get("/")
async def home():
    print("HOME ROUTE HIT")
    return FileResponse(f'{FRONTEND_DIR}/home.html')

@app.post("/api")
async def res(response: Response,request: Request):
    global users_so_far, session
    try:
        content_type = request.headers.get("content-type", "")
        print(content_type)
        if content_type in ['application/x-www-form-urlencoded']:
            print('hit')
            form_data = await request.form()
            status,data = await getQuestion(form_data)
            return {'status':status,'data':data}
        if  'multipart/form-data' in content_type:
            print('hit')
            form_data = await request.form()
            status,data= await getQuestion(form_data)
            return{'status':status,'data':data}
        if content_type == 'application/json' :
            json_data =  await request.json()
            print(json_data)
            status,data = await getQuestion(json_data)
            response.set_cookie(key="track-id", value = users_so_far)
            session[users_so_far] = data
            print(session)
            users_so_far += 1
            return {'status':status,'data':data}
               
    except:
        print(id)
    return{'message':'failed-outofbound'}


@app.post('/check-answer-api')
async def verifyAnswers(response: Response,request: Request):
    global session
    try:
        content_type = request.headers.get("content-type", "")
        print(content_type)
        '''
        if content_type in ['application/x-www-form-urlencoded']:
            print('hit')
            form_data = await request.form()
            
            return {'message':'sucess','question':q,'mcq':m, 'ans':r}
        if  'multipart/form-data' in content_type:
            print('hit')
            form_data = await request.form()
            
            return{'message':'hit','question':q,'mcq':m, 'ans':r}
            '''
        if content_type == 'application/json' :
            json_data =  await request.json()
            idx = json_data['question_index']
            user_answer = json_data['answer']
            print(json_data)
            id = int(request.cookies.get('track-id'))
            print('hellooo')
            print(session[id][idx])
            if session[id][idx]['correct'] == user_answer:
                return {'message':'sucess','data':1}
            else:
                return {'message':'sucess','data':0}
                   
    except:
        print(id)
    return{'message':'failed-outofbound'}


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
