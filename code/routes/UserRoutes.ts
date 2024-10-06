import express from "express"; // 서버를 구축하기 위한 웹 프레임 워크

import {
	getAllUsers,
	userSignUp,
	userLogin,
	verifyUserStatus,
    logoutUser,
	getChatboxes,
	saveChatbox,
	resetChatbox,
	checkPassword,
	changeName,
	changePassword,
	deleteUser, 
} from "../controllers/UserController.js"; // 사용자 관련 기능을 처리하는 컨트롤러에서 여러 함수를 임포트

import { // validators 요청 데이터를 검증하기 위한 유효성을 검증 함수들 임포트
	loginValidator, 
	signUpValidator,
	validate,
	chatboxValidator,
} from "../utils/Validators.js";

import { verifyToken } from "../utils/Token.js"; // 사용자 인증을 위한 토큰	검증 함수를 임포트 합니다.

const userRoutes = express.Router(); // 새로운 라우터 인스턴스를 생성 , 인스턴스를 통해서 여러 개의 API 엔드포인트를 정의

userRoutes.get("/", getAllUsers); // //루트 경로에 대한 GET 요청을 처리하여 모든 사용자 정보를 반환

userRoutes.post("/signup", validate(signUpValidator), userSignUp); //경로에 대한 post 요청을 처리

userRoutes.post("/login", validate(loginValidator), userLogin); // 로그인 데이터의 유효성을 검사한 후, userLogin함수가 호출

userRoutes.get("/auth-status", verifyToken, verifyUserStatus); // check if user cookies are valid so he doesnt have to login again

userRoutes.get("/logout", verifyToken, logoutUser); // 경로에 대한 GET 요청을 처리 verifyToken 미들웨어를 통해 사용자의 토큰을 검증

userRoutes.post("/mypage", verifyToken, checkPassword); // 비밀번호를 확인하기 위해 토큰 검증 후 checkPassword 함수가 호출

userRoutes.put("/update-name", verifyToken, changeName); // PUT 요청을 처리하여 사용자의 이름을 변경, 토큰 검증 후 changeName 함수가 호출

userRoutes.put("/update-password", verifyToken, changePassword); // PUT요청을 처리하여 사용자의 비밀번호를 변경, 함수 호출

userRoutes.delete("/delete", verifyToken, deleteUser); // DELETE 요청을 처리하여 사용자를 삭제, deleteUser 함수가 호출

userRoutes.get("/cbox", verifyToken, getChatboxes); // GET 요청을 처리하여 사용자의 채팅박스를 가져옴

userRoutes.put("/cbox", validate(chatboxValidator), verifyToken, saveChatbox); // PUT과 POST요청을 처리하여 채팅박스를 저장, 요청 데이터의 유효성을 검증

userRoutes.post("/cbox", validate(chatboxValidator), verifyToken, saveChatbox);

userRoutes.put("/cbox/reset", verifyToken, resetChatbox); //PUT 요청을 처리하여 채팅박스를 리셋	

export default userRoutes; // 라우터를 다른 파일에서 사용할 수 있도록 내보냄