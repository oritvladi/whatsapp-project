import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { Server } from "socket.io";
import http from 'http';
import users from './index/users.js'
import members from './index/members.js'
import cors from 'cors';
import calls from './index/calls.js'
import { getAllMessages, postMessage, getType, updateTextMessage, deleteMessage } from './database/messagesDB.js';
import { getAllDetailsOfCall, getManagerByCall } from './database/callsDB.js';
import { getAllCalls, postCall, postGroup, deleteCall, updateNameCall, isCall } from './database/callsDB.js';
import { updateUser, getUserByPhone } from './database/usersDB.js';
import { deletemember, postMember } from './database/membersDB.js';
import { updateName } from './database/namesDB.js';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// הגדרת נתיב סטטי לתמונות הפרופילים
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
app.use('/uploads/Gprofiles', express.static(path.join(__dirname, 'uploads', 'Gprofiles')));

app.use(cors());
app.use(express.json());
app.use('/calls', calls);
app.use('/users', users);
app.use('/members', members);

io.on('connection', (socket) => {
  ('a user connected');

  socket.on("join", async ({ callId, userId }) => {
    try {
      const callExists = await isCall(userId, callId);
      if (!callExists) {
        socket.emit("uncorrectChat");
      } else {
        const managerId = await getManagerByCall(callId);
        const messages = await getAllMessages(callId, userId);
        (messages);
        socket.emit("initialMessages", { messages, managerId });
      }
    } catch (error) {
      console.error('Error checking call or fetching messages:', error);
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
    if (message.type != 1 && message.type != 2)
      message.type = await getType(message.type);
    await updateTextMessage(message.id, message.type, message.text);
    io.emit("messageUpdated", message);
  });

  socket.on("updateDetails", async (user) => {
    try {
      await updateUser(user);
      socket.emit("userUpdated");
    }
    catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on("deleteMessage", async ({ messageId }) => {
    await deleteMessage(messageId);
    io.emit("messageDeleted", messageId);
  });

  socket.on("loadMoreMessages", async ({ callId, userId, lastDate }) => {
    const messages = await getAllMessages(callId, userId, lastDate);
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
          call.profilePicture = `uploads/Gprofiles/${call.id}.jpg`;
        }
      });
      socket.emit('loadMoreCalls', calls);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on("newCall", async (call) => {
    try {
      let newC;
      if (call.type == 1) {
        newC = await postCall(call);
        const userIdPic = newC.userId2;
        newC.profilePicture = `uploads/profiles/${userIdPic}.jpg`;
      }

      if (call.type == 2) {
        newC = await postGroup(call);
        newC.profilePicture = `uploads/Gprofiles/${newC.id}.jpg`;
      }(newC);

      io.emit("newCallAdded", newC);
    }
    catch (error) {
      socket.emit('error', error);
    }
  });

  socket.on('login', async (phone) => {
    try {
      const userId = await getUserByPhone(phone);
      if (!userId)
        socket.emit('error', error.message);
      else
        socket.emit("connected", userId.id);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on('newMember', async ({ phoneNumber, callId }) => {  
    try {
      const userId = await getUserByPhone(phoneNumber);
      const call = await getAllDetailsOfCall(callId,userId);
      if (call.userId1 != userId.id) {
        await postMember(userId.id, callId);
        io.emit('addedMember', (userId.id, call));
      }
      else throw new Error("You can't insert yourself as a member");
    }
    catch (error) { socket.emit('error', error.message); }
  })

  socket.on('removeMember', async ({ callId, userId }) => {
    try {
      deletemember(userId, callId);
      io.emit('deletedMember', (userId, callId));
    } catch (error) { socket.emit('error',) }
  })

  socket.on('disconnect', () => {
    ('user disconnected');
  });

  socket.on("updateContact", async (contact) => {
    try {
      (contact.name, contact.userId1, contact.userId2);
      await updateName(contact.userId1, contact.userId2, contact.name);
      socket.emit("contactUpdated", contact);
    } catch (error) {
      socket.emit('error', error.message);
    }
  });

  socket.on("updateGroup", async (contact) => {
    try {
      (contact.callId);
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
});

server.listen(8080, () => {
  ("Server listening on port 8080");
});
















