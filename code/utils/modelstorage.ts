// services/modelStorage.ts
import User from "../models/User.js"; // mongo DB에서 사용자 정보를 관리하는 모델을 임포트, 사용자 관련 데이터와 함께 커스텀 모델 저장

export const saveModel = async (userId: string, modelData: any, modelName: string) => { // 사용자의 커스텀 모델을 저장하거나 업데이트
  try {
    const user = await User.findById(userId); // 사용자의 정보를 조회 , 사용자의 정보가 존재하지 않을 경우 오류를 출력 
    if (!user) { 
      throw new Error("User not found");
    }

    const existingModelIndex = user.CustomModels.findIndex((model) => model.modelName === modelName);
    if (existingModelIndex !== -1) {
      user.CustomModels[existingModelIndex].modelData = modelData;
    } else {
      user.CustomModels.push({
        modelId: modelData.id, //
        modelName, // 저장할 모델 이름
        modelData, // 저장할 모델 데이터
      });
    }

    await user.save(); // 호출하여 변경된 사용자의 정보를 데이터 베이스에 저장
  } catch (error) { // 오류가 발생하면 적절한 메시지와 함께 오류를 출력
    throw new Error(`Failed to save model: ${error.message}`);
  }
};

export const loadModel = async (userId: string, modelId: string) => { // 사용자의 커스텀 모델을 로드, UserID : 모델을 로드할 사용자의 ID, Model ID : 로드할 모델의 ID
  try {
    const user = await User.findById(userId); // 사용자의 정보를 조회
    if (!user) {
      throw new Error("User not found");
    }

    const model = user.CustomModels.find((model) => model.modelId === modelId); // 지정된 모델의 아이디에 해당하는 모델을 찾음
    if (!model) {
      throw new Error("Model not found");
    }

    return model; // 모델이 존재하면 반환
  } catch (error) { // 사용하는 모델이 존재하지 않거나 없으면 오류 출력
    throw new Error(`Failed to load model: ${error.message}`);
  }
};

export const deleteModel = async (userId: string, modelId: string) => { // 사용자의 커스텀 모델을 삭제
  try {
    const user = await User.findById(userId); // 사용자의 정보를 조회
    if (!user) {
      throw new Error("User not found");
    }

    const modelIndex = user.CustomModels.findIndex((model) => model.modelId === modelId); // 지정된 modelID에 해당하는 모델의 인덱스를 찾음
    if (modelIndex === -1) {
      throw new Error("Model not found");
    }

    user.CustomModels.splice(modelIndex, 1); // splice 메서드를 사용하여 모델을 삭제
    await user.save(); //  변경된 사용자의 정보를 데이터 베이스에 저장
  } catch (error) { // 사용자가 존재하지 않거나 모델이 없으면 오류 출력
    throw new Error(`Failed to delete model: ${error.message}`);
  } 
};