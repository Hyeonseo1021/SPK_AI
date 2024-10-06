import mongoose from "mongoose";
import conversationSchema from "./Conversation.js"; //사용자가 가진 대화 목록을 저장하는데 사용
import modelSchema from "./CustomModel.js" //사용자가 생성한 맞춤형 모델을 저장하는데 사용
import chatboxSchema from "./Chatbox.js" // 채팅박스의 정보를 저장하는데 사용

const userSchema = new mongoose.Schema({ // 스키마가 사용자 데이터의 구조를 정의
    name: { //문자열 타입으로 정의, 사용자의 이름을 저장
        type: String,
        required: true,
    },
    email: { //문자열 타입으로 정의, 사용자의 이메일을 저장
        type: String,
        required: true,
        unique: true, //이메일이 데이터베이스에서 유일해야 함을 의미
    },
    password: { //문자열 타입으로 정의, 사용자의 비밀번호를 저장
        type: String,
        required: true,
    },
    conversations: [conversationSchema], //사용자가 참여한 모든 대화를 저장
    CustomModels: [modelSchema], //사용자가 생성한 사용자 정의 모델을 저장
    ChatBox: [chatboxSchema], // 사용자의 채팅박스 정보를 저장
});

export default mongoose.model("User", userSchema); //user라는 이름의 mongoose 모델을 생성, 사용자의 정보를 저장하고 관리