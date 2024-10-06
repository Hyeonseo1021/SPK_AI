import express from "express"; //express 라이브러리를 임포트하여 웹 서버 및 라우터 기능을 사용

const Routes = express.Router(); // 새로운 라우터 인스턴스를 생성, 다양한 경로에 대한 요청 처리

// test
Routes.get("/", (req, res, next) => {
	console.log("This is Main Page");
	res.send("hello from Routes");
});

export default Routes; // 다른 파일에서 라우터 사용할 수 있도록 내보냄