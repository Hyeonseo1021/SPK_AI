import { Request, Response, NextFunction } from "express"; //TypeScript를 사용할 때 타입 안정성을 높임
import { body, ValidationChain, validationResult } from "express-validator"; // 

export const validate = (validations: ValidationChain[]) => {  //유효성 검사를 수행하는 미들웨어 생성
	return async (req: Request, res: Response, next: NextFunction) => 
		for (let validation of validations) {
			const result = await validation.run(req); // 요청 데이터에 대한 검증을 수행
			if (!result.isEmpty()) { // 검증결과가 비어있지 않다면 루프를 중단
				break;
			}
		}
		const errors = validationResult(req); // 검증결과를 확인
		if (errors.isEmpty()) { 
			return next(); // 다음 미들웨어로 넘어감
		}
		res.status(422).json({ errors: errors.array() }); // 422코드와 함께 오류 메시지를 JSON 형식으로 반환
	};
};

export const loginValidator = [ // 로그인 요청에 대한 유효성 검사를 정의
	body("email").trim().isEmail().withMessage("Email is not valid"), // 이메일 형식인지 검증
	body("password")
		.trim()
		.isLength({ min: 8, max: 15 }) //길이가 8자 이상 15자 이하인지 확인
		.withMessage("Password should contain minimum 8 and maximum 15 characters")
];

export const signUpValidator = [ // 회원가입 요청에 대한 유효성 검사
	body("name").trim().notEmpty().withMessage("Name is required"), // 이름이 비어있는지 검증
	body("email").trim().isEmail().withMessage("Email is not valid"), // 이메일 형식인지 검증
	body("password") //길이가 8자 이상 15자 이하인지 검증
		.trim()
		.isLength({ min: 8, max: 15 })
		.withMessage("Password should contain minimum 8 and maximum 15 characters")
];

export const chatCompletionValidator = [ // 채팅 메시지가 비어있지 않은지 검증
	body("message").notEmpty().withMessage("Message is required"),
];

export const fineTuneValidator = [ // 모델 이름과 학습 데이터가 비어있는지 검증
	body("modelName").trim().notEmpty().withMessage("Model name is required"),
	body("trainingData").trim().notEmpty().withMessage("Training data is required"),
];

export const chatboxValidator = [ // 채팅박스의 x,y,w,h 좌표가 숫자인지 검증
	body("cbox_x").isNumeric().withMessage("cbox_x must be a number"),
	body("cbox_y").isNumeric().withMessage("cbox_y must be a number"),
	body("cbox_w").isNumeric().withMessage("cbox_w must be a number"),
	body("cbox_h").isNumeric().withMessage("cbox_h must be a number"),
  ];