import React, { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import '../css/AddGroup.css';
import { url } from '../config';

const AddGroup = ({ show, onClose, userId }) => {
    const socket = useRef(null);
    const [group, setGroup] = useState({
        name: "",
        userId1: '',
        type: 2,
    });

    useEffect(() => {
        if (show) {
            socket.current = io(url);
            socket.current.on("newCallAdded", (newGroup) => {
                if (newGroup.userId1 == userId) {
                    alert(`YAY new group successfully added: ${newGroup.alias}`);
                    onClose(newGroup);
                }
            });

            socket.current.on("error", (error) => {
                alert(error);
            });
            return () => socket.current.disconnect();
        }
    }, [show, onClose]);

    useEffect(() => {
        setGroup((prevGroup) => ({
            ...prevGroup,
            userId1: userId
        }));
    }, [userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGroup({
            ...group,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!group.name) {
            alert("Please insert group name");
        } else {
            socket.current.emit("newCall", group);
        }
    };

    return (<>
        {show && (
            <div className="modal-overlay">
                <div className="modal">
                    <h2>קבוצה חדשה</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="name"
                            placeholder="שם קבוצה"
                            value={group.name}
                            onChange={handleChange}
                            className="input-field"
                            required
                        />
                        <div className="modal-buttons">
                            <button type="submit">הוסף קבוצה</button>
                            <button type="button" onClick={() => {
                                onClose(null);
                                setGroup({ ...group, name: "", });
                            }}>ביטול</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </>
    );
};

export default AddGroup;
