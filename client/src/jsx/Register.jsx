import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import axios from 'axios';
import '../css/Register.css';
import { url } from '../config';

const Register = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    navigate("/login");
};

const goToCalls = (id) => {
  navigate("/calls", { state: { userId: id  } });
};
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phoneNumber || !userName || !email) {
      setMessage('First insert all fields');
      return;
    }

    const data = new FormData();
    data.append('img', file);
    data.append('name', userName);
    data.append('email', email);
    data.append('phone', phoneNumber);

    axios.post(`${url}/users`, {
      name: userName,
      email: email,
      phone: phoneNumber
    }).then(response => {
      const userId = response.data.userId;
      setUserId(response.data.userId);
      const formData = new FormData();
      formData.append('img', file);
      return axios.post(`${url}/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }).then((response) => {
      setMessage("User register succusfully");
      goToCalls(userId);
    }).catch(error => {
      setMessage('Error in sign!');
    });
  }

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="phone">phone number:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="userName">name:</label>
          <input
            type="text"
            id="userName"
            name="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {message && <p className="message">{message}</p>}
        <label>profile picture</label>
        <input type="file" onChange={(eventt) => setFile(eventt.target.files[0])} />
        <button className="btn_insert" type="submit">register</button>
        <button className="btn_insert" onClick={handleLogin}>sign already?</button>
      </form>
    </div>
  );
};

export default Register;