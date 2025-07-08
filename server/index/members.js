import { getAllMembersById, postMember, deletemember} from '../database/membersDB.js'
import express from "express";
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const route = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//getAllMembersById
route.get('/:callId',async (req, res) => {
    try {
        const members = await getAllMembersById(req.params.callId);
        if (!members) {
            return res.sendStatus(404);
        }
        for (let i = 0; i < members.length; i++) {

            //לוהסיף בדיקה אם אין לו תמונה
          members[i].picture = `uploads/profiles/${members[i].userId}.jpg`;
        }
        (members);
        res.send(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

//postCall
route.post('/', async (req, res) => {
    try {
        const { type, userId1, userId2, alias } = req.body;        
        const newP = await postMember({ type, userId1, userId2, alias });
        res.status(201).send(newP);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//deleteCall
route.delete('/:id', async (req, res) => {
    try {
        await deleteCall(req.params);
        res.status(200).json({ message: 'Call deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//putNameCall
route.put('/:id', async (req, res) => {
    try {
        await updateNameCall(req.params, req.body);
        res.status(200).json({ message: 'Call updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default route;