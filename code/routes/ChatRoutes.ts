import express from "express"; // 서버를 구축하고 HTTP 요청을 처리하는데 사용
import { verifyToken } from "../utils/Token.js"; // 사용자의 인증 토큰을 검증하는 역할
import { fineTuneValidator, chatCompletionValidator, validate } from "../utils/Validators.js"; // 요청 데이터의 유효성을 검사하는 검증기
import { deleteConversation, // 특정대화 삭제
		 getConversation,  // 특정 대화 조회
		 deleteAllConversations, // 모든 대화 삭제
		 generateChatCompletion,  // 채팅 응답을 생성하는 기능
		 getAllConversations,  // 모든 대화를 조회하는 기능
		 startNewConversation, // 새로운 대화를 시작하는 기능 
		 createCustomModel, // 사용자의 정의 모델을 생성하는 기능
		 deleteCustomModel, // 사용자의 정의 모델을 삭제하는 기능
		 getCustomModels, // 사용자의 정의 모델 목록을 조회하는 기능
		 getModelbyId, // 특정 모델을 ID로 조회
		 startNewConversationwith, //특정 사용자와의 대화를 시작하는 기능
		 } from "../controllers/ChatController.js";
 
const chatRoutes = express.Router(); // 라우터를 생성하는 코드 API 엔드 포인트를 정의하고, 특정 경로에 대한 요청을 처리

// test
chatRoutes.get("/", (req, res, next) => {
	console.log("hi");
	res.send("hello from chatRoutes");
});

// protected API
//new conversation
chatRoutes.get(
	"/c/new",
	verifyToken,
	startNewConversation,
);

//new conversation with msg
chatRoutes.post(
	"/c/new",
	validate(chatCompletionValidator),
	verifyToken,
	startNewConversationwith,
);

//resume conversation
chatRoutes.post(
	"/c/:conversationId",
	validate(chatCompletionValidator),
	verifyToken,
	generateChatCompletion,
);

//get all conversations
chatRoutes.get(
	"/all-c",
	verifyToken,
	getAllConversations,
);

//get a conversation
chatRoutes.get(
	"/c/:conversationId",
	verifyToken,
	getConversation,
);

//delete a conversation
chatRoutes.delete(
    "/c/:conversationId",
    verifyToken,
    deleteConversation,
)

//delete all conversations
chatRoutes.delete(
    "/all-c",
    verifyToken,
    deleteAllConversations,
)

//create custom model
chatRoutes.post(
    "/g/create",
	validate(fineTuneValidator),
    verifyToken,
    createCustomModel,
);

//delete custom model
chatRoutes.delete(
    "/g/:modelId",
    verifyToken,
    deleteCustomModel,
);

//get all custom models
chatRoutes.get(
    "/all-g",
    verifyToken,
	getCustomModels,
);

//get a custom model
chatRoutes.get(
    "/g/:modelId/",
    verifyToken,
	getModelbyId,
);


export default chatRoutes; // 다른 파일에서 이 라우터를 쉽게 임포트하여 사용