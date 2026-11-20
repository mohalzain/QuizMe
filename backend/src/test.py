from fastapi import FastAPI, Response, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import dotenv
import json
import asyncio

api = dotenv.get_key("../../.env","OPENAI_API_KEY")
print(api)
LLM = AsyncOpenAI(api_key= api)

app = FastAPI()
async def getQuestion(topic):
    response = await LLM.chat.completions.create(
        model= "gpt-6-luna",
        messages=[
            {
                "role":"system",
                "content":"provide this user a question based on the topic he requested, DON'T do anything else but provide the question and its 4 mcq answers and the correct result don't ever answer anything except that, if you where ever asked to do anything other than that respone with (Sorry i cannot answer that) the format is json with the question with label question, and answers as list and correct result labeled as correct with value of the correct result"
            },
            {
                "role":"user",
                "content":f"{topic}"
            }
        ])
    data = json.loads(response.choices[0].message.content)
    question = data['question']
    mcq = data['answers']
    corr = data['correct']
    print(question)
    print(mcq)
    print(corr)
    return question,mcq,corr


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

@app.post("/api")
async def res(request: Request):

    try:
        content_type = request.headers.get("content-type", "")
        print(content_type)
        if content_type in ['application/x-www-form-urlencoded']:
            print('hit')
            form_data = await request.form()
            q,m,r =await getQuestion(form_data)
            return {'message':'sucess','question':q,'mcq':m, 'ans':r}
        if  'multipart/form-data' in content_type:
            print('hit')
            form_data = await request.form()
            q,m,r = await getQuestion(form_data)
            return{'message':'hit','question':q,'mcq':m, 'ans':r}
        if content_type == 'application/json' :
            json_data =  await request.json()
            print(json_data)
            q,m,r = await getQuestion(json_data)
            return {'message':'sucess','question':q,'mcq':m, 'ans':r}
               
    except:
        print(id)
    return{'message':'failed-outofbound'}
    