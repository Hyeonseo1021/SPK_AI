import { Request, Response, NextFunction } from "express";
import { hash, compare } from "bcrypt"; // 사용자의 비밀번호 확인

import User from "../models/User.js"; // 사용자의 데이터를 생성 및 조회
import { createToken } from "../utils/Token.js"; //사용자의 아이디 및 이메일 인증
import { COOKIE_NAME } from "../utils/Constants.js"; // 쿠키

export const getAllUsers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const users = await User.find();
		return res.status(200).json({ message: "OK", users }); // OK와 함께 조회된 사용자 목록 포함
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "ERROR", cause: error.message }); // ERROR와 함께 오류 메세지 출력
	}
};

export const userSignUp = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { name, email, password } = req.body; // 사용자의 회원가입 이름, 이메일, 비밀번호
		const existingUser = await User.findOne({ email });

		if (existingUser) // 동일한 이메일 존재시 출력하는 메시지
			return res.status(409).json({
				message: "ERROR",
				cause: "User with same email already exists",
			});

		const hashedPassword = await hash(password, 10); // 비밀번호 입력
		const user = new User({ name, email, password: hashedPassword }); // 새로운 사용자의 데이터 
		await user.save(); // 데이터 저장

		// create token and store cookie

		res.cookie(COOKIE_NAME,'clear_token' , //쿠키 초기화
			{
				path: "/", //cookie directory in browser
				domain: process.env.DOMAIN, // our website domain
				maxAge: 0, //쿠키가 즉시 삭제
				httpOnly: true,
				signed: true,
				sameSite: 'lax',
				secure: true,
			});

		// create token
		const token = createToken(user._id.toString(), user.email, "7d");//새로운 토큰을 생성합니다. 이 토큰은 7일 후에 만료

		const expires = new Date();
		expires.setDate(expires.getDate() + 7); //현재날짜에서 7일더해 토큰 유효기간 설정

		res.cookie(COOKIE_NAME, token, {
			path: "/", //cookie directory in browser
			domain: process.env.DOMAIN, // our website domain
			expires, // same as token expiration time
			httpOnly: true,
			signed: true,
			sameSite: 'lax',
			secure: true,
		});

		return res
			.status(201)
			.json({ message: "OK", name: user.name, email: user.email }); // 회원가입 완료 시 
	} catch (error) {
		console.log(error);
		return res.status(500).json({ message: "ERROR", cause: error.message }); // 요청 처리 중 실패 했을 때 , 회원가입을 실패 했을 때
	}
};

export const userLogin = async ( // 유저가 로그인 요청 
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { email, password } = req.body; // 클라이언트가 이메일과 비밀번호 값을 추출
		console.log(email, password); // 입력된 이메일과 비밀번호를 기록

		const user = await User.findOne({ email });//해당 이메일을 가진 사용자가 존재하는 지 확인
		if (!user) // 사용자가 존재하지 않는 경우 다음 코드 실행
			return res.status(409).json({
				message: "ERROR",
				cause: "No account with given emailID found",
			});

		const isPasswordCorrect = await compare(password, user.password); //저장된 비밀번호와 비교 compare 함수 사용
		if (!isPasswordCorrect) // 비밀번호가 일치하지 않는 경우
			return res
				.status(403)
				.json({ message: "ERROR", cause: "Incorrect Password" });

		// if user will login again we have to -> set new cookies -> erase previous cookies
		res.cookie(COOKIE_NAME,'clear_token' ,
			{
				path: "/", //cookie directory in browser
				domain: process.env.DOMAIN, // our website domain
				maxAge: 0,
				httpOnly: true,
				signed: true,
				sameSite: 'lax',
				secure: true,
			});

		// create token
		const token = createToken(user._id.toString(), user.email, "7d");

		const expires = new Date();
		expires.setDate(expires.getDate() + 7);

		res.cookie(COOKIE_NAME, token, {
			path: "/", //cookie directory in browser
			domain: process.env.DOMAIN, // our website domain
			expires, // same as token expiration time
			httpOnly: true,
			signed: true,
			sameSite: 'lax',
			secure: true,
		});

		return res
			.status(200) // 응답상태 코드를 200으로 설정
			.json({ message: "OK", name: user.name, email: user.email }); // 로그인 사용자의 이메일 이름이 성공적으로 처리됨
	} catch (error) {
		console.log(error); // 오류를 콘솔에 기록
		return res.status(500).json({ message: "ERROR", cause: error.message }); // 에러 메시지를 클라이언트에 반환
	}
};

export const verifyUserStatus = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user) // 유저가 존재하지 않을 시 다음 코드 실행
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 사용자의 아이디가 존재하지 않거나 오류가 있다는 것을 알림
			});

		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 사용자의 아이디가 일치하지 않을 경우 에러 메시지 출력
		}

		return res
			.status(200)
			.json({ message: "OK", name: user.name, email: user.email }); // 검증된 사용자의 이름과 이메일을 확인
	} catch (err) {
		console.log(err);
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); // 오류 발생 시 에러 메시지를 클라이언트에 반환 
	}
};

export const logoutUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user) // 
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 사용자가 존재하지 않거나 토큰에 문제가 있음을 알림
			});

		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 두 아이디가 일치하지 않음을 확인
		}

        res.cookie(COOKIE_NAME,'clear_token' ,
			{
				path: "/", //cookie directory in browser
				domain: process.env.DOMAIN, // our website domain
				maxAge: 0, // 쿠키 만료 시간
				httpOnly: true, // 자바스크립트에서 접속 X
				signed: true, // 쿠키에 서명 추가
				sameSite: 'lax', // 공격 방지 (CRSF)
				secure: true, // HTTPS 연결에서만 쿠키를 전송
			});

		return res
			.status(200)
			.json({ message: "OK", name: user.name, email: user.email }); // 검증된 사용자의 이메일 및 이름 확인
	} catch (err) {
		console.log(err);
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); // 오류 메시지를 클라이언트에 반환
	}
};

export const changeName = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { name } = req.body; // 새로 업데이트할 이름 추출
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 존재하지 않거나 토큰에 문제가 있음을 알림
			});

		if (user._id.toString() !== res.locals.jwtData.id) { // 데이터에서 아이디가 일치하는지 확인
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 일치하지 않을 시 메시지 출력
		}

		user.name = name; // 사용자가 자신의 이름을 변경하는 과정
		await user.save(); // 업데이트된 사용자의 정보를 데이터베이스에 저장

		return res
			.status(200)
			.json({ message: "OK", name: user.name, email: user.email }); // 업데이트 된 사용자의 이름과 이메일을 포함
	} catch (err) {
		console.log(err); // 발생한 오류를 콘솔에 기록
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); //요청 처리중에 오류 발생, 발생한 오류의 원인에 메시지를 포함
	}
};

export const changePassword = async ( // 비밀번호 변경 
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { password } = req.body; // 새로 업데이트할 비밀번호 추출
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 존재하지 않거나 토큰에 문제가 있음을 알림
			});

		if (user._id.toString() !== res.locals.jwtData.id) { // 데이터에서 아이디가 일치하는지 확인
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 일치하지 않을 시 메시지 출력
		}

		const hashedPassword = await hash(password, 10); //hash함수는 비밀번호를 안전하게 저장하기 위해 해시 알고리즘 사용
		user.password = hashedPassword; // 사용자의 비밀번호를 해시형태로 저장
		await user.save(); // 작업이 성공적으로 저장이되면 그 다음단계로 진행

		return res
			.status(200)
			.json({ message: "OK", name: user.name, email: user.email });
	} catch (err) { // try 블록 내에서 오류 발생
		console.log(err); // 개발자가 문제를 추적하는데 유용
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); // 오류 메시지를 클라이언트에 반환
	}
};

export const checkPassword = async ( // 다른모듈에서 사용할 수 있도록 export 키워드를 사용
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { password } = req.body; // 입력된 비밀번호 추출
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user)// 사용자의 데이터가 데이터 베이스에 존재 x 다음 코드 진행
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 오류가 발생시 오류를 클라이언트에 반환 및 메시지 출력
			});

		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 두 아이디가 일치하지 않을 시 다음 메시지 출력
		}

		const isPasswordCorrect = await compare(password, user.password); // 사용자가 입력한 비밀번호와 데이터베이스에 저장된 비밀번호를 비교
		if (!isPasswordCorrect)
			return res
				.status(403) // 비밀번호가 일치하는 경우
				.json({ message: "ERROR", cause: "Incorrect Password" }); // 비밀번호가 일치하지 않을 경우 오류 메시지 출력

		return res
			.status(200)
			.json({ message: "OK", name: user.name, email: user.email }); // json 형식으로 사용자의 정보를 클라이언트에 반환
	} catch (err) {
		console.log(err); // 오류 추적 및 디버깅
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); // 오류 메시지 클라이언트에 반환
	}
};

export const deleteUser = async ( // 유저 정보 삭제
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(res.locals.jwtData.id); // get variable stored in previous middleware

		if (!user)
			return res.status(401).json({
				message: "ERROR",
				cause: "User doesn't exist or token malfunctioned", // 존재하지 않거나 토큰에 오류가 발생
			});

		if (user._id.toString() !== res.locals.jwtData.id) {
			return res
				.status(401)
				.json({ message: "ERROR", cause: "Permissions didn't match" }); // 두 아이디가 일치하지 않는 경우 메시지 출력
		}

		await User.findByIdAndDelete(res.locals.jwtData.id); // 사용자를 데이터 베이스에서 삭제
		return res.status(200).json({ message: "OK" }); //Json형식의 성공 메시지를 클라이언트에 반환
	} catch (err) { // 오류 발생 시
		console.log(err);
		return res
			.status(200)
			.json({ message: "ERROR", cause: err.message}); // json 형식에 오류 메시지를 클라이언트에 반환
	}
};

export const saveChatbox = async (req: Request, res: Response, next: NextFunction) => {
	try {
        const { cbox_x, cbox_y, cbox_w, cbox_h } = req.body; // 채팅박스의 위치와 크기를 나타냄
        const userId = res.locals.jwtData.id; // 사용자의 ID를 가져옴

        const updatedUser = await User.findOneAndUpdate( // 사용자의 정보를 업데이트
            { _id: userId },
            { $set: { ChatBox: { cbox_x, cbox_y, cbox_w, cbox_h } } },
            { new: true, upsert: true } // new: return the modified document, upsert: create if doesn't exist
        );

        if (!updatedUser) { // 만약 사용자의 존재x 또는 업데이트 실패 시 
            return res.status(401).json("User not registered / token malfunctioned"); // 오류 메시지를 클라이언트에 전송
        }

        return res.status(200).json({ message: "Chatbox saved or updated", chatbox: updatedUser.ChatBox }); // 업데이트된 채팅박스의 정보를 포함	
    } catch (error) {
        console.error("Error saving or updating chatbox:", error);
        return res.status(500).json({ message: error.message }); //발생한 오류에 대한 원인에 대한 메시지를 포함
    }
  };

export const getChatboxes = async (req: Request, res: Response, next: NextFunction) => {
	try {
	  	const user = await User.findById(res.locals.jwtData.id); // 사용자의 정보를 데이터베이스에서 조회

	  	if (!user) { // 사용자가 존재하지 않을 경우
			return res.status(401).json("User not registered / token malfunctioned"); // 오류 메시지 출력
	  	}
  
	  		return res.status(200).json({ chatboxes: user.ChatBox }); // 사용자의 채팅 박스 정보를 포함하여 응답
	} catch (error) {
	  	console.log(error); // 발생한 오류를 콘솔에 기록
	  	return res.status(500).json({ message: error.message }); // 오류 메시지를 클라이언트에 반환
	}
  };

  export const resetChatbox = async (req: Request, res: Response, next: NextFunction) => { //채팅 박스 초기화
	try {
	  	const user = await User.findById(res.locals.jwtData.id); //사용자의 정보를 데이터베이스에서 조회
	  	if (!user) { // 사용자가 존재하지 않을 경우
			return res.status(401).json("User not registered / token malfunctioned");
	 	 }
  
		user.ChatBox.push({ cbox_x: 2, cbox_y: 0.5, cbox_w: 8, cbox_h: 8 }); //사용자의 채팅 박스 배열에 새로운 채팅박스 초기 위치와 크기를 설정하는 객체 추가
		await user.save(); // 업데이트된 사용자의 정보를 저장
  
	  	return res.status(200).json({ message: "Chatbox resetted", chatbox: user.ChatBox }); //채팅박스가 성공적으로 초기화, 업데이트된 정보를 클라이언트에 반환
	} catch (error) {
	  	console.log(error); // 오류를 콘솔에 기록
	  	return res.status(500).json({ message: error.message }); // 오류 메시지를 클라이언트에 반환
	}
  };