// services/modelStorage.ts
import User from "../models/User.js";
export const saveModel = async (userId, modelData, modelName) => {
    try {   // 모델 저장하는 함수
        const user = await User.findById(userId); // userid로 사용자 찾기
        if (!user) {
            throw new Error("User not found");
        }
        const existingModelIndex = user.CustomModels.findIndex((model) => model.modelName === modelName);
        if (existingModelIndex !== -1) {    
            user.CustomModels[existingModelIndex].modelData = modelData;
        }   // findIndex로 모델 찾기 -1이 아니면 모델 데이터 넣기
        else {
            user.CustomModels.push({
                modelId: modelData.id,
                modelName,
                modelData,
            }); // 커스텀 모델 푸시
        }
        await user.save(); // 저장
    }
    catch (error) {
        throw new Error(`Failed to save model: ${error.message}`);
    }
};
export const loadModel = async (userId, modelId) => {
    try {   // 모델 불러오는 함수
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }   // 유저 찾기
        const model = user.CustomModels.find((model) => model.modelId === modelId);
        if (!model) {
            throw new Error("Model not found");
        }   // 모델 찾기 
        return model; // 모델 반환
    }
    catch (error) {
        throw new Error(`Failed to load model: ${error.message}`);
    }
};
export const deleteModel = async (userId, modelId) => {
    try {   // 모델 삭제하는 함수
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }   // 사용자 찾기
        const modelIndex = user.CustomModels.findIndex((model) => model.modelId === modelId);
        if (modelIndex === -1) {
            throw new Error("Model not found");
        }   // modelId로 모델 찾고 -1(존재함)이면 모델 삭제
        user.CustomModels.splice(modelIndex, 1);
        await user.save(); // 저장
    }
    catch (error) {
        throw new Error(`Failed to delete model: ${error.message}`);
    }
};
//# sourceMappingURL=modelStorage.js.map