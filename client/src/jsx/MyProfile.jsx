import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import "../css/MyProfile.css";
import { io } from "socket.io-client";
import { url } from '../config';
import axios from "axios";

const MyProfile = () => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useRef(null);
  const [userId, setUserId] = useState(location.state.userId);
  useEffect(() => {
    if (!location.state || !location.state.userId)
      navigate("/login");
    else
      setUserId(location.state.userId);
    socket.current = io(url);
    axios.get(`${url}/users/${userId}`)
      .then(response => {
        const user = response.data;
        setPhone(user.phone);
        setName(user.name);
        setEmail(user.email);
        setProfilePicture(user.picture);
      })
      .catch(error => {
        alert(error.message ?? error);
      });

    socket.current.on("userUpdated", () => {
      alert("User updated successfully");
    });

    socket.current.on("error", (error) => {
      alert(error);
    });

    return () => {
      socket.current.off("userDetails");
      socket.current.off("userUpdated");
      socket.current.off("error");
    };
  }, []);

  const handleSave = () => {
    if (name == "" && email == "")
      alert("first insert email and name");
    else if (name == "")
      alert("first insert name");
    else if (email == "")
      alert("first insert email");
    else
      socket.current.emit("updateDetails", { id: userId, name, phone, email });
  };

  const handleCalls = async () => {
    navigate("/calls", { state: { userId } });
  };
  return (
    <div className="profile-container">
      <button className="btnCalls" onClick={handleCalls}>my calls</button>
      <h1>My Profile</h1>
      {profilePicture ? (
        <img src={`${url}${profilePicture}`} className="details-pic" alt="Profile" />

      ) : (
        <p>Loading profile picture...</p>
      )}
      <div>
        <h2> phone number: {phone}</h2>
      </div>
      <div className="profile-info">
        <label>Email: </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="profile-info">
        <label>Name: </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button className="btn_save" onClick={handleSave}>Save</button>
    </div>
  );
};
export default MyProfile;
