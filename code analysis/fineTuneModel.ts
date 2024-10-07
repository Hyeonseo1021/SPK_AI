import { configureOpenAI, ModelName } from "../config/openai.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// 파일 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 모델 미세 조정(fine-tuning) 함수
export const fineTuneModel = async (trainingFileId: string) => {
    const openai = new OpenAI(configureOpenAI());
    try {
        const response = await openai.fineTuning.jobs.create({
            training_file: trainingFileId, // 학습 파일 ID
            model: ModelName, // 모델 이름
        });
        return response;
    } catch (error) {
        throw new Error(`Failed to fine-tune model: ${error.message}`);
    }
};

// 학습 데이터를 JSONL 파일로 저장
export const saveTrainingDataToFile = async (trainingData: string) => {
    const filePath = path.join(__dirname, 'training-file.jsonl');
    const jsonlData = trainingData.split('\n').map(item => JSON.stringify(JSON.parse(item))).join('\n');
    fs.writeFileSync(filePath, jsonlData);
    return filePath; // 저장된 파일 경로 반환
};

// 학습 파일을 OpenAI에 업로드
export const uploadTrainingData = async (filePath: string) => {
    const openai = new OpenAI(configureOpenAI());
    try {
        const response = await openai.files.create({
            purpose: 'fine-tune', // 업로드 목적 설정
            file: fs.createReadStream(filePath), // 파일 스트림
        });
        return response.id; // 업로드된 파일 ID 반환
    } catch (error) {
        throw new Error(`Failed to upload training data: ${error.message}`);
    }
};
