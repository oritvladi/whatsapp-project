import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import '../css/Calls.css';
import { io } from "socket.io-client";
import AddGroup from "./AddGroup";
import AddContact from "./AddContact";
import { url } from '../config';
import axios from "axios";
import EditContactModal from "./EditContactModal";
const Calls = () => {
  const [calls, setCalls] = useState([]);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFirstC, setIsFirstC] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useRef(null);
  const [userId, setUserId] = useState();
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleClick = (id, type) => {
    navigate(`${location.pathname}/${id}`, { state: { type, userId } });
  };

  useEffect(() => {
    if (!location.state || !location.state.userId)
      navigate("/login");
    else
      setUserId(location.state.userId);
    socket.current = io(url);
    socket.current.on("loadMoreCalls", (moreCalls) => {
      if (moreCalls.length < 10) setIsFirstC(true);
      setCalls(prevCalls => [...prevCalls, ...moreCalls]);
    });

    socket.current.on("error", (error) => {
      alert("Error fetching private calls:", error);
    });

    socket.current.on("addedMember", (memberId, call) => {
      if (userId == memberId) {
        setCalls(prevCalls => [call, ...prevCalls]);
      }
    });

    socket.current.on("deletedMember", (memberId, callId) => {
      if (userId == memberId) {
        setCalls(prevCalls => prevCalls.filter(call => !(call.id == callId)));
      }
    });

    socket.current.on("groupDeleted", (groupId) => {
      setCalls((prevCalls) => prevCalls.filter(call => call.id != groupId));
    });
    
    socket.current.on("newCallAdded", (call) => {
      if (userId == call.userId2) {
        axios.get(`${url}/calls/${userId}/${call.Id}`)
        .then(response => {setCalls(prevCalls => [response.data, ...prevCalls])
          console.log(response.data);
        }).catch(error=>{alert(error.message?? "Fail to load new call")})
      }
    });
    
    socket.current.emit("loadMoreCalls", { userId: userId });
    return () => socket.current.disconnect();
  }, [location.state, navigate, userId]);

  const handleAddClick = () => {
    setShowAddOptions(prevState => !prevState);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const loadMoreCalls = () => {
    if (!isFirstC && calls.length > 0)
      socket.current.emit("loadMoreCalls", { userId: userId, lastCall: calls[calls.length - 1].id });
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const renderProfileOrInitial = (call) => {
    if (call.profilePicture) {
      return (
        <img src={`${url}/${call.profilePicture}`} className="profile-pic" alt={`${call.alias}'s profile`} />
      );
    } else {
      return (
        <div className="profile-pic-default" style={{ backgroundColor: getRandomColor() }}>
          <span>{call.alias[0]}</span>
        </div>
      );
    }
  };

  const filteredCalls = calls.filter(call =>
    call.alias.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    navigate("/login");
  };

  const handleEditProfile = () => {
    navigate("/myProfile", { state: { userId } });
  };

  const miniProfile = async () => {
    setShowProfileSidebar(true);
    axios.get(`${url}/users/${userId}/pic`)
      .then(response => {
        setImageUrl(response.data);
      })
      .catch(error => {
        setImageUrl(null);
      });
  };

  const updateContactName = (id, newName, userId) => {
    setCalls(prevCalls =>
      prevCalls.map(call =>
        call.id === id ? { ...call, alias: newName, userId: userId } : call
      )
    );
  };

  const handleEditClick = (contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  return (
    <div className="calls-container">
      <div className="calls-header">
        <div
          className="profile-placeholder"
          onClick={() => miniProfile()}
        >
          ⋮
        </div>
        <div className="add-call-container">
          <button onClick={handleAddClick} className="add-call-button">Add Call</button>
          {showAddOptions && (
            <div className="add-options">
              <button
                className="add-option-button"
                onClick={() => {
                  setShowAddContact(true);
                }}
              >
                Add Contact
              </button>
              <button
                className="add-option-button"
                onClick={() => {
                  setShowAddGroupModal(true);
                }}
              >
                Add Group
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="search by alias"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <ul className="calls-list">
        {filteredCalls.length > 0 ? (
          filteredCalls.map(call => (
            <li
              key={call.id}
              className="call-box"
              onClick={() => handleClick(call.id, call.type)}
            >
              {renderProfileOrInitial(call)}
              <div className="call-info">
                <h3 className="call-user">{call.alias}</h3>
                <p className="call-alias">{call.last_message}</p>
                {(call.type === 1 || call.type == 2 && userId == 1) && (
                  <button
                    className="optionsToAllCalls"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(call);
                    }}
                  >

                    ⋮
                  </button>
                )}    
               </div>
            </li>
          ))
        ) : (
          !isFirstC&&<p> loading calls...</p>
        )}
      </ul>
      {isFirstC ? (
        <p style={{ textAlign: 'center', marginTop: '10px', color: 'gray' }}>No more calls</p>
      ) : (
        <button onClick={loadMoreCalls} className="load-more-button">Load more</button>
      )}
      <Outlet />
      <AddGroup show={showAddGroupModal} 
      onClose={(newC = null) => {
        setShowAddGroupModal(false); 
        newC && newC.userId1==userId &&setCalls(prevCalls => [newC, ...prevCalls])
      }} userId={userId} />
      <AddContact show={showAddContact} onClose={(newC = null) => {
        setShowAddContact(false); 
        newC &&(newC.userId1==userId || newC.userId2==userId )&& setCalls(prevCalls => [newC, ...prevCalls])
      }} userId={userId} />
      {showProfileSidebar && (
        <div className="profile-sidebar">
          <button className="close-sidebar" onClick={() => setShowProfileSidebar(false)}>×</button>
          <img src={`${url}${imageUrl}`} className="profile-pic-sidebar" alt={`${userId}'s profile`} />
          <button onClick={handleEditProfile}>edit</button>
          <button onClick={handleLogout}>exit</button>
        </div>
      )}
      {showEditModal && (
        <EditContactModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          contact={selectedContact}
          updateContactName={updateContactName}
          inDelete={(deletedId) => {
            setCalls((prevCalls) => prevCalls.filter(call => call.id !== deletedId));
          }}
                  />
      )}
    </div>
  );
};

export default Calls;
