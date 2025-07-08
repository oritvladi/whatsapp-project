import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './Register';
import Calls from './Calls';
import MyProfile from './MyProfile';
import Chat from './Chat';
import Login from './Login';
import AddContact from './AddContact';

function App() {
  const userId = 1;

  return (
    <Routes>
      <Route path="/calls/:callId" element={<Chat userId={userId} />} />
      <Route path="/calls" element={<Calls />} />
      <Route path="/login" element={<Login />} />
      <Route path="/myProfile" element={<MyProfile />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;
