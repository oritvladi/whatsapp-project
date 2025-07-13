// import { fileURLToPath } from 'url';
// import { PORT } from './config.js';
// import path from 'path';
// import express from 'express';
// import { Server } from "socket.io";
// import http from 'http';
// import users from './index/users.js';
// import members from './index/members.js';
// import cors from 'cors';
// import calls from './index/calls.js';
// import { getAllMessages, postMessage, getType, updateTextMessage, deleteMessage } from './database/messagesDB.js';
// import { getAllDetailsOfCall, getManagerByCall } from './database/callsDB.js';
// import { getAllCalls, postCall, postGroup, deleteCall, updateNameCall, isCall } from './database/callsDB.js';
// import { updateUser, getUserByPhone } from './database/usersDB.js';
// import { deletemember, postMember } from './database/membersDB.js';
// import { updateName } from './database/namesDB.js';
// import { uploadMessageFile } from './middleware/multer.js';

// const app = express();

// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'userid'],  
// }));

// app.use(express.json());

// app.use('/calls', calls);
// app.use('/users', users);
// app.use('/members', members);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
// app.use('/uploads/group-profiles', express.static(path.join(__dirname, 'uploads', 'group-profiles')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.post('/upload', uploadMessageFile.single('file'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file uploaded' });
//   }

//   const relativePath = path.relative(path.join(__dirname, 'uploads'), req.file.path);
//   const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

//   res.json({ fileUrl });
// });

// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:5173",
//     methods: ["GET", "POST"]
//   }
// });

// io.on('connection', (socket) => {
//   console.log('a user connected');

//   socket.on("join", async ({ callId, userId }) => {
//     try {
//       const callExists = await isCall(userId, callId);
//       if (!callExists) {
//         socket.emit("uncorrectChat");
//       } else {
//         const managerId = await getManagerByCall(callId);
//         const messages = await getAllMessages(callId, userId);
//         (messages);
//         socket.emit("initialMessages", { messages, managerId });
//       }
//     } catch (error) {
//       console.error('Error checking call or fetching messages:', error);
//       socket.emit("error", { message: "An error occurred while joining the chat." });
//     }
//   });

//   socket.on("sendMessage", async (message) => {
//     if (!Number.isInteger(Number(message.type)))
//       message.type = await getType(message.type);

//     const recordM = await postMessage(message);
//     io.emit("newMessage", recordM);
//   });

//   socket.on("updateMessage", async (message) => {
//     if (message.type != 1 && message.type != 2)
//       message.type = await getType(message.type);
//     await updateTextMessage(message.id, message.type, message.text);
//     io.emit("messageUpdated", message);
//   });

//   socket.on("updateDetails", async (user) => {
//     try {
//       await updateUser(user);
//       socket.emit("userUpdated");
//     }
//     catch (error) {
//       socket.emit('error', error.message);
//     }
//   });

//   socket.on("deleteMessage", async ({ messageId }) => {
//     await deleteMessage(messageId);
//     io.emit("messageDeleted", messageId);
//   });

//   socket.on("loadMoreMessages", async ({ callId, userId, lastId }) => {
//     const messages = await getAllMessages(callId, userId, lastId);
//     socket.emit("loadMoreMessages", { messages });
//   });

//   socket.on('loadMoreCalls', async ({ userId, lastCall = null }) => {
//     try {
//       const calls = await getAllCalls(userId, lastCall);
//       calls.forEach(call => {
//         if (call.type == 1) {
//           const userIdPic = call.userId1 + call.userId2 - userId;
//           call.profilePicture = `uploads/profiles/${userIdPic}.jpg`;
//         } else if (call.type == 2) {
//           call.profilePicture = `uploads/group-profiles/${call.id}.jpg`;
//         }
//       });
//       socket.emit('loadMoreCalls', calls);
//     } catch (error) {
//       socket.emit('error', error.message);
//     }
//   });

//   socket.on("newCall", async (call) => {
//     try {
//       let newC;
//       if (call.type == 1) {
//         newC = await postCall(call);
//         const userIdPic = newC.userId2;
//         newC.profilePicture = `uploads/profiles/${userIdPic}.jpg`;
//       }

//       if (call.type == 2) {
//         newC = await postGroup(call);
//         newC.profilePicture = `uploads/group-profiles/${newC.id}.jpg`;
//       }

//       io.emit("newCallAdded", newC);
//     }
//     catch (error) {
//       socket.emit('error', error);
//     }
//   });

//   socket.on('login', async (phone) => {
//     try {
//       const userId = await getUserByPhone(phone);
//       if (!userId)
//         socket.emit('error', error.message);
//       else
//         socket.emit("connected", userId.id);
//     } catch (error) {
//       socket.emit('error', error.message);
//     }
//   });

//   socket.on('newMember', async ({ phoneNumber, callId }) => {
//     try {
//       const userId = await getUserByPhone(phoneNumber);
//       const call = await getAllDetailsOfCall(callId, userId);
//       if (call.userId1 != userId.id) {
//         await postMember(userId.id, callId);
//         io.emit('addedMember', (userId.id, call));
//       }
//       else throw new Error("You can't insert yourself as a member");
//     }
//     catch (error) { socket.emit('error', error.message); }
//   })

//   socket.on('removeMember', async ({ callId, userId }) => {
//     try {
//       deletemember(userId, callId);
//       io.emit('deletedMember', (userId, callId));
//     } catch (error) { socket.emit('error',) }
//   })

//   socket.on('disconnect', () => {
//     ('user disconnected');
//   });

//   socket.on("updateContact", async (contact) => {
//     try {
//       (contact.name, contact.userId1, contact.userId2);
//       await updateName(contact.userId1, contact.userId2, contact.name);
//       socket.emit("contactUpdated", contact);
//     } catch (error) {
//       socket.emit('error', error.message);
//     }
//   });

//   socket.on("updateGroup", async (contact) => {
//     try {
//       (contact.callId);
//       await updateNameCall(contact.alias, contact.callId);
//       io.emit("updatedNameGroup", contact);
//     } catch (error) {
//       socket.emit('error', error.message);
//     }
//   });

//   socket.on("deleteGroup", async (groupId) => {
//     try {
//       await deleteCall(groupId);
//       io.emit("groupDeleted", groupId);
//     } catch (error) {
//       socket.emit('error', error.message);
//     }
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });






import app from './app.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PORT } from './config.js';
import setupSocket from './socket.js';

const server = createServer(app);
setupSocket(server);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



