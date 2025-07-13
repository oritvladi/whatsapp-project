import { getUser, getUserName, postUser, updateUser, deleteUser, getAllUsers, getUserPicture } from '../database/usersDB.js'
import express from "express";
import { uploadProfilePic } from '../middleware/multer.js';
const route = express.Router();

//postUser
route.post('/', uploadProfilePic.single('img'), async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const userId = await postUser({ name, phone, email });
        if (req.file && !req.file.filename.startsWith(userId)) {
            const fs = await import('fs/promises');
            const path = await import('path');
            const oldPath = path.resolve(req.file.path);
            const newPath = path.resolve('uploads', 'profiles', `${userId}.jpg`);
            await fs.rename(oldPath, newPath);
        }

        res.send({ userId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

//getAllUsers
route.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
        if (!users) {
            return res.sendStatus(404);
        }
        res.send(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//getUser picture
route.get('/:id/pic', async (req, res) => {
    const { id } = req.params;
    ("in pic", id);
    try {
        const picUrl = await getUserPicture(id);
        (picUrl);
        res.send(picUrl);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//updateUser
route.put('/:id', async (req, res) => {
    try {
        await updateUser(req.params, req.body);
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

//deleteUser
route.delete('/:id', async (req, res) => {
    try {
        await deleteUser(req.params);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

//getUser
route.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await getUser(id);
        if (!user) {
            return res.sendStatus(404);
        }
        res.send(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default route;



