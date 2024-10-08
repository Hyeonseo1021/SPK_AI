import os  # 추가: 운영 체제 경로 조작을 위한 모듈
import openai   # importing openAI Library
import speech_recognition as sr  # Importing Speech Recognition Library
from gtts import gTTS  # importing Google Text To Speech Library
import pygame  # importing pygame

# A function to speak a message using the gTTS engine
def speak(message):
    tts = gTTS(text=message, lang='en-gb', slow=False)  # text will load the message when the speak(message) function is used in English UK language and in normal speed

    # 현재 작업 디렉토리에 "file.mp3" 파일을 저장하도록 경로 수정
    save_path = os.path.join(os.getcwd(), "file.mp3")  # 현재 디렉토리에서 file.mp3 저장
    tts.save(save_path)  # saves that audio as file.mp3

    pygame.init()  # pygame used to load and play the sound
    pygame.mixer.init()
    pygame.mixer.music.load(save_path)  # 동적으로 생성된 파일 경로 사용
    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(2)

    pygame.mixer.quit()
    pygame.quit()

# Set the private API key for OpenAI
openai.api_key = 'sk-TMBe5kMgU1nzLUINsSAeJWWB_ys2UkFA9QEWwI3YT_T3BlbkFJxo3v7lRom8l616DgdWysxcuR_Lgmgjr-zFfAyTJY8A'

# Starting Message
speak("Hello Shaan! I am now activated. Talk to me or ask me questions. I am happy to assist")


# Creating a function for generating a response from the OpenAI API
def generate_response(prompt):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # 새로운 API는 모델명을 지정해야 합니다.
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=100,  # number of tokens in responses
        n=1,  # number of answers to be generated
        stop=None,  # specifies a sequence of tokens at which to stop generation of the response
        temperature=0.9,  # controls the randomness and creativity of the generated response
    )

    return response.choices[0].message['content']  # OpenAI API 1.0.0에서는 이렇게 수정해야 합니다.


def recognize_speech():
    r = sr.Recognizer()  
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=1)  # 배경 소음 조정
        speak("Speak Now!")
        try:
            audio = r.listen(source, timeout=5, phrase_time_limit=10)  # 타임아웃과 말하는 시간 제한
            return r.recognize_google(audio)  # 음성 인식
        except sr.UnknownValueError:
            print("Could not understand audio")
            speak("I couldn't understand what you said. Please try again.")
            return None
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
            return None
        except sr.WaitTimeoutError:
            print("Listening timed out while waiting for speech.")
            speak("I didn't hear anything. Please try again.")
            return None


# Using a loop such that a user can infinitely talk with the bot
while True:
    user_input = recognize_speech()  # uses recognise speech function which turns on the mic and starts listening
    if user_input == "exit":
        break
    response = generate_response(user_input)  # the user response is stored in the variable user_input and we use generate_response function to communicate bot response via the api
    print(f"Bot: {response}")  # printing the response
    speak(response)  # saying the response 
