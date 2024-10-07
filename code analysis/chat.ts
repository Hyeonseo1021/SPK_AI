import mongoose from "mongoose"; //(스키마)데이터 모델 구조 정의
import { randomUUID } from "crypto";    //고유 식별자 생성

const chatSchema = new mongoose.Schema({//새로운 Mongoose 스키마 객체를 생성
	id: {
		type: String,
		default: randomUUID(),//각 채팅 메시지에 고유한 ID를 부여하는 데 사용
	},
	role: {
		type: String,
		required: true,
	},
	content: {
		type: String,
		required: true,
	},//채팅 메시지의 내용을 저장
	createdAt: {
        type: Date,
		default: Date.now,//현재 날짜와 시간으로 초기화
    },//채팅 메시지가 생성된 시간 표시
},
{timestamps: true},
);

export default chatSchema;