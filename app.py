from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
import time
import requests

app = Flask(__name__)
CORS(app)

load_dotenv()

api = os.getenv('api')
genai.configure(api_key=api)



@app.route('/start', methods=['GET'])
def start():
    return jsonify({'response': 'Hello World!'})


@app.route('/chat', methods=['POST'])   
def chat():
    data = request.get_json()
    message = (data['message'] or "no message")
    previous= data['previous']
    print("message: ", message)
    print("previous: ", previous)
    
    history=[]
    for i in range(len(previous)):
        user=previous[i]['user']
        if(user=="Therapist"):
            user="model"
        else:
            user="user"
        history.append({"role": user, "parts": previous[i]['text']})

    print("history: ", history)
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = " I am calling this from backend. "
    print("yaha tak 1")
    chat= model.start_chat(history=history)
    print("yaha tak 2")
    

    
    
    print("yaha tak 3")

    
    
    msg=" I am calling this from backend just give answer as string. You are a therapist from India. Let's behave you are taking my session. My response is : "+ message + " Now give a proper response to this. Answer in english only"
    response = chat.send_message(msg)
    print("yaha tak 6")
    print("response ",response)
    print(response.text)

    
    

    return jsonify({'response': response.text})

@app.route('/hindichat', methods=['POST'])   
def hindichat():
    data = request.get_json()
    message = data['message']
    previous= data['previous']
    print("message: ", message)
    print("previous: ", previous)
    
    history=[]
    for i in range(len(previous)):
        user=previous[i]['user']
        if(user=="Ai-Lawyer"):
            user="model"
        else:
            user="user"
        history.append({"role": user, "parts": previous[i]['text']})

    print("history: ", history)
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = " I am calling this from backend. "
    print("yaha tak 1")
    chat= model.start_chat(history=history)
    print("yaha tak 2")
    

    
    
    print("yaha tak 3")

    
    
    msg=" I am calling this from backend just give answer as string. You are a therapist from India. Let's behave you are taking my session. My response is : "+ message + " Now give a proper response to this. Answer in hindi only"
    response = chat.send_message(msg)
    print("yaha tak 6")
    print("response ",response)
    print(response.text)

    
    

    return jsonify({'response': response.text})

@app.route('/hinglishchat', methods=['POST'])   
def hinglishchat():
    data = request.get_json()
    message = data['message']
    previous= data['previous']
    print("message: ", message)
    print("previous: ", previous)
    
    history=[]
    for i in range(len(previous)):
        user=previous[i]['user']
        if(user=="Therapist"):
            user="model"
        else:
            user="user"
        history.append({"role": user, "parts": previous[i]['text']})

    print("history: ", history)
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = " I am calling this from backend. "
    print("yaha tak 1")
    chat= model.start_chat(history=history)
    print("yaha tak 2")
    

    
    
    print("yaha tak 3")

    
    
    msg=" I am calling this from backend just give answer as string. You are a therapist from India. Let's behave you are taking my session. My response is : "+ message + " Now give a proper response to this. Answer in hinglish only hindi words with english script"
    response = chat.send_message(msg)
    print("yaha tak 6")
    print("response ",response)
    print(response.text)

    
    

    return jsonify({'response': response.text})




if __name__ == '__main__':
    app.run(debug=True)