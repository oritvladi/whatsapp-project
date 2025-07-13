import { Server } from 'socket.io';
import {
    getAllMessages, postMessage, getType, updateTextMessage, deleteMessage
} from './database/messagesDB.js';
import {
    getAllDetailsOfCall, getManagerByCall, getAllCalls,
    postCall, postGroup, deleteCall, updateNameCall, isCall
} from './database/callsDB.js';
import { updateUser, getUserByPhone } from './database/usersDB.js';
import { deletemember, postMember } from './database/membersDB.js';
import { updateName } from './database/namesDB.js';

export default function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on("join", async ({ callId, userId }) => {
            try {
                const callExists = await isCall(userId, callId);
                if (!callExists) return socket.emit("uncorrectChat");
                const managerId = await getManagerByCall(callId);
                const messages = await getAllMessages(callId, userId);
                socket.emit("initialMessages", { messages, managerId });
            } catch (error) {
                socket.emit("error", { message: "An error occurred while joining the chat." });
            }
        });

        socket.on("sendMessage", async (message) => {
            if (!Number.isInteger(Number(message.type)))
                message.type = await getType(message.type);
            const recordM = await postMessage(message);
            io.emit("newMessage", recordM);
        });

        socket.on("updateMessage", async (message) => {
            if (![1, 2].includes(message.type))
                message.type = await getType(message.type);
            await updateTextMessage(message.id, message.type, message.text);
            io.emit("messageUpdated", message);
        });

        socket.on("updateDetails", async (user) => {
            try {
                await updateUser(user);
                socket.emit("userUpdated");
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on("deleteMessage", async ({ messageId }) => {
            await deleteMessage(messageId);
            io.emit("messageDeleted", messageId);
        });

        socket.on("loadMoreMessages", async ({ callId, userId, lastId }) => {
            const messages = await getAllMessages(callId, userId, lastId);
            socket.emit("loadMoreMessages", { messages });
        });

        socket.on('loadMoreCalls', async ({ userId, lastCall = null }) => {
            try {
                const calls = await getAllCalls(userId, lastCall);
                calls.forEach(call => {
                    if (call.type == 1) {
                        const userIdPic = call.userId1 + call.userId2 - userId;
                        call.profilePicture = `uploads/profiles/${userIdPic}.jpg`;
                    } else if (call.type == 2) {
                        call.profilePicture = `uploads/group-profiles/${call.id}.jpg`;
                    }
                });
                socket.emit('loadMoreCalls', calls);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on("newCall", async (call) => {
            try {
                let newC = (call.type == 1)
                    ? await postCall(call)
                    : await postGroup(call);
                newC.profilePicture = call.type == 1
                    ? `uploads/profiles/${newC.userId2}.jpg`
                    : `uploads/group-profiles/${newC.id}.jpg`;
                io.emit("newCallAdded", newC);
            } catch (error) {
                socket.emit('error', error);
            }
        });

        socket.on('login', async (phone) => {
            try {
                const userId = await getUserByPhone(phone);
                if (!userId) socket.emit('error', 'User not found');
                else socket.emit("connected", userId.id);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on('newMember', async ({ phoneNumber, callId }) => {
            try {
                const userId = await getUserByPhone(phoneNumber);
                const call = await getAllDetailsOfCall(callId, userId);
                if (call.userId1 !== userId.id) {
                    await postMember(userId.id, callId);
                    io.emit('addedMember', { userId: userId.id, call });
                } else throw new Error("You can't insert yourself as a member");
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on('removeMember', async ({ callId, userId }) => {
            try {
                await deletemember(userId, callId);
                io.emit('deletedMember', { userId, callId });
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on("updateContact", async (contact) => {
            try {
                await updateName(contact.userId1, contact.userId2, contact.name);
                socket.emit("contactUpdated", contact);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on("updateGroup", async (contact) => {
            try {
                await updateNameCall(contact.alias, contact.callId);
                io.emit("updatedNameGroup", contact);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on("deleteGroup", async (groupId) => {
            try {
                await deleteCall(groupId);
                io.emit("groupDeleted", groupId);
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}
