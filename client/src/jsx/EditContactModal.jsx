import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import {url} from "../config"; 
import '../css/EditContactModal.css';

const EditContactModal = ({ show, onClose, contact, updateContactName, inDelete }) => {
    const [newName, setNewName] = useState(contact.alias);
    const socket = useRef(null);

    useEffect(() => {
        socket.current = io(url);
        if (contact.type === 1) {
            socket.current.on("contactUpdated", () => {
                updateContactName(contact.id, newName, contact.userId1);
                onClose();
            });

            socket.current.on("error", (error) => {
                alert(error);
            });

            return () => {
                socket.current.off("contactUpdated");
                socket.current.off("error");
            };
        } else if (contact.type === 2) {
            socket.current.on("updatedNameGroup", () => {
                updateContactName(contact.id, newName);
                onClose();
            });

            socket.current.on("error", (error) => {
                alert(error);
            });

            return () => {
                socket.current.off("updatedNameGroup");
                socket.current.off("error");
            };
        }
    }, [contact, newName, onClose, updateContactName]);

    const handleSave = () => {
        if (newName === "") {
            alert("Please enter a name");
        } else {
            if (contact.type === 1) {
                socket.current.emit("updateContact", { userId2: contact.userId2, name: newName, userId1: contact.userId1 });
            } else if (contact.type === 2) {
                socket.current.emit("updateGroup", { callId: contact.id, alias: newName });
            }
        }
    };

    const deleteGroup = () => {
        socket.current.emit("deleteGroup", (contact.id));
        socket.current.on("groupDeleted", (groupId) => {
            inDelete(groupId);
            alert("Group deleted successfully");
            onClose();
        });
    };
    if (!show) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Edit Contact</h2>
                <label>
                    Name:
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </label>
                <div>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose}>Cancel</button>
                    {contact.type == 2 && <button onClick={deleteGroup}>Delete</button>}

                </div>
            </div>
        </div>
    );
};

export default EditContactModal;