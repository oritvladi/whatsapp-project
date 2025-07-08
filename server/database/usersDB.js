import pool from './database.js'
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

//get all users
export async function getAllUsers() {
    const [users] = await pool.query(`SELECT * FROM users`);
    return users;
}

//get user by Id
export async function getUser(id) {
    const [[user]] = await pool.query(`SELECT * FROM users where id=?`, [id]);
    user.picture = await getUserPicture(id);
    return user;
}

//get user by phone
export async function getUserByPhone(phone) {
    const [[userId]] = await pool.query(`SELECT id FROM users where phone=?`, [phone]);
    return userId;
}

//get user name by Id
export async function getUserName(id) {
    const [[name]] = await pool.query(`SELECT name FROM users where id=?`, [id]);
    return name;
}

export async function postUser(newUser) {
    const [existingUsers] = await pool.query(`SELECT id FROM users WHERE email = ? OR phone = ?`, [newUser.email, newUser.phone]);
    if (existingUsers.length > 0) {
        throw new Error('User with this email or phone already exists');
    }
    // Insert new user
    const result = await pool.query(`INSERT INTO users (name, phone, email) VALUES (?, ?, ?)`, [newUser.name, newUser.phone, newUser.email]);
    return result[0].insertId;
}

//delete user by Id
export async function deleteUser(id) {
    await pool.query(`delete from users where id = ?`, [id]);
}

//update user by Id
export async function updateUser(updUser) {
    const [existingUsers] = await pool.query(`SELECT id FROM users WHERE email = ? and id != ?`, [updUser.email, updUser.id]);
    if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
    } await pool.query(`
    UPDATE users
        SET name = ?,
        phone = ?,
        email = ?       
    WHERE id = ?
`, [
        updUser.name,
        updUser.phone,
        updUser.email,
        updUser.id
    ]);
}

export async function getUserPicture(userId) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const profilePicturePath = path.join(__dirname, '..', 'uploads', 'profiles', `${userId}.jpg`); // נתיב מוחלט לתמונה
    const profilePic = `/uploads/profiles/${userId}.jpg`; // נתיב יחסי לתמונה לשימוש ב-URL
    const defaultPic = '/uploads/profiles/default.jpg'; // נתיב יחסי לתמונה חלופית

    try {
        await fs.access(profilePicturePath);
        return profilePic;
    } catch (err) {
        return defaultPic;
    }
}