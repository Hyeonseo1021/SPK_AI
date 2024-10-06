import React, { useState, useEffect, useRef, useCallback } from 'react'; // react 기반의 사이드바 컴포넌트를 구현하기 위한 초기 설정
import { FaTrashAlt, FaPlus, FaRobot, FaMinus, FaList } from 'react-icons/fa';  // 다양한 아이콘을 사용하여 UI 요소에 시각적 효과를 추가
import { Modal, Button } from 'react-bootstrap'; // 사용자와의 상호작용을 위한 모달 컴포넌트를 사용
import { deleteConversation, deleteAllChats, startNewConversation, getCustomModels, createModel, deleteModel } from '../../api/axiosInstance'; 
// 다양한 API호출을 위한 함수들을 가져옴
import '../../css/Sidebar.css'; // 사이드바 스타일을 정의한 CSS 파일을 가져옴, 컴포넌트의 디자인을 조정

const Sidebar = ({  // 컴포넌트의 정의 부분으로 컴포넌트가 받을 props를 설정
  isOpen,  // 사이드바의 열림 상태를 나타내는 boolean 값
  toggleSidebar, // 사이드바의 열림/ 닫힘 상태를 전환하는 함수
  closeSidebar,  // 사이드바를 닫는 함수
  conversations,  // 대화 목록을 담고 있는 배열
  onConversationDelete, // 대화가 삭제된 후 호출되는 콜백 함수, 대화 삭제 후 상태를 업데이트
  onNewModel,  // 새로운 모델이 생성된 후 호출되는 콜백함수
  onNewConversation,  // 새로운 대화가 시작된 후 호출되는 콜백 함수, 대화ID를 부모 컴포넌트에 전달하여 상태를 업데이트
  onConversationSelect, // 사용자가 대화 방을 선택했을 떄 호출되는 콜백함수
  onModelConversationSelect, // 모델과 관련된 대화를 선택했을 떄 호출되는 콜백 함수
  onModelSelect // New prop to handle model selection
}) => { 
  const sidebarRef = useRef(null); // 사이드바 DOM 요소를 참조하기 위한 ref 입니다. 조작이나 특정위치로 조작할 떄 사용
  const [showDeleteModal, setShowDeleteModal] = useState(false); // 단일 대화 삭제 확인 모달의 열림 상태를 관리, true일 경우 모달이 열림
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false); // 모든 대화 삭제 확인 모달의 열림 상태를 확인
  const [showErrorModal, setShowErrorModal] = useState(false); // 오류 메시지를 표시하기 위한 모달의 열림 상태를 관리
  const [showModelModal, setShowModelModal] = useState(false); // 사용자 정의 모델 목록을 표시하기 위한 모달의 열림 상태를 관리
  const [showTrainingModal, setShowTrainingModal] = useState(false); // 모델 훈련을 위한 입력 폼을 표시하기 위한 모달의 열림 상태를 관리
  const [showDeleteModelModal, setShowDeleteModelModal] = useState(false); // 특정 모델 삭제 확인 모달의 열림 상태를 관리
  const [deleteRoomId, setDeleteRoomId] = useState(null);  // 삭제할 대화 방의 ID를 저장합니다. 대화를 삭제할 때 필요
  const [deleteModelId, setDeleteModelId] = useState(null); // 삭제할 모델의 ID를 저장합니다. 모델 삭제 시 사용됩
  const [, setError] = useState(''); // 오류 메시지를 관리하기 위한 상태 현재는 값이 필요하지 않아서 빈 배열로 선언
  const [models, setModels] = useState([]); // 사용자 정의 모델 목록을 저장하는 배열 API를 통해 가져온 모델 데이터를 저장
  const [isTraining, setIsTraining] = useState(false); // 모델 훈련 중 여부를 나타내는 boolean 값, 훈련 중일 경우 UI에서 버튼을 비활성화
  const [responseMessage, setResponseMessage] = useState(''); // 모델 생성 후의 응답 메시지를 저장합니다. 사용자에게 결과를 알리기 위해 사용
  const [modelName, setModelName] = useState(''); // 생성할 모델의 이름을 저장, 사용자가 입력한 값을 저장
  const [systemContent, setSystemContent] = useState(''); // 모델의 역할이나 성격을 설명하는 내용을 저장
  const [userAssistantPairs, setUserAssistantPairs] = useState([{ user: '', assistant: '' }]); //사용자 질문과 모델 응답의 쌍을 저장하는 배열입니다. 초기값은 빈 문자열로 구성된 한 쌍의 객체

  const formatDate = (dateString) => { // 상태 변수 선언 후, 날짜 문자열을 한국어 형식으로 포맷팅
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', options).format(date);
  };

  const groupByDate = (rooms) => { // 대화 방 목록을 생성일자별로 그룹화, UI에서 날짜별로 대화를 표시하는데 유용
    return rooms.reduce((groups, room) => {
      const date = room.createdAt.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(room);
      return groups;
    }, {});
  };

  const handleDeleteClick = (roomId) => { // 특정 대화를 삭제하기 위한 모달을 열기 위해 호출, 삭제할 대화방의 ID 상태에 저장
    setDeleteRoomId(roomId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => { // 사용자가 삭제 확인을 클릭했을 때 대화를 실제로 삭제, 삭제 여부에 따라 메시지 출력
    try {
      await deleteConversation(deleteRoomId);
      onConversationDelete(true);
      setShowDeleteModal(false);
      console.log('대화가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.log('대화 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteAllChats = () => { // 모든 대화를 삭제하기 위한 모달을 열기 위해 호출
    setShowDeleteAllModal(true);
  };

  const confirmDeleteAllChats = async () => { // 사용자가 모든 대화 삭제를 확인했을 때 호출
    try {
      await deleteAllChats();
      console.log('대화기록이 성공적으로 삭제되었습니다.');
      onConversationDelete(true);
      setShowDeleteAllModal(false);
    } catch (error) {
      console.log('대화기록 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const sortedChatRooms = useCallback(() => { // 대화 방을 날짜별로 정렬하고 그룹화하여 반환
    const grouped = groupByDate(conversations);
    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        rooms: grouped[date].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }));
  }, [conversations]);

  const truncateMessage = (message, length) => { // 문자열 형태의 메시지, 숫자 형태 최대 길이 초과할 경우 줄여야 함
    if (message.length <= length) return message; // 입력된 메시지의 길이가 length보다 작거나 같으면, 원래의 메시지를 그대로 반환
    return message.substring(0, length) + '...'; // 메시지가 길이를 초과할 경우 지정된 인덱스부터  length 인덱스 까지 잘라냄
  };

  useEffect(() => { // 대화 목록이 변경될 떄마다 각 대화의 ID와 마지막 메시지를 콘솔에 출력
    sortedChatRooms().forEach(group => {
      group.rooms.forEach(room => {
        console.log(`대화 ID: ${room._id}, 마지막 메시지: ${room.chats[room.chats.length - 1]?.content}`);
      });
    });
  }, [conversations, sortedChatRooms]);

  const startConversation = async () => { // 새로운 대화를 시작, 성공적으로 시작된 경우 부모 컴포넌트에 알림
    try {
      const newConversationResponse = await startNewConversation(); // API 호출을 통해 새 대화를 생성
      const newConversationId = newConversationResponse; 

      if (newConversationId) {
        onNewConversation(newConversationId); // 호출하여 부모 컴포넌트에 알림
      } else { 
        console.warn('No new conversation started.');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) { // 400 오류 발생 시 적절한 오류 메시지 설정
        setError(error.response.data.cause || 'The last conversation is still empty. Please add messages before creating a new conversation.');
      } else if (error.response && error.response.status === 401) { // 401오류 발생 시 콘솔에 오류 메시지를 출력
        console.error('Unauthorized (401):', error.response.data);
      } else {
        console.error('Failed to start new conversation:', error);
      }
      setShowErrorModal(true);
    }
  };

  const handleModelClick = async () => { // 사용자 정의 모델을 API를 통해 가져옴, 상태 저장하고 모델 목록을 표시하는 모달을 연다.
    try {
      const fetchedModels = await getCustomModels(); // 함수가 호출되어 서버에서 사용자 정의 모델 목록을 가져옴, 호출은 비동기적이므로 데이터가 로드 됨
      setModels(fetchedModels); // 가져온 모델 목록을 상태에 저장, 상태는 모델 목록을 렌더링하는 데 사용
      setShowModelModal(true); // 모델 목록을 표시하기 위한 모달을 열고 사용자는 이 모달을 통해 모델을 선택
    } catch (error) { // API 호출 중 오류가 발생할 경우, 오류를 잡아냄
      console.error('Failed to fetch models:', error); // 오류 메시지를 콘솔에 출력하여 개발자 문제를 파악
      setError('Failed to fetch models.'); // 오류 메시지를 상태에 저장하여 사용자에게 피드백을 제공
      setShowErrorModal(true); // 오류가 발생했을을 사용자에게 알리기 위해 오류 모달을 연다.
    }
  };



  const handleModelSelect = (modelId) => { // 사용자가 모델을 선택했을 때 호출
    onModelSelect(modelId); // Pass the selected model ID to the parent component
    setShowModelModal(false);
  };

  const handleTrainModelClick = () => { // 모델 훈련을 시작하기 위한 모달을 표시
    setShowTrainingModal(true); // 모델 훈련 모달을 열고 모델 훈련에 필요한 정보를 입력
    setShowModelModal(false); // 모델 목록 모달을 닫음
  };

  const handleAddPair = () => { // 사용자와 모델의 질문-응답 쌍을 추가
    setUserAssistantPairs([...userAssistantPairs, { user: '', assistant: '' }]);
  };

  const handleRemovePair = (index) => { // 특정 질문 응답 쌍을 제거
    setUserAssistantPairs(userAssistantPairs.filter((_, i) => i !== index));
  };

  const handlePairChange = (index, role, value) => { // 특정 질문-응답 쌍의 내용을 업데이트
    const newPairs = [...userAssistantPairs];
    newPairs[index][role] = value;
    setUserAssistantPairs(newPairs);
  };

  const handleSubmit = async () => { // 모델 훈련을 시작하기 위한 초기 설정을 수행, 사용자가 입력한 데이터로 모델을 훈련시키는 과정
    setIsTraining(true);
    setResponseMessage('');
    try {
      // Convert each pair to a JSON string and join with newline
      const trainingData = userAssistantPairs.map(pair => JSON.stringify({
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: pair.user },
          { role: "assistant", content: pair.assistant }
        ]
      })).join('\n');

      console.log("Submitting model with the following data:"); // 로그는 코드이 흐름을 이해하는데 도움을 줌, 해당 시점에서 모델 제출이 시작
      console.log("Model Name: ", modelName); // 현재 제출하고자 하는 모델의 이름을 출력
      console.log("Training Data: ", trainingData); // 제출한 훈련 데이터를 출력

      // Ensure that createModel sends the trainingData as a string, not as a JSON array
      await createModel(modelName, trainingData); // Send as JSONL string
      setResponseMessage('Model created successfully');
      const updatedModels = await getCustomModels();
      setModels(updatedModels);
      await handleBacktoModels();
    } catch (error) {
      setResponseMessage(`Error creating model: ${error.response ? error.response.data.error : error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleCloseTrainingModal = () => { // 훈련 모달을 닫음, 사용자가 모달을 중요할 떄 UI에서 모달을 숨기는 역할
    setShowTrainingModal(false); // 모델의 이름을 문자열로 초기화
    setModelName(''); // 모델 이름을 빈 문자열로 초기화
    setSystemContent(''); // 시스템 콘텐츠를 빈 문자열로 초기화
    setUserAssistantPairs([{ user: '', assistant: '' }]); // 사용자와 모델의 질문-응답 쌍 초기화
    setResponseMessage(''); // 응답 메시지를 빈 문자열로 초기화
  };

  const handleBacktoModels = async () => { // 함수는 모델 훈련 모달을 닫고, 사용자가 모델 목록으로 돌아갈 수 있도록 필요한 상태 초기화
    setShowTrainingModal(false); // 훈련 모달을 닫음, 사용자가 훈련을 완료하거나 취소했을 떄 호출
    setModelName(''); // 모델 이름을 빈 문자열로 초기화하여 다음 번에 새로운 모델 이름을 입력
    setSystemContent(''); // 시스템 콘텐츠를 빈 문자열로 초기화
    setUserAssistantPairs([{ user: '', assistant: '' }]); // 사용자와 모델의 질문-응답 쌍을 초기화, 기본적으로 빈 쌍 하나로 설정하여 사용자가 새롭게 추가
    setResponseMessage(''); // 응답 메시지를 빈 문자열로 초기화하여 이전 훈련 결과를 지움
    const updatedModels = await getCustomModels(); // 최신 사용자 정의 모델 목록을 가져옴
    setModels(updatedModels); // 가져온 모델 목록으로 상태를 업데이트하여 UI에서 최신 모델을 표시
    setShowModelModal(true); // 모델 목록 모달을 연다. 사용자가 모델 목록을 확인하고 선택
  };

  const handleDeleteModelClick = (modelId) => { // 특정 모델을 삭제하기 위한 준비를 함
    setDeleteModelId(modelId); // 삭제할 모델의 ID를 상태에 저장
    setShowDeleteModelModal(true); // 모델 삭제 확인 모달, 사용자가 삭제를 확인
    setShowModelModal(false); // 모델 목록 모달을 닫음, 삭제 확인 모달이 열릴 떄 모델 목록을 숨김
  };

  const confirmDeleteModel = async () => { // 사용자가 모델 삭제를 확인했을 때 호출
    try {
      await deleteModel(deleteModelId);
      setShowDeleteModelModal(false); // 삭제 확인 모달을 닫음, 삭제 작업이 완료 되었거나 실패 했을 때 모달을 숨김
      console.log('모델이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.log('모델 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const cancelDeleteModel = () => { // 사용자가 모델 삭제를 취소했을 때 호출
    setShowDeleteModelModal(false);
    setShowModelModal(true);
  }; 

  return ( // 사이드바 UI 구성 요소를 정의. 사이드바는 대화 목록을 표시하고, 새로운 대화를 시작하거나 모델을 선택하는 버튼을 포함. 또한 대화를 삭제하기 위한 모달도 포함
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`} ref={sidebarRef}> 
      <div className="sidebar-header">
        <button className="new-conversation-button" onClick={startConversation}>
          <FaPlus size={20} />
        </button>
        <button className="new-model-button" onClick={handleModelClick}>
          <FaRobot size={25} />
        </button>
      </div>
      <div className="sidebar-content">
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
        {conversations.length > 0 && (
          <button className="delete-all-button" onClick={handleDeleteAllChats}>
            <FaTrashAlt size={16} /> 
          </button>
        )}
      </div>
      {/* Modal for single conversation delete */}
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