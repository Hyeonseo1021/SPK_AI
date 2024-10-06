import mongoose, { Schema } from "mongoose";
import conversationSchema from "./Conversation.js"; //대화 모델을 관리하는데 필수

const modelSchema = new mongoose.Schema({ //모델의 데이터 구조를 정의
    modelId: { //문자열 타입으로 정의, 모델을 고유하게 식별하는 ID를 저장
        type: String,
        required: true,
    },
    modelName: { //문자열 타입으로 정의, 모델의 이름을 저장
        type: String,
        required: true,
    },
    modelData: { //문자열 타입으로 정의, 모델의 데이터를 저장
        type: Schema.Types.Mixed, //mixed 타입으로 저장, json객체와 같은 복잡한 데이터를 저장
        required: true,
    },
    createdAt: { //날짜 타입으로 정의, 현재 날짜와 시간을 설정, 모델이 생성된 시간을 기록
        type: Date,
        default: Date.now,
    },
}, 
{timestamps: true});

export default modelSchema; //다른 모듈에서 스키마를 가져와 사용 가능