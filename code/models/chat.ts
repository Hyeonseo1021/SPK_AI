import mongoose from "mongoose"; //mongoose 라이브러리
import { randomUUID } from "crypto"; //crypto모듈에서 randomUUID함수를 가져옴

const chatSchema = new mongoose.Schema({ // 스키마는 채팅 메시지와 데이터 구조를 정의
	id: { //문자열 타입으로 정의, 고유 ID가 자동으로 생성, 각 채팅 메시지가 고유한 식별자를 가짐
		type: String,
		default: randomUUID(),
	},
	role: { //문자열 타입으로 정의, 메시지를 보낸 사용자의 역할
		type: String,
		required: true,
	},
	content: { //채팅 메시지의 실제 내용을 저장
		type: String,
		required: true,
	},
	createdAt: { // 날짜 타입으로 정의, 현재 날짜와 시간을 설정
        type: Date,
        default: Date.now,
    },
},
{timestamps: true}, //mongoose가 자동으로 필드를 관리
);

export default chatSchema; //다른 모듈에서 스키마를 가져와 사용 가능