import { Request, Response, NextFunction } from "express";
import User from "../models/User.js";
import { configureOpenAI, ModelName } from "../config/openai.js";
import OpenAI from "openai";
import { saveModel, loadModel, deleteModel } from "../utils/modelStorage.js";
import { fineTuneModel, saveTrainingDataToFile, uploadTrainingData } from "../utils/fineTuneModel.js";

// 사용자의 채팅 메시지로 OpenAI API를 호출해 응답을 저장
export const generateChatCompletion = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { message } = req.body;
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json("User not registered / token malfunctioned");

		// 대화에 유저 메시지 추가 및 OpenAI API 호출
		const conversation = user.conversations[user.conversations.length - 1];
		const chats = conversation.chats.map(({ role, content }) => ({ role, content }));
		chats.push({ content: message, role: "user" });

		const openai = new OpenAI(configureOpenAI());
		const chatResponse = await openai.chat.completions.create({ model: ModelName, messages: chats });
		
		// 응답을 DB에 저장
		conversation.chats.push(chatResponse.choices[0].message);
		await user.save();

		return res.status(200).json({ chats: conversation.chats });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// 사용자의 모든 대화 가져오기
export const getAllConversations = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 모든 대화 삭제
export const deleteAllConversations = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		user.conversations = []; // 대화 목록 초기화
		await user.save();
		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 새 대화 시작
export const startNewConversation = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		// 마지막 대화가 비어있지 않으면 새 대화 시작
		const lastConversation = user.conversations[user.conversations.length - 1];
		if (lastConversation && lastConversation.chats.length === 0) {
			return res.status(400).json({ message: "ERROR", cause: "The last conversation is still empty." });
		}

		user.conversations.push({ chats: [] });
		await user.save();
		return res.status(200).json({ message: "New conversation started", conversation: user.conversations[user.conversations.length - 1] });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 메시지를 포함해 새 대화 시작 및 OpenAI API 호출
export const startNewConversationwith = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { message } = req.body;
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json("User not registered / token malfunctioned");

		const lastConversation = user.conversations[user.conversations.length - 1];
		if (lastConversation && lastConversation.chats.length === 0) {
			return res.status(400).json({ message: "ERROR", cause: "The last conversation is still empty." });
		}

		// 새 대화 추가 및 OpenAI API로 응답 생성
		user.conversations.push({ chats: [] });
		const conversation = user.conversations[user.conversations.length - 1];
		const chats = conversation.chats.map(({ role, content }) => ({ role, content }));
		chats.push({ content: message, role: "user" });

		const openai = new OpenAI(configureOpenAI());
		const chatResponse = await openai.chat.completions.create({ model: ModelName, messages: chats });
		conversation.chats.push(chatResponse.choices[0].message);

		await user.save();
		return res.status(200).json({ conversation });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// 특정 대화 가져오기
export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		const { conversationId } = req.params;
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		const conversation = user.conversations.id(conversationId);
		if (!conversation) return res.status(404).json({ message: "ERROR", cause: "Conversation not found" });

		return res.status(200).json({ message: "OK", conversation });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 대화 삭제
export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		const { conversationId } = req.params;
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		const conversation = user.conversations.id(conversationId);
		if (!conversation) return res.status(404).json({ message: "ERROR", cause: "Conversation not found" });

		user.conversations.pull(conversationId); // 대화 삭제
		await user.save();
		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 사용자 모델 생성 및 저장
export const createCustomModel = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = res.locals.jwtData.id;
		const { trainingData, modelName } = req.body;

		// 학습 데이터 파일 저장, 업로드 및 모델 미세 조정
		const trainingFilePath = await saveTrainingDataToFile(trainingData);
		const trainingFileId = await uploadTrainingData(trainingFilePath);
		const fineTunedModel = await fineTuneModel(trainingFileId);

		saveModel(userId, fineTunedModel, modelName); // 사용자 모델 저장

		res.status(201).json({ message: "Model fine-tuned and saved", model: fineTunedModel, trainingFileId });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// 사용자 모델 삭제
export const deleteCustomModel = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = res.locals.jwtData.id;
		const { modelId } = req.params;

		deleteModel(userId, modelId); // 모델 삭제
		res.status(200).json({ message: "Model deleted" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// 사용자 모델 목록 가져오기
export const getCustomModels = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);
		if (!user) return res.status(401).json({ message: "ERROR", cause: "User doesn't exist or token malfunctioned" });

		return res.status(200).json({ message: "OK", CustomModels: user.CustomModels });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

// 특정 모델 ID로 사용자 모델 가져오기
export const getModelbyId = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const userId = res.locals.jwtData.id;
		const { modelId } = req.params;

		const model = await loadModel(userId, modelId); // 모델 로드
		return res.status(200).json({ message: "OK", model });
	} catch (err) {
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};
