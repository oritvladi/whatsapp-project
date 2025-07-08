import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import '../css/AddGroup.css';
import { url } from '../config';

const AddContact = ({ show, onClose, userId }) => {
    const socket = useRef(null);
    const [contact, setContact] = useState({
        userId1: "",
        name: "",
        phoneNumber: "",
        type: 1
    });

    useEffect(() => {
        if (show) {
            socket.current = io(url);
            socket.current.on("newCallAdded", (newContact) => {
                if (newContact.userId1 == userId) {
                    alert(`YAY new contact successfully added: ${newContact.alias}`);
                    resetContact();
                }
                onClose(newContact);
            });

            socket.current.on("error", (error) => {
                alert(error);
            });
            return () => socket.current.disconnect();
        }
    }, [show, onClose]);

    useEffect(() => {
        setContact((prevContact) => ({
            ...prevContact,
            userId1: userId
        }));
    }, [userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setContact(prevContact => ({
            ...prevContact,
            [name]: value,
        }));
    };

    const resetContact = () => {
        setContact({
            userId1: userId,
            name: "",
            phoneNumber: "",
            type: 1
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contact.phoneNumber) {
            alert("Please insert phone number");
        } else {
            socket.current.emit("newCall", contact);
        }
    };

    return (
        <>
            {show && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>new call</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                placeholder="שם"
                                value={contact.name}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                            <input
                                type="text"
                                name="phoneNumber"
                                placeholder="מספר טלפון"
                                value={contact.phoneNumber}
                                onChange={handleChange}
                                className="input-field"
                                required
                            />
                            <div className="modal-buttons">
                                <button type="submit"> add </button>
                                <button type="button" onClick={() => { onClose(null); resetContact(); }}>x</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddContact;
