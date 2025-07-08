import React from 'react'
import ReactDOM from 'react-dom/client'
import '../css/App.css';
import App from './App';
import Chat from './Chat';
import Calls from './Calls';
import { BrowserRouter } from 'react-router-dom'
import Register from './Register';
import { BrowserRouter as Router } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </React.StrictMode>,
)
