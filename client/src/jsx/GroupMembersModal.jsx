import React, { useState, useEffect } from "react";
import axios from "axios";
import { url } from "../config";

const GroupMembersModal = ({
    isOpen,
    onClose,
    callId,
    userId,
    isManager,
    socket,
}) => {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [error, setError] = useState("");

    const fetchMembers = async () => {
        try {
            const response = await axios.get(`${url}/members/${callId}`, {
                headers: {
                    'userId': userId
                }
            });
            setMembers(response.data);
        } catch (err) {
            setError("Failed to fetch members");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
            setSearch("");
            setPhoneNumber("");
            setError("");
        }

    }, [isOpen]);

    const handleAddMember = () => {
        if (!phoneNumber.trim()) return;
        socket.current.emit("newMember", { phoneNumber, callId });
        setPhoneNumber("");
        setTimeout(fetchMembers, 500);
    };

    const handleRemoveMember = (memberId) => {
        socket.current.emit("removeMember", { callId, userId: memberId });
        setTimeout(fetchMembers, 500);
    };

    const filteredMembers = members.filter((m) =>
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search)
    );

    if (!isOpen) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <h2>Group Members</h2>
                <input
                    type="text"
                    placeholder="Search by name or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: 8, width: "100%" }}
                />
                <ul>
                    {filteredMembers.map((member) => (
                        <li key={member.userId}>
                            {member.name} {member.phone && <span>({member.phone})</span>}
                            {isManager && member.userId !== userId && (
                                <button
                                    style={{ marginRight: 8, marginLeft: 8 }}
                                    onClick={() => handleRemoveMember(member.userId)}
                                >
                                    remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
                {isManager && (
                    <div style={{ marginTop: 16 }}>
                        <h4>Add Member</h4>
                        <input
                            type="text"
                            placeholder="Phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            style={{ marginRight: 8 }}
                        />
                        <button onClick={handleAddMember}>add</button>
                    </div>
                )}
                {error && <div style={{ color: "red" }}>{error}</div>}
            </div>
        </div>
    );
};

export default GroupMembersModal;