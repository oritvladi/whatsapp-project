import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import calls from './index/calls.js';
import users from './index/users.js';
import members from './index/members.js';
import { uploadMessageFile } from './middleware/multer.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'userid']
}));

app.use(express.json());

app.use('/calls', calls);
app.use('/users', users);
app.use('/members', members);

// Static files
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
app.use('/uploads/group-profiles', express.static(path.join(__dirname, 'uploads', 'group-profiles')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/upload', uploadMessageFile.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const relativePath = path.relative(path.join(__dirname, 'uploads'), req.file.path);
    const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
    res.json({ fileUrl });
});

export default app;
