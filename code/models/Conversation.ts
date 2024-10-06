import mongoose from "mongoose";
import chatSchema from "./Chat.js"; //채팅 메시지의 구조를 정의
import { randomUUID } from "crypto"; //crypto모듈에서 randomUUID함수를 가져옴

const conversationSchema = new mongoose.Schema({ // 대화의 데이터 구조를 정의
    id: { //문자열 타입으로 정의, 고유한 ID가 자동으로 생성
        type: String,
        default: randomUUID(),
    },
    chats: [chatSchema], //chatSchema를 기반으로 한 배열을 정의, 모든 채팅 메시지를 저장
    createdAt: { //날짜 타입으로 정의, 대화가 생성된 시간을 기록
        type: Date,
        default: Date.now,
    },
    updatedAt: { //날짜 타입으로 정의, 현재 날짜와 시간을 설정, 마지막으로 업데이트된 시간을 기록
        type: Date,
        default: Date.now,
    },
},
{timestamps: true},// 앞에서 수동으로 정의되어 중복될수 있음, timestamps 옵션을 사용하면 mongoose가 자동으로 관리
);

export default conversationSchema; //다른 모듈에서 스키마를 가져와 사용 가능