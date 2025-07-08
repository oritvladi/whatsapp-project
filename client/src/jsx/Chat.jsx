import '../css/OpenChat.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from "socket.io-client";
import { url } from '../config';
import axios from 'axios';
import { parseISO, addHours, format } from 'date-fns';

const Chat = () => {
  const { callId } = useParams();
  const messagesEndRef = useRef(null);
  const [managerId, setManagerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isFirstM, setIsFirstM] = useState(false);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const location = useLocation();
  const [type, setType] = useState(location.state.type);
  const [userId, setUserId] = useState(location.state.userId);
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMessage, setNewMessage] = useState({
    id: '',
    userId: userId,
    callId: callId,
    type: 'text',
    text: ''
  });
  const [response, setResponse] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();
  const socket = useRef(null);
  useEffect(() => {
    setType(location.state.type);
    socket.current = io(url);
    socket.current.emit("join", { callId, userId });
    socket.current.on("initialMessages", (data) => {
      if (data.messages.length < 10)
        setIsFirstM(true);
      setMessages(data.messages);
      scrollToBottom();
      setManagerId(data.managerId);
      console.log(data.messages);
      
    });

    socket.current.on("groupDeleted", (groupId) => {
      if (groupId == callId) {
        alert("Sorry, this call deleted by the manager")
        goToCalls();
      }
    });

    socket.current.on("uncorrectChat", () => {
      alert("Chat is not valid for this user.");
      const currentPath = window.location.pathname;
      const parts = currentPath.split('/');
      const newPath = `/${parts.slice(1, parts.length - 1).join('/')}`;
      navigate(newPath);
    });

    socket.current.on("newMessage", (message) => {
      if (message.callId == callId) {
        setMessages(prevMessages => [...prevMessages, message]);
        scrollToBottom();
      }
    });

    socket.current.on("messageUpdated", (updatedMessage) => {
      setMessages(prevMessages =>
        prevMessages.map(m =>
          m.id === updatedMessage.id ? { ...m, type: updatedMessage.type, text: updatedMessage.text } : m))
    });

    socket.current.on("messageDeleted", (messageId) => {
      setMessages(prevMessages =>
        prevMessages.map(m =>
          m.id === messageId ? { ...m, active: 0 } : m))
    });

    socket.current.on("loadMoreMessages", (loadedMessages) => {
      if (loadedMessages.messages.length < 10) setIsFirstM(true);
      setMessages(prevMessages => [...loadedMessages.messages, ...prevMessages]);
    });

    socket.current.on("error", (error) => {
      alert("An error occurred:", error.message);
    });
    return () => {
      socket.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (response) {
      setNewMessage((prevState) => ({
        ...prevState,
        replyOn: response.id,
      }));
    }
  }, [response]); 

  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  };

  const loadMoreMessages = () => {
    if (!isFirstM && messages.length > 0) {
      const lastDate = new Date(messages[0].time);
      lastDate.setHours(lastDate.getHours());
      socket.current.emit("loadMoreMessages", { callId, userId, lastDate: lastDate.toISOString() });
    }
  };
  const goToCalls = () => {
    navigate("/calls", { state: { userId } });
  }
  const handleChange = (event) => {
    setNewMessage({
      ...newMessage,
      text: event.target.value
    });
  };

  const handleSend = () => {
    if (newMessage.id) {
      updateMessage();
    } else {
      sendMessage();
    }
  };

  const sendMessage = () => {
    const now = new Date();
    const localDate = new Date(now.setHours(now.getHours()));
    const newM = { ...newMessage, time: format(localDate, 'yyyy-MM-dd HH:mm:ss') };
    console.log("Message being sent:", newM);
    socket.current.emit("sendMessage", newM);
    setNewMessage({
      ...newMessage,
      text: '',
      type: 'text'
    });
    setResponse(null);
  };

  const updateMessage = () => {
    socket.current.emit("updateMessage", newMessage);
    setNewMessage({
      id: '',
      userId: userId,
      callId: callId,
      type: 'text',
      text: ''
    });
  };

  const toggleMenu = (index) => {
    setMenuOpenIndex(menuOpenIndex === index ? null : index);
  };

  const editMessage = (message) => {
    setNewMessage({
      id: message.id,
      userId: userId,
      callId: callId,
      type: message.type,
      text: message.text
    });
    setMenuOpenIndex(null);
  };

const replyToMessage = (message) =>{
setResponse(message);
};

  const deleteMessage = (messageId) => {
    socket.current.emit("deleteMessage", { messageId });
    setMenuOpenIndex(null);
  };

  const handleAddContact = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setPhoneNumber('');
  };

  const handlePhoneNumberChange = (event) => {
    setPhoneNumber(event.target.value);
  };

  const handleAddContactSubmit = () => {
    handleModalClose();
    socket.current.emit("newMember", ({ phoneNumber: phoneNumber, callId: callId }));
  };

  const handleGroupMembers = async () => {
    setIsGroupMembersModalOpen(true);
    try {
      const response = await axios.get(`${url}/members/${callId}`);
      setGroupMembers(response.data);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleGroupMembersModalClose = () => {
    setIsGroupMembersModalOpen(false);
  };

  const handleRemoveMember = async (userId) => {
    socket.current.emit("removeMember", { callId, userId });

  };


  return (
    <div>
      <button onClick={goToCalls}>back</button>
      {type == '2' && userId == managerId && (
        <div className="menu-container">
          <button className="add-contact-menu" onClick={handleAddContact}>
            +
          </button>
          <button className="show-members-button" onClick={handleGroupMembers}>
            ⋮
          </button>

        </div>
      )}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>add member</h2>
            <input
              type="text"
              placeholder="press phone number"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
            />
            <button onClick={handleAddContactSubmit}>add</button>
          </div>
        </div>
      )}
      {isGroupMembersModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleGroupMembersModalClose}>&times;</span>
            <h2>members</h2>
            <ul>
              {groupMembers.map((member) => (
                <li key={member.userId}>
                  <button onClick={() => handleRemoveMember(member.userId)}> remove</button>
                  {member.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <ul className='messages'>
        {isFirstM ? (
          <p style={{ textAlign: 'center', marginTop: '10px', color: 'gray' }}>No more messages</p>
        ) : (
          <button className="load-more-button" onClick={loadMoreMessages}>Load more</button>
        )}
        {(messages || []).map((message, index) => {
          const isMine = message.userId === userId;
          const menuOpen = menuOpenIndex === index;
          const repliedMessage = message.replyOn ? messages.find(m => m.id == message.replyOn) : null;

          return (
            <div key={index} className={isMine ? 'mine' : 'other'} style={{ border: '0.05px solid #ccc', paddingLeft: '8px', paddingRight: '8px', position: 'relative' }}>
              {message.active === 1 ? (
                <>
             {message.replyOn && (
            <div style={{ background: '#e0e0e0', padding: '4px', borderRadius: '4px',marginTop:'8px'}}>
              {repliedMessage ? (
                <p style={{ fontStyle: 'italic', opacity: 0.7 }}>{repliedMessage.text}</p>
              ) : (
                <p style={{ fontStyle: 'italic', opacity: 0.7 }}>Message unavailable</p>
              )}
            </div>
          )}
                  <div style={{ position: 'absolute' }}>
                    <button onClick={() => toggleMenu(index)} style={{ transform: 'rotate(-90deg)', border: 'none', marginLeft: '-6px', marginTop:'3px' }}>&lsaquo;</button>
                    {menuOpen && (
                      <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', top: '20px', right: '25px', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}>
                         <button onClick={() => replyToMessage(message)} style={{ border: 'none' }}>➡️</button>
                        {isMine && (
                          <button onClick={() => editMessage(message)} style={{ border: 'none' }}>✏️</button>)}
                        {(isMine || managerId == userId) && (
                          <button onClick={() => deleteMessage(message.id)} style={{ border: 'none' }}>🗑️</button>)}
                      </div>
                    )}
                  </div>
                  {message.edit === 1 ? (<h6 style={{ opacity: 0.3 }}>edited </h6>) : null}
                  {!isMine && (
                    <h5 style={{ opacity: 0.5 }}>{message.writen}</h5>
                  )}
                  <p className='text'>{message.text} </p>
                  <h6 style={{ opacity: 0.5 }}>{format(addHours(parseISO(message.time), 0), 'HH:mm')}</h6>
                </>
              ) : (
                <p>Message canceled</p>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </ul>
      <div className="chat-box">
      {response && (
  <div style={{ 
    background: '#f0f0f0', 
    padding: '8px', 
    marginBottom: '8px', 
    borderLeft: '4px solid #888', 
    borderRadius: '4px',
    position: 'relative'
  }}>
    <span>{response.text}</span>
    <button 
      onClick={() => setResponse(null)}
      style={{
        position: 'absolute', 
        right: '8px', 
        top: '8px', 
        background: 'transparent', 
        border: 'none', 
        cursor: 'pointer'
      }}
    >
      ❌
    </button>
  </div>
)}
        <textarea
          placeholder="Press a message..."
          value={newMessage.text}
          onChange={handleChange}
        ></textarea>
        <button className="send-button" onClick={handleSend} disabled={!newMessage.text.trim()}>&#10148;</button>
      </div>
    </div>
  );
}

export default Chat;