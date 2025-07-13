import multer from 'multer';
import path from 'path';
import fs from 'fs';

function ensureDirExist(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

const messageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const mime = file.mimetype;
        let folder = 'documents';

        if (mime.startsWith('image/')) folder = 'images';
        else if (mime.startsWith('audio/')) folder = 'audios';
        else if (mime.startsWith('video/')) folder = 'videos';

        const fullPath = path.join('uploads', folder);
        ensureDirExist(fullPath);
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${unique}${ext}`);
    }
});

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isGroup = req.baseUrl.includes('/groups'); 
        const folder = isGroup ? 'group-profiles' : 'profiles';
        const dest = path.join('uploads', folder);
        ensureDirExist(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.params.id}.jpg`);
    }
});

export const uploadMessageFile = multer({ storage: messageStorage });
export const uploadProfilePic = multer({ storage: profileStorage });
