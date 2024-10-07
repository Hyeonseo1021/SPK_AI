import User from "../models/User.js";
import { configureOpenAI, ModelName } from "../config/openai.js";
import OpenAI from "openai";
import { saveModel, loadModel, deleteModel } from "../utils/modelStorage.js";
import { fineTuneModel, saveTrainingDataToFile, uploadTrainingData } from "../utils/fineTuneModel.js";
export const generateChatCompletion = async (req, res, next) => {
    try {
        const { message } = req.body;   // 사용자가 요청한 메시지 추출
        const user = await User.findById(res.locals.jwtData.id); //jwt 토큰으로부터 추출한 사용자 ID로 db에서 사용자 조회
        if (!user) {
            return res.status(401).json("User not registered / token malfunctioned");
        }   // 사용자가 없으면 상태코드와 메시지 반환
        
        const conversation = user.conversations[user.conversations.length - 1]; 
        // 사용자와의 가장 마지막 대화 가져옴
        const chats = conversation.chats.map(({ role, content }) => ({
            role,
            content,
        }));    // 역할과 내용 기반으로 openai api에 맞게 메시지 변환
        chats.push({ content: message, role: "user" }); // chats 배열에 푸시
        conversation.chats.push({ content: message, role: "user" }); // 대화에 푸시
        
        const config = configureOpenAI();   // 설정 반환
        const openai = new OpenAI(config);  // openai api 초기화
       
        const chatResponse = await openai.chat.completions.create({
            model: ModelName,
            messages: chats,
        }); // 응답 생성
        
        conversation.chats.push(chatResponse.choices[0].message); 
        await user.save();  // 응답 저장
        return res.status(200).json({ chats: conversation.chats });
    }   // 업데이트된 대화 내역 json 형식으로 반환
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }   // 에러 발생 시 에러 메시지 반환
};
export const getAllConversations = async (req, res, next) => {  // 모든 대화를 가져오는 함수
    try {
        const user = await User.findById(res.locals.jwtData.id); // jwt 토큰 사용자 id로 사용자 조회
        if (!user)
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            }); // // 유저 없으면 상태 코드와 존재하지 않음 메시지 반환 
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res
                .status(401)
                .json({ message: "ERROR", cause: "Permissions didn't match" });
        } // userid가 jwt토큰의 아이디와 다르면 권한 맞지 않음 반환.
        return res.status(200).json({ message: "OK", conversations: user.conversations });
    }    // 유저 존재할 시 모든 대화 반환
    catch (err) {
        console.log(err);
        return res.status(200).json({ message: "ERROR", cause: err.message });
    } // 오류 발생시 오류 상태 코드와 메시지 반환
};

export const deleteAllConversations = async (req, res, next) => {   // 모든 대화 삭제하는 함수
    try {
        const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware
        if (!user)
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            });
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res
                .status(401)
                .json({ message: "ERROR", cause: "Permissions didn't match" });
        }   // jwt토큰에서 아이디로 유저 찾기 위 함수와 같음
        //@ts-ignore
        user.conversations = []; // 대화 비우기
        await user.save();  // 비운 배열 저장
        return res.status(200).json({ message: "OK", conversations: user.conversations });
    }   // 상태 코드와 대화 반환
    catch (err) {
        console.log(err);
        return res.status(200).json({ message: "ERROR", cause: err.message });
    }   // 에러 발생 상태 코드와 메시지 반환
};

export const startNewConversation = async (req, res, next) => { // 새로운 대화를 생성하는 함수
    try {
        const user = await User.findById(res.locals.jwtData.id); // jwt 토큰의 id로 사용자 찾기
        if (!user)
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            }); // 존재하지 않으면 상태 코드와 에러 메시지 반환
        // Validate if the last conversation is empty
        const lastConversation = user.conversations[user.conversations.length - 1]; // 마지막 대화 가져오기
        if (lastConversation && lastConversation.chats.length === 0) {
            return res.status(400).json({
                message: "ERROR",
                cause: "The last conversation is still empty. Please add messages before creating a new conversation.",
            });
        } // 마지막 대화 비어있는지 확인 
        user.conversations.push({ chats: [] }); // 빈 chats 배열을 추가
        await user.save(); // 저장
        return res.status(200).json({ message: "New conversation started",
            conversation: user.conversations[user.conversations.length - 1] });
    }   // 상태 코드와 새로운 대화가 시작다는 메시지 반환, 방금 생성된 대화 응답
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "ERROR", cause: err.message });
    }   // 에러 발생 시 에러 상태 코드와 메시지 반환
};

export const startNewConversationwith = async (req, res, next) => {
    try { // 새로운 대화 생성과 동시에 메시지 입력하여 즉시 응답을 받는 함수
        const { message } = req.body; // 메시지 가져오기
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).json("User not registered / token malfunctioned");
        } // jwt토큰 id로 사용자 찾기, 없으면 상태 코드와 메시지 반환
        // Validate if the last conversation is empty
        const lastConversation = user.conversations[user.conversations.length - 1];
        if (lastConversation && lastConversation.chats.length === 0) {
            return res.status(400).json({
                message: "ERROR",
                cause: "The last conversation is still empty. Please add messages before creating a new conversation.",
            });
        }   // 마지막 대화 불러오기 없으면 상태 코드와 메시지 반환
        user.conversations.push({ chats: [] }); // 빈 chats 배열 conversations에 추가
        // Add the user's message to the conversation
        const conversation = user.conversations[user.conversations.length - 1];
        // 방금 생성된 대화 가져오기
        // Prepare messages for OpenAI API
        const chats = conversation.chats.map(({ role, content }) => ({
            role,
            content,
        })); // 사용자가 추가한 메시지 chats에 추가
        chats.push({ content: message, role: "user" });
        conversation.chats.push({ content: message, role: "user" });
        // send all chats with new ones to OpenAI API
        const config = configureOpenAI();
        const openai = new OpenAI(config);
        // make request to openAi
        // get latest response
        const chatResponse = await openai.chat.completions.create({
            model: ModelName,
            messages: chats,
        }); // AI로부터 받은 응답 추가
        // push latest response to db
        conversation.chats.push(chatResponse.choices[0].message);
        await user.save(); // 저장
        return res.status(200).json({ conversation: conversation });
    } // 대화 json 형식으로 반환
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
export const getConversation = async (req, res, next) => {
    try { // 특정 대화 가져오는 함수
        const user = await User.findById(res.locals.jwtData.id);
        const { conversationId } = req.params;
        if (!user) {
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            });
        }
        const conversation = user.conversations.id(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: "ERROR",
                cause: "Conversation not found",
            });
        }
        return res.status(200).json({ message: "OK", conversation });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "ERROR", cause: err.message });
    }
};
export const deleteConversation = async (req, res, next) => {
    try {   // 특정 대화 삭제하는 함수
        const user = await User.findById(res.locals.jwtData.id);
        const { conversationId } = req.params;
        if (!user) {
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            });
        }
        const conversation = user.conversations.id(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: "ERROR",
                cause: "Conversation not found",
            });
        }
        // Remove the conversation
        user.conversations.pull(conversationId); // 제거
        await user.save();
        return res.status(200).json({ message: "OK", conversations: user.conversations });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "ERROR", cause: err.message });
    }
};

export const createCustomModel = async (req, res, next) => {
    try { // 커스텀 모델 생성 함수
        const userId = res.locals.jwtData.id; // 사용자 id 추출
        const { trainingData, modelName } = req.body; // 사용자가 전송한 데이터와 모델 이름 추출
        const trainingFilePath = await saveTrainingDataToFile(trainingData); // 학습 데이터 저장
        const trainingFileId = await uploadTrainingData(trainingFilePath); // 학습 파일 업로드
        const fineTunedModel = await fineTuneModel(trainingFileId); // 학습데이터로 모델 파인 튜닝
        saveModel(userId, fineTunedModel, modelName); // 모델 저장
        res.status(201).json({ message: "Model fine-tuned and saved", model: fineTunedModel, trainingFileId });
    }   // 생성된 모델과 학습 파일 ID를 클라이언트로 반환
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteCustomModel = async (req, res, next) => {
    try {   // 커스텀 모델 삭제 함수
        const userId = res.locals.jwtData.id;
        const { modelId } = req.params;
        deleteModel(userId, modelId);
        res.status(200).json({ message: "Model deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getCustomModels = async (req, res, next) => {
    try {   // 커스텀 모델 가져오는 함수
        const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware
        if (!user)
            return res.status(401).json({
                message: "ERROR",
                cause: "User doesn't exist or token malfunctioned",
            });
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res
                .status(401)
                .json({ message: "ERROR", cause: "Permissions didn't match" });
        }
        return res.status(200).json({ message: "OK", CustomModels: user.CustomModels });
    }
    catch (err) {
        console.log(err);
        return res.status(200).json({ message: "ERROR", cause: err.message });
    }
};

export const getModelbyId = async (req, res, next) => {
    try { // 모델 아이디 가져오기
        const userId = res.locals.jwtData.id;
        const { modelId } = req.params;
        const model = await loadModel(userId, modelId);
        return res.status(200).json({ message: "OK", model });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "ERROR", cause: err.message });
    }
};
//# sourceMappingURL=ChatController.js.map