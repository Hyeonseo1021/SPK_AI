import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTrashAlt, FaPlus, FaRobot, FaMinus, FaList } from 'react-icons/fa';
import { Modal, Button } from 'react-bootstrap';
import { deleteConversation, deleteAllChats, startNewConversation, getCustomModels, createModel, deleteModel } from '../../api/axiosInstance';
import '../../css/Sidebar.css';

const Sidebar = ({ 
  isOpen, //사이드바가 현재 열려 있는지 닫혀 있는지 확인(가시성 제어)
  toggleSidebar, //사이드바 상태(열기/닫기)를 토글하는 데 사용
  closeSidebar, 
  conversations, //사이드바에 대화 목록을 표시
  onConversationDelete,//대화가 삭제될 때 호출,대화 ID 또는 객체를 매개변수로 사용하여 제거해야 할 대화를 식별
  onNewModel, //새 모델의 생성 또는 초기화를 처리
  onNewConversation, //새 대화가 시작될 때 작동
  onConversationSelect,//사용자가 사이드바에서 대화를 선택할 때 호출
  onModelConversationSelect,//특정 모델과 관련된 대화를 선택할 때 사용
  onModelSelect // 사용자가 특정 모델을 선택할 때 호출
}) => {
  const sidebarRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);//사용자가 삭제 작업을 확인하거나 취소할 수 있음
  // 가시성 관리
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false);
  
  const [deleteRoomId, setDeleteRoomId] = useState(null);//삭제할 방의 ID를 추적
  const [deleteModelId, setDeleteModelId] = useState(null);//삭제할 모델의 ID를 추적
  
  const [, setError] = useState('');//오류 메시지를 저장하는 데 사용
  const [models, setModels] = useState([]);//모델 목록을 관리 빈 배열 초기화
  const [isTraining, setIsTraining] = useState(false);//현재 학습 프로세스의 진행여부
  const [responseMessage, setResponseMessage] = useState('');//작업 후 수신된 메시지를 저장하는 데 사용
  const [modelName, setModelName] = useState('');//모델의 이름을 추적
  const [systemContent, setSystemContent] = useState('');
  const [userAssistantPairs, setUserAssistantPairs] = useState([{ user: '', assistant: '' }]);

  //한국어로 포맷
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  };
//'room'을 생성된 날짜별로 그룹화하도록 설계
  const groupByDate = (rooms) => {
    return rooms.reduce((groups, room) => {
      const date = room.createdAt.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(room);
      return groups;
    }, {});
  };

  const handleDeleteClick = (roomId) => {
    setDeleteRoomId(roomId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteConversation(deleteRoomId);
      onConversationDelete(true);
      setShowDeleteModal(false);
      console.log('대화가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.log('대화 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteAllChats = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAllChats = async () => {
    try {
      await deleteAllChats();
      console.log('대화기록이 성공적으로 삭제되었습니다.');
      onConversationDelete(true);// 대화 기록 삭제후 상태 업데이트
      setShowDeleteAllModal(false);//삭제 확인 모달 닫기
    } catch (error) {
      console.log('대화기록 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };
//대화 목록을 날짜별로 그룹화하고 정렬하여 반환
  const sortedChatRooms = useCallback(() => {
    const grouped = groupByDate(conversations);
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))//내림차순
      .map(date => ({
        date,
        rooms: grouped[date].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }));
  }, [conversations]);

  const truncateMessage = (message, length) => {
    if (message.length <= length) return message;
    return message.substring(0, length) + '...';
  };//메시지가 특정 길이를 초과하는 경우, 그 메시지를 잘라내고 '...'을 추가하여 반환

  useEffect(() => {//업데이트 될 떄마다 각 대화방의 ID와 마지막 메시지를 콘솔에 출력
    sortedChatRooms().forEach(group => {
      group.rooms.forEach(room => {
        console.log(`대화 ID: ${room._id}, 마지막 메시지: ${room.chats[room.chats.length - 1]?.content}`);
      });
    });
  }, [conversations, sortedChatRooms]);

  //새로운 대화 시작
  const startConversation = async () => {
    try {
      const newConversationResponse = await startNewConversation();
      const newConversationId = newConversationResponse;

      if (newConversationId) {
        onNewConversation(newConversationId);
      } else {
        console.warn('No new conversation started.');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError(error.response.data.cause || 'The last conversation is still empty. Please add messages before creating a new conversation.');
      } else if (error.response && error.response.status === 401) {
        console.error('Unauthorized (401):', error.response.data);
      } else {
        console.error('Failed to start new conversation:', error);
      }
      setShowErrorModal(true);
    }
  };

  const handleModelClick = async () => {
    try {
      const fetchedModels = await getCustomModels();//사용자 정의 모델 데이터를 가져옴
      setModels(fetchedModels);
      setShowModelModal(true);// 모델 모달을 화면에 표시
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setError('Failed to fetch models.');
      setShowErrorModal(true);
    }
  };



  const handleModelSelect = (modelId) => {
    onModelSelect(modelId); // Pass the selected model ID to the parent component
    setShowModelModal(false);
  };
//모델 학습을 시작
  const handleTrainModelClick = () => {
    setShowTrainingModal(true);//모델 학습을 위한 모달을 화면에 표시
    setShowModelModal(false);
  };
//사용자가 쌍을 추가하려고 할 때 호출되는 함수
  const handleAddPair = () => {
    setUserAssistantPairs([...userAssistantPairs, { user: '', assistant: '' }]);
  };
// 특정 쌍 제거
  const handleRemovePair = (index) => {
    setUserAssistantPairs(userAssistantPairs.filter((_, i) => i !== index));
  };

  const handlePairChange = (index, role, value) => {
    const newPairs = [...userAssistantPairs];
    newPairs[index][role] = value;
    setUserAssistantPairs(newPairs);
  };

  const handleSubmit = async () => {
    setIsTraining(true);
    setResponseMessage('');
    try {
      // Convert each pair to a JSON string and join with newline
      //userAssistantPairs 배열의 각 쌍을 순회하여, 각 쌍을 JSON 문자열로 변환
      const trainingData = userAssistantPairs.map(pair => JSON.stringify({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: pair.user },
          { role: "assistant", content: pair.assistant }
        ]
      })).join('\n');

      console.log("Submitting model with the following data:");
      console.log("Model Name: ", modelName);
      console.log("Training Data: ", trainingData);

      // Ensure that createModel sends the trainingData as a string, not as a JSON array
      await createModel(modelName, trainingData); //모델 생성, // Send as JSONL string
      setResponseMessage('Model created successfully');//성공 메세지 설정
      const updatedModels = await getCustomModels();//업데이트된 모델 목록 업데이트
      setModels(updatedModels);
      await handleBacktoModels();
    } catch (error) {
      setResponseMessage(`Error creating model: ${error.response ? error.response.data.error : error.message}`);
    } finally {
      setIsTraining(false);
    }
  };
//학습 모달 닫기
  const handleCloseTrainingModal = () => {
    setShowTrainingModal(false);
    setModelName('');//모델 이름을 빈 문자열로 초기화
    setSystemContent('');//시스템 메시지를 빈 문자열로 초기화
    setUserAssistantPairs([{ user: '', assistant: '' }]);//사용자-어시스턴트 쌍을 빈쌍으로 초기화
    setResponseMessage('');//이전 응답 메시지를 초기화 화면에서 메세지 숨김
  };
// 모델 목록으로 돌아가기
  const handleBacktoModels = async () => {
    setShowTrainingModal(false);
    setModelName('');
    setSystemContent('');
    setUserAssistantPairs([{ user: '', assistant: '' }]);
    setResponseMessage('');
    const updatedModels = await getCustomModels();//최신 모델 목록 반환
    setModels(updatedModels);// 반환한 목록을 업데이트
    setShowModelModal(true);//모델 목록 모달을 화면에 표시
  };

  const handleDeleteModelClick = (modelId) => {//삭제할 모델의 ID를 매개변수로 받아 처리
    setDeleteModelId(modelId);
    setShowDeleteModelModal(true);// 삭제 확인 모달을 화면에 표시
    setShowModelModal(false);
  };

  const confirmDeleteModel = async () => {//모델을 삭제하겠다고 확인할 때 호출
    try {
      await deleteModel(deleteModelId);//삭제할 모델ID 호출하여 삭제
      setShowDeleteModelModal(false);
      console.log('모델이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.log('모델 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const cancelDeleteModel = () => {//삭제 확인 모달에서 취소를 선택했을 때 호출
    setShowDeleteModelModal(false);//삭제 확인 모달 닫기, 삭제 작업을 취소
    setShowModelModal(true);//제를 취소한 후, 모델 목록을 볼 수 있음
  }; 

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`} ref={sidebarRef}>
      <div className="sidebar-header"> //새 대화 시작, 새 모델 열기
        <button className="new-conversation-button" onClick={startConversation}>
          <FaPlus size={20} />
        </button>
        <button className="new-model-button" onClick={handleModelClick}>
          <FaRobot size={25} />
        </button>
      </div> 
      <div className="sidebar-content"> //대화 내역이 없을 경우 안내 메시지를 표시,대화가 있을 경우에는 날짜별로 그룹화된 대화 목록을 렌더링
        <div className="sidebar-menu">
          {conversations.length === 0 ? (
            <div className="no-chat-rooms">
              <p>대화 내역이 이곳에 저장됩니다.</p>
            </div>
          ) : (
            sortedChatRooms().map((group, index) => (
              <div key={index} className="chat-date-group">
                <h3 className="chat-date">{formatDate(group.date)}</h3>
                {group.rooms.map((room, idx) => (
                  <div 
                    key={idx} 
                    className="chat-room"
                    onClick={() => onConversationSelect(room._id)}
                  >
                    <span className="room-title">
                      {room.chats.length > 0 ? truncateMessage(room.chats[room.chats.length - 1].content, 40) : "새 대화를 시작하세요."}
                    </span>
                    <button className="delete-button" onClick={(e) => {e.stopPropagation(); handleDeleteClick(room._id); }}>
                      <FaMinus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
        {conversations.length > 0 && ( // 대화삭제버튼
          <button className="delete-all-button" onClick={handleDeleteAllChats}>
            <FaTrashAlt size={16} /> 
          </button>
        )}
      </div>
      {/* Modal for single conversation delete */} //대화를 삭제하기 전에 확인
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>대화 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말로 대화를 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>

//모든 대화를 삭제하기 전에 확인하는 모달
      {/* Modal for deleting all conversations */}
      <Modal show={showDeleteAllModal} onHide={() => setShowDeleteAllModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>모든 대화 삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말로 모든 대화를 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteAllModal(false)}>
            취소
          </Button>
          <Button variant="danger" onClick={confirmDeleteAllChats}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for displaying errors */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>오류</Modal.Title>
        </Modal.Header>
        <Modal.Body>{'이미 새 대화가 생성되었습니다.'}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowErrorModal(false)}>
            닫기
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for displaying models */}
      <Modal show={showModelModal} onHide={() => setShowModelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>모델 목록</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul className="model-list">
            {models.map((model, index) => (
              <div key={index} className="model-item">
                <div className="model-item-content" onClick={() => handleModelSelect(model.modelId)}>
                  <div className="model-name">{model.modelName}</div>
                  <div className="model-date">{formatDate(model.createdAt)}</div>
                  <div className="model-id">{model.modelId}</div>
                </div>
                <button className="delete-button" onClick={() => handleDeleteModelClick(model.modelId)}>
                  <FaMinus size={16} />
                </button>
              </div>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleTrainModelClick}>
            <FaPlus size={25} />
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for training a new model */}
      <Modal show={showTrainingModal} onHide={handleCloseTrainingModal}>
        <Modal.Header closeButton>
          <Modal.Title>모델 생성</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="input-group">
            <label>모델 이름</label>
            <input
              type="text"
              placeholder="모델 이름을 입력하세요"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>모델 역할</label>
            <textarea
              rows={3}
              placeholder="모델의 성격, 임무, 역할 등을 알려주세요."
              value={systemContent}
              onChange={(e) => setSystemContent(e.target.value)}
              required
            />
          </div>
          {userAssistantPairs.map((pair, index) => (
            <div key={index} className="input-group-pair">
              <div className="input-group-pair-header">
                <label>예시 질문 {index + 1}</label>
                {index > 0 && (
                  <Button variant="danger" onClick={() => handleRemovePair(index)}>
                    <FaMinus size={15}/>
                  </Button>
                )}
              </div>
              <div className="input-group">
                <textarea
                  rows={2}
                  placeholder="예시 질문을 입력하세요."
                  value={pair.user}
                  onChange={(e) => handlePairChange(index, 'user', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>원하는 응답 {index + 1}</label>
                <textarea
                  rows={2}
                  placeholder="원하는 응답 또는 대답을 알려주세요."
                  value={pair.assistant}
                  onChange={(e) => handlePairChange(index, 'assistant', e.target.value)}
                  required
                />
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          {responseMessage && <p>{responseMessage}</p>}
          <Button variant="light" onClick={handleBacktoModels}>
            <FaList size={20} />
          </Button>
          <Button variant="light" onClick={handleAddPair}>
            <FaPlus size={20} />
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isTraining}>
            {isTraining ? '학습 중...' : '모델 생성'}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal for single model delete */}
      <Modal show={showDeleteModelModal} onHide={() => setShowDeleteModelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>삭제 확인</Modal.Title>
        </Modal.Header>
        <Modal.Body>정말로 모델을 삭제하시겠습니까?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeleteModel}>
            취소
          </Button>
          <Button variant="danger" onClick={confirmDeleteModel}>
            삭제
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Sidebar;