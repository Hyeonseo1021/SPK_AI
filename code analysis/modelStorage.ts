import User from "../models/User.js"; // User 모델 불러오기

// 모델 저장 함수
export const saveModel = async (userId: string, modelData: any, modelName: string) => {
  try {
    const user = await User.findById(userId); // 사용자 찾기
    if (!user) throw new Error("User not found");

    const existingModelIndex = user.CustomModels.findIndex((model) => model.modelName === modelName);
    if (existingModelIndex !== -1) {
      user.CustomModels[existingModelIndex].modelData = modelData; // 기존 모델 업데이트
    } else {
      user.CustomModels.push({ modelId: modelData.id, modelName, modelData }); // 새 모델 추가
    }
    await user.save(); // 저장
  } catch (error) {
    throw new Error(`Failed to save model: ${error.message}`);
  }
};

// 모델 로드 함수
export const loadModel = async (userId: string, modelId: string) => {
  try {
    const user = await User.findById(userId); // 사용자 찾기
    if (!user) throw new Error("User not found");

    const model = user.CustomModels.find((model) => model.modelId === modelId);
    if (!model) throw new Error("Model not found");

    return model; // 모델 반환
  } catch (error) {
    throw new Error(`Failed to load model: ${error.message}`);
  }
};

// 모델 삭제 함수
export const deleteModel = async (userId: string, modelId: string) => {
  try {
    const user = await User.findById(userId); // 사용자 찾기
    if (!user) throw new Error("User not found");

    const modelIndex = user.CustomModels.findIndex((model) => model.modelId === modelId);
    if (modelIndex === -1) throw new Error("Model not found");

    user.CustomModels.splice(modelIndex, 1); // 모델 삭제
    await user.save(); // 저장
  } catch (error) {
    throw new Error(`Failed to delete model: ${error.message}`);
  }
};
