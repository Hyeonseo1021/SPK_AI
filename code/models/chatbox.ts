import mongoose from "mongoose";

const chatboxSchema = new mongoose.Schema({ // 채팅박스의 속성 구조를 정의
	cbox_x: { //숫자타입으로 정의, x좌표
		type: Number,
		required: true,
	},
	cbox_y: { //숫자타입으로 정의, y좌표
		type: Number,
		required: true,
	},
    cbox_w: { //숫자타입으로 정의, 너비
		type: Number,
		required: true,
	},
    cbox_h: { //숫자타입으로 정의, 높이
		type: Number,
		required: true,
	},

});

export default chatboxSchema; //정의한 스키마를 기본으로 내보냄