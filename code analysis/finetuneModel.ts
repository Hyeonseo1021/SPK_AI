import { configureOpenAI, ModelName } from "../config/openai.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fineTuneModel = async (trainingFileId: string) => {
    const openai = new OpenAI(configureOpenAI());//openai api 인스턴스 생성
    try{
    const response = await openai.fineTuning.jobs.create({
        training_file: trainingFileId,
        model: ModelName,
    });// fine-tuning작업 생성
    return response;
    } catch (error) {
        throw new Error(`Failed to fine-tune model: ${error.message}`);
      }
};

export const saveTrainingDataToFile = async (trainingData: string) => {
    const filePath = path.join(__dirname, 'training-file.jsonl');
    const jsonlData = trainingData.split('\n').map(item => JSON.stringify(JSON.parse(item))).join('\n');
    fs.writeFileSync(filePath, jsonlData);
    return filePath;
};  //훈련데이터를 json lines형식으로 파일에 저장, 경로 반환

export const uploadTrainingData = async (filePath: string) => {
    const openai = new OpenAI(configureOpenAI());
    try {
        const response = await openai.files.create({
            purpose: 'fine-tune', //훈련데이터로 사용
            file: fs.createReadStream(filePath),
        });
        return response.id; //파일 업로드 성공하면 파일의 ID반환
    } catch (error) {
        console.error("Error uploading training data:", error);
        throw new Error(`Failed to upload training data: ${error.message}`);
    }
};