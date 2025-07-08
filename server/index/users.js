import multer from 'multer';
import {getUser, getUserName, postUser, updateUser, deleteUser, getAllUsers, getUserPicture } from '../database/usersDB.js'
import express from "express";
import { fileURLToPath } from 'url';

const route = express.Router();

var storage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, './uploads/profiles');
        },        filename: function ( req, file, cb ) { 
             ("in storage" ,req.params.id,file);  
            //  const fileName=file.originalname.split('.')[1];
            // cb( null, `${req.params.id}.${fileName}`);
            cb( null, `${req.params.id}.jpg`);
            
        }
    }
);
var upload = multer( { storage: storage } );

//getAllUsers
route.get('/',async (req, res) => {
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
route.get('/:id/pic',async (req, res) => {
    const { id } = req.params;
    ("in pic",id);
    try {
        const picUrl = await getUserPicture(id);  
        (picUrl);
        res.send(picUrl);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


route.post('/:id', upload.single('img'),async (req, res) => {
try{
res.status(201).send('ok');
}catch (err) {
    res.sendStatus(400).json({ message: err.message });
}});

//postUser
route.post('/', async (req, res) => {
    try {      
        const {name, phone , email} = req.body;     
        const userId = await postUser({ name, phone , email});
        res.send({userId:userId});
    } catch (err) {
        res.status(400).json({ message: err.message });
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
route.get('/:id',async (req, res) => {
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



