import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import '../css/Login.css';
import { url } from '../config';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useRef(null);

    useEffect(() => {
        socket.current = io(url);
        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, []);

    const handleLogin = async () => {
        if (phone == '' || phone.length != 10) alert("Wrong number!");
        else {
            socket.current.emit("login", phone);
            socket.current.on("connected", (userId) => {
                navigate("/calls", { state: { userId } });
            });
            socket.current.on("error", (error) => {
                alert("Can't find this phone number");
            });
        }
    };

    const handleRegister = async () => {
        navigate("/register");
    };

    return (
        <div className="page-container">
            <div className="login-container">
                {/* <h2>Login</h2> */}
                {error && <p className="error">{error}</p>}
                <label>
                    your phone numbere:
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <button className="btn_insert" onClick={handleLogin}>login</button>
                <button className="btn_insert" onClick={handleRegister}>to register</button>
            </div>        </div>

    );
};

export default Login;
