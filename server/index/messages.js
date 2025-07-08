import { getAllMessages, postMessage, getType, updateTextMessage, deleteMessage } from '../database/messagesDB.js'
import { getManagerByCall } from '../database/callsDB.js'
import express from "express";
const route = express.Router();

//getAllMessages
route.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        const callId = req.query.callId;
        const lastDate = req.query.lastDate;
        const managerId = await getManagerByCall(callId);
        const messages = await getAllMessages(callId, userId, lastDate);
        if (!messages)
            return res.sendStatus(404);
        res.send({ messages, managerId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//postMessage
route.post('/', async (req, res) => {
    try {
        let { callId, userId, type, text, time, replyOn } = req.body; 
        try {
            type = await getType(type);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }    

        const messageData = { callId, userId, type, text, time };
        if (replyOn) {
            messageData.replyOn = replyOn;
        }    
        const newP = await postMessage(messageData);
        res.status(201).send(newP);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//updateMessage
route.put('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { type, text } = req.query;


        //המרת הטייפ מטקסט למספר
        // const typeId = await getType(type);
        // await updateTextMessage(messageId, typeId, text);

        await updateTextMessage(messageId, type, text);
        res.status(200).json({ message: 'Message updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//deleteMessage
route.delete('/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        await deleteMessage(messageId);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



export default route;