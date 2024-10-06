import { configureOpenAI, ModelName } from "../config/openai.js"; // Open AI를 API를 설정하는 함수와 사용할 모델의 이름을 임포트
import OpenAI from "openai"; // Open AI API와 상호작용하기 위한 라이브러리
import fs from "fs"; // 파일 시스템 모듈로, 파일을 읽고 쓰는 기능을 제공
import path from "path"; // 파일 경로를 다루는 모듈
import { fileURLToPath } from 'url'; //ES 모듈에서 파일 경로를 처리하기 위한 유틸리티
const __filename = fileURLToPath(import.meta.url); // 현재 모듈의 파일 경로
const __dirname = path.dirname(__filename); // 현재 모듈의 디렉토리 경로를 얻음, 파일을 저장할 위치를 정의하는데 사용

export const fineTuneModel = async (trainingFileId: string) => { // 주어진 훈련 파일 ID를 사용하여 모델을 파인튜닝하는 비동기 함수
    const openai = new OpenAI(configureOpenAI());
    try{
    const response = await openai.fineTuning.jobs.create({
        training_file: trainingFileId, // Open API를 호출하여 모델 파인튜닝 작업을 생성
        model: ModelName,
    });
    return response; //성공적으로 작업이 생성되면 응답을 반환
    } catch (error) { //오류가 발생하면, 사용자에게 이해하기 쉬운 메시지와 함께 오류를 던짐
        throw new Error(`Failed to fine-tune model: ${error.message}`);
      }
};

export const saveTrainingDataToFile = async (trainingData: string) => { // 주어진 훈련 데이터를 JSONL 형식의 파일로 저장
    const filePath = path.join(__dirname, 'training-file.jsonl'); 
    const jsonlData = trainingData.split('\n').map(item => JSON.stringify(JSON.parse(item))).join('\n'); // 훈련 데이터 문자열, 각줄이 JSON 형식
    fs.writeFileSync(filePath, jsonlData); // 파일을 동기적으로 저장
    return filePath; //저장한 파일 경로를 반환
};

export const uploadTrainingData = async (filePath: string) => { // 훈련 데이터 파일을 Open AI API에 업로드하는 비동기 함수
    const openai = new OpenAI(configureOpenAI());
    try {
        const response = await openai.files.create({ // Open AI API를 호출하여 파일을 업로드 
            purpose: 'fine-tune', // purpose는 fine-tune으로 설정하여 파인튜닝 목적으로 파일을 업로드
            file: fs.createReadStream(filePath),    
        });
        return response.id; //성공적으로 파일 업로드 시 파일 ID 반환
    } catch (error) { // 오류가 발생시 오류메시지를 출력하고 이해하기 쉬운 메시지와 함께 오류 던짐
        console.error("Error uploading training data:", error);
        throw new Error(`Failed to upload training data: ${error.message}`);
    }
};