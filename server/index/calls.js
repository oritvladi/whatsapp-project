import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllCalls, postCall, postGroup, deleteCall, updateNameCall, getCall, getAllDetailsOfCall } from '../database/callsDB.js';

const route = express.Router();

// הגדרת נתיב לקובץ הנוכחי (בגלל שימוש ב-ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// הגדרת התיקיות הסטטיות
route.use('/profiles', express.static(path.join(__dirname, '../database/profiles')));
route.use('/Gprofiles', express.static(path.join(__dirname, '../database/Gprofiles')));



// deleteCall
route.delete('/:id', async (req, res) => {
    try {
        await deleteCall(req.params);
        res.status(200).json({ message: 'Call deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// putNameCall
route.put('/:id', async (req, res) => {
    try {
        await updateNameCall(req.params, req.body);
        res.status(200).json({ message: 'Call updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

route.get('/:id/:callId', async (req, res) => {
    try {
               
       const call= getAllDetailsOfCall(req.params.callId, req.params.id);
        if (calls.length === 0) {
            return res.sendStatus(404);
        }
        call.profilePicture = `/uploads/profiles/${call.userId1+call.userId2-req.params.callId}`;
        res.send(calls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

route.post('/call', async (req, res) => {
    try {
        const { type, userId1, userId2, alias } = req.body;
        const newP = await postCall({ type, userId1, userId2, alias });
        res.status(201).send(newP);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

route.post('/group', async (req, res) => {
    try {
        const { type, userId1, alias } = req.body;
        const newG = await postGroup({ type, userId1, alias });
        res.status(201).send(newG);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default route;



//לא בשימוש כל הדף הזה