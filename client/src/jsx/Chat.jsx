import '../css/OpenChat.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from "socket.io-client";
import { url } from '../config';
import { parseISO, addHours, format } from 'date-fns';
import GroupMembersModal from "./GroupMembersModal";
import axios from 'axios';

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
  const [chatName, setChatName] = useState(location.state?.alias || 'Chat');
  const [newMessage, setNewMessage] = useState({
    id: '',
    userId: userId,
    callId: callId,
    type: 'text',
    text: ''
  });
  const [newMessageFile, setNewMessageFile] = useState(null);
  const [response, setResponse] = useState(null);
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
          m.id === updatedMessage.id ? { ...m, type: updatedMessage.type, text: updatedMessage.text, edit: 1 } : m))
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
        replyOn: {
          id: response.id,
          text: response.text,
        }
      }
      ));
    }
    else {
      setNewMessage(({ replyOn, ...rest }) => rest);
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
      console.log(messages);

      socket.current.emit("loadMoreMessages", { callId, userId, lastId: messages[0].id });
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

  function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'document';
  }

  const sendMessage = async () => {
    const now = new Date();
    const time = format(now, 'yyyy-MM-dd HH:mm:ss');

    if (newMessageFile) {
      const formData = new FormData();
      formData.append('file', newMessageFile);

      try {
        const uploadRes = await axios.post(`${url}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const fileUrl = uploadRes.data.fileUrl;

        const messageToSend = {
          userId,
          callId,
          time,
          type: getFileType(newMessageFile.type),
          text: fileUrl,
          replyOn: response ? { id: response.id, text: response.text } : undefined,
        };

        socket.current.emit("sendMessage", messageToSend);
      } catch (error) {
        console.error('Upload failed', error);
      }

    } else {
      const messageToSend = {
        userId,
        callId,
        time,
        type: 'text',
        text: newMessage.text,
        replyOn: response ? { id: response.id, text: response.text } : undefined,
      };
      socket.current.emit("sendMessage", messageToSend);
    }

    setNewMessage({ ...newMessage, text: '', type: 'text' });
    setNewMessageFile(null);
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

  const replyToMessage = (message) => {
    setResponse(message);
  };

  const deleteMessage = (messageId) => {
    socket.current.emit("deleteMessage", { messageId });
    setMenuOpenIndex(null);
  };

  return (
    <div>
      <button onClick={goToCalls}>back</button>
      {type == '2' && (
        <button onClick={() => setIsGroupMembersModalOpen(true)}>
          משתתפים
        </button>
      )}

      <GroupMembersModal
        isOpen={isGroupMembersModalOpen}
        onClose={() => setIsGroupMembersModalOpen(false)}
        callId={callId}
        userId={userId}
        isManager={userId === managerId}
        socket={socket}
      />

      <ul className='messages'>
        {isFirstM ? (
          <p style={{ textAlign: 'center', marginTop: '10px', color: 'gray' }}>No more messages</p>
        ) : (
          <button className="load-more-button" onClick={loadMoreMessages}>Load more</button>
        )}
        {(messages || []).map((message, index) => {
          const isMine = message.userId === userId;
          const menuOpen = menuOpenIndex === index;
          const messageDate = format(parseISO(message.time), 'yyyy-MM-dd');
          const prevMessageDate = index > 0 ? format(parseISO(messages[index - 1].time), 'yyyy-MM-dd') : null;
          const todayDate = format(new Date(), 'yyyy-MM-dd');
          const showDateSeparator = index === 0 || messageDate !== prevMessageDate;
          return (
            <React.Fragment key={index}>
              {showDateSeparator && (
                <div className="date-separator" style={{
                  textAlign: 'center',
                  margin: '16px 0',
                  color: '#888',
                  fontWeight: 'bold'
                }}>
                  {messageDate === todayDate
                    ? 'Today'
                    : messageDate === format(addHours(new Date(), -24), 'yyyy-MM-dd')
                      ? 'Yesterday'
                      : format(parseISO(message.time), 'dd MMMM yyyy')}
                </div>
              )}
              <div key={index} className={isMine ? 'mine' : 'other'} style={{ border: '0.05px solid #ccc', paddingLeft: '8px', paddingRight: '8px', position: 'relative' }}>               
                {message.active === 1 ? (
                  <>
                    {message.replyOn && (
                      <div style={{ background: '#e0e0e0', padding: '4px', borderRadius: '4px', marginTop: '8px' }}>
                        <p style={{ fontStyle: 'italic', opacity: 0.7 }}>{message.replyOn.text}</p>
                      </div>
                    )}
                    <div style={{ position: 'absolute' }}>
                      <button onClick={() => toggleMenu(index)} style={{ transform: 'rotate(-90deg)', border: 'none', marginLeft: '-6px', marginTop: '3px' }}>&lsaquo;</button>
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

                    {message.type === 1 && (
                      <p className='text'>{message.text}</p>
                    )}
                    {message.type === 3 && (
                      <img alt="uploaded" src={`${url}${message.text}`} style={{ maxWidth: '300px' }} />
                    )}
                    {message.type === 2 && (
                      <audio controls src={`${url}${message.text}`} />
                    )}
                    {message.type === 4 && (
                      <video controls style={{ maxWidth: '300px' }}>
                        <source src={`${url}${message.text}`} type="video/mp4" />
                        הדפדפן שלך לא תומך בניגון וידאו.
                      </video>
                    )}
                    {message.type === 5 && (
                      <iframe
                        src={`${url}${message.text}`}
                        width="100%"
                        height="500px"
                        title="PDF"
                      ></iframe>)}

                    <h6 style={{ opacity: 0.5 }}>{format(addHours(parseISO(message.time), 0), 'HH:mm')}</h6>
                  </>
                ) : (
                  <p>Message canceled</p>
                )}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </ul>
      <div className="chat-box">
        {response && (
          <div className="reply-preview">
            <button
              onClick={() => setResponse(null)}
              className="reply-close"
              aria-label="Close reply"
            >
              ❌
            </button>
            <span className="reply-label"></span>
            <span style={{ marginRight: 8 }}>{response.text}</span>
          </div>
        )}
        <div className="input-row">
          <textarea
            placeholder="Press a message..."
            value={newMessage.text}
            onChange={handleChange}
          ></textarea>
          <input type="file" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" onChange={(e) => setNewMessageFile(e.target.files[0])} />
          <button className="send-button" onClick={handleSend} disabled={!newMessage.text.trim() && !newMessageFile}>&#10148;</button>
        </div>
      </div>
    </div >
  );
}

export default Chat;