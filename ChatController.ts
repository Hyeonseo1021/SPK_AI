//generateChatCompletion 수정, readline 추가하여 질문 입력 (추후 whisper통한 음성 파일 받을 수 있도록 수정)
import readline from 'readline';
import User from "../models/User.js";
import { configureOpenAI, ModelName } from "../config/openai.js";
import OpenAI from "openai";
import { saveModel, loadModel, deleteModel } from "../utils/modelStorage.js";
import { fineTuneModel, saveTrainingDataToFile, uploadTrainingData } from "../utils/fineTuneModel.js";
import { Request, Response, NextFunction } from "express";

// readline 인터페이스 생성
const rl = readline.createInterface({
    input: process.stdin,  // 사용자 입력 받기
    output: process.stdout  // 출력 설정
});

export const generateChatCompletion = async () => {
    try {
        // 사용자 ID를 실제로 인증된 사용자로 변경해야 함
        const userId = "some_user_id";  // 실제로는 JWT 토큰 등에서 사용자 ID를 추출해야 합니다.
        const user = await User.findById(userId);

        if (!user) {
            console.log("User not registered / token malfunctioned");
            return;
        }

        // 대화 기록 가져오기
        const conversation = user.conversations[user.conversations.length - 1];
        const chats = conversation.chats.map(({ role, content }) => ({
            role,
            content,
        }));

        // 사용자 입력 받기
        rl.question('You: ', async (message) => {
            if (!message) {
                console.log('Message is required!');
                rl.close();
                return;
            }

            // 사용자 메시지 추가
            chats.push({ content: message, role: "user" });
            conversation.chats.push({ content: message, role: "user" });

            // OpenAI API 설정
            const config = configureOpenAI();
            const openai = new OpenAI(config);

            // OpenAI API 호출하여 응답 받기
            const chatResponse = await openai.chat.completions.create({
                model: ModelName,
                messages: chats as OpenAI.Chat.ChatCompletionMessageParam[], // OpenAI API에서 메시지 포맷에 맞춰서 전달
            });

            // AI의 응답 메시지
            const aiMessage = chatResponse.choices[0].message;

            // 대화 기록에 AI 응답 추가
            conversation.chats.push(aiMessage);
            await user.save();

            // AI 응답 출력
            console.log(`AI: ${aiMessage.content}`);

            // 다시 질문 받기
            generateChatCompletion(); // 재귀적으로 함수 호출하여 계속해서 대화 받기
        });
    } catch (error) {
        console.error(error);
        rl.close();
    }
};

// 실행
generateChatCompletion(); 

export const getAllConversations = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
		}
		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		console.log(err);
		return res.status(200).json({ message: "ERROR", cause: err.message });
	}
};

export const deleteAllConversations = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
		}

        //@ts-ignore
        user.conversations = [];
        await user.save()
		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		console.log(err);
		return res.status(200).json({ message: "ERROR", cause: err.message });
	}
};

export const startNewConversation = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(res.locals.jwtData.id);

		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned",
			});
		
		// Validate if the last conversation is empty
		const lastConversation = user.conversations[user.conversations.length - 1];
		if (lastConversation && lastConversation.chats.length === 0) {
			return res.status(400).json({
				message: "ERROR",
				cause: "The last conversation is still empty. Please add messages before creating a new conversation.",
			});
		}

		user.conversations.push({ chats: [] });
		await user.save();

		return res.status(200).json({ message: "New conversation started", 
					conversation: user.conversations[user.conversations.length - 1]  });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

export const startNewConversationwith = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { message } = req.body;

		const user = await User.findById(res.locals.jwtData.id);
		if (!user) {
			return res.status(401).json("User not registered / token malfunctioned");
		}
		// Validate if the last conversation is empty
			const lastConversation = user.conversations[user.conversations.length - 1];
			if (lastConversation && lastConversation.chats.length === 0) {
				return res.status(400).json({
					message: "ERROR",
					cause: "The last conversation is still empty. Please add messages before creating a new conversation.",
				});
			}
		user.conversations.push({ chats: [] });
		// Add the user's message to the conversation
		const conversation = user.conversations[user.conversations.length - 1];

		// Prepare messages for OpenAI API
		const chats = conversation.chats.map(({ role, content }) => ({
			role,
			content,
		})) ;
		chats.push({ content: message, role: "user" });

		conversation.chats.push({ content: message, role: "user" });
		// send all chats with new ones to OpenAI API
		const config = configureOpenAI();
		const openai = new OpenAI(config);

		// make request to openAi
		// get latest response
		const chatResponse = await openai.chat.completions.create({
			model: ModelName,
			messages: chats as OpenAI.Chat.ChatCompletionMessageParam[],
		});

		// push latest response to db
		conversation.chats.push(chatResponse.choices[0].message);
		await user.save();

		return res.status(200).json({ conversation: conversation });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: error.message });
	}
};

export const getConversation = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
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
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

export const deleteConversation = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
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
		user.conversations.pull(conversationId);
		await user.save();

		return res.status(200).json({ message: "OK", conversations: user.conversations });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};

export const createCustomModel = async (
	req: Request,
	res: Response,
	next: NextFunction) => {
	try {
		const userId = res.locals.jwtData.id;
		const { trainingData, modelName } = req.body;
        const trainingFilePath = await saveTrainingDataToFile(trainingData);
        const trainingFileId = await uploadTrainingData(trainingFilePath);
	  	const fineTunedModel = await fineTuneModel(trainingFileId);
  
	  	saveModel(userId, fineTunedModel, modelName);
  
	  	res.status(201).json({ message: "Model fine-tuned and saved", model: fineTunedModel, trainingFileId });
	} catch (err) {
	  	res.status(500).json({ error: err.message });
	}
  };

export const deleteCustomModel = async (
	req: Request,
	res: Response,
	next: NextFunction) => {
	try {
		const userId = res.locals.jwtData.id;
	  	const { modelId } = req.params;
	  	deleteModel(userId, modelId);

	  	res.status(200).json({ message: "Model deleted" });
	} catch (err) {
	  	res.status(500).json({ error: err.message });
	}
  };

export const getCustomModels = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
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
		}
		return res.status(200).json({ message: "OK", CustomModels: user.CustomModels });
	} catch (err) {
		console.log(err);
		return res.status(200).json({ message: "ERROR", cause: err.message });
	}
};

export const getModelbyId = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const userId = res.locals.jwtData.id;
		const { modelId } = req.params;
		const model = await loadModel(userId, modelId);

		return res.status(200).json({ message: "OK", model });
	} catch (err) {
		console.log(err);
		return res.status(500).json({ message: "ERROR", cause: err.message });
	}
};
