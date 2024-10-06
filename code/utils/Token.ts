import { Request, Response, NextFunction } from "express"; //Express.js의 타입을 정의, TypeScript를 사용하여 타입 안정성을 높임
import jwt from "jsonwebtoken"; // JWT를 생성하고  검증하는 데 사용하는 라이브러리
import { COOKIE_NAME } from "./Constants.js"; // 인증 토큰을 저장할 쿠키의 이름을 정의한 상수

export const createToken = (id: string, email: string, expiresIn: string) => {
	const payload = { id, email };

	const token = jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn,
	});

	return token; // 토큰에 포함될 데이터, 사용자 ID와 이메일을 포함 , JWT를 생성하는 메서드로, 첫번째 인수로 페이로드, 두번째 인수로 비밀 키, 세번째 인수로 만료시간 설정
};

export const verifyToken = async ( // JWT 미들웨어
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.signedCookies[`${COOKIE_NAME}`]; // signed cookies is an object which can contain all of the cookies data

	if (!token || token.trim() === "") {
		return res.status(401).json({ message: "Token Not Received" });
	}
	return new Promise<void>((resolve, reject) => { // JWT 검증을 비동기로 처리하기 위해 Promise를 사용
		return jwt.verify( // 토큰을 검증하는 메서드, 첫번째 인수는 검증할 토큰, 두 번째 인수는 비밀 키
			token,
			process.env.JWT_SECRET,
			(err: any, success: any) => {
				if (err) {
					reject(err.message);
					return res.status(401).json({ message: "Token Expired" });
				} else {
					// we will set some local paramaeters for this request in this function
					// and then we can use those parameters inside next function
					// send local variables to next request

                    console.log('Token verification successfull')

					resolve();
					res.locals.jwtData = success; // 검증된 데이터 저장
					return next(); // 다음 미들 웨어로 넘어감
				}
			}
		);
	});
};