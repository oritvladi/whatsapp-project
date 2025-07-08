import pool from './database.js'

//get specific message
export async function getMessage(id) {
    const [[Message]] = await pool.query(`SELECT * FROM messages where id=?`, [id]);
    return Message;
}

//create new Message
export async function postMessage(newMessage) {
    if (!newMessage.time) {
        const now = new Date();
        const localDate = new Date(now.setHours(now.getHours() + 3));
        newMessage.time = localDate;
    }

    const replyOn = newMessage.replyOn || null; 
    const result = await pool.query(`insert into messages(userId, callId, type, text, time, replyOn) VALUES(?,?,?,?,?,?)`,
        [newMessage.userId, newMessage.callId, newMessage.type, newMessage.text, newMessage.time, replyOn])

    return await getMessage(result[0].insertId);
}

//'delete' message by Id => active = false
export async function deleteMessage(id) {
    await pool.query(`update messages SET active = 0 where id = ?`, [id]);
}

//update message text by Id & new text => edit = true
export async function updateTextMessage(id, type, text) {
    ("on " + id, type, text);
    await pool.query(`
    UPDATE messages
        SET text = ?,
        type = ?,
        edit= 1       
    WHERE id = ?
`, [
        text,
        type,
        id
    ]);
}

// get all messages of call
export async function getAllMessages(callId, userId, date = null) {
    const [messages] = await pool.query(`
        SELECT 
            messages.*, 
            IFNULL(names.name, users.name) AS writen
        FROM 
            messages
        LEFT JOIN 
            names ON messages.userId = names.userId2 AND names.userId1 = ?
        LEFT JOIN 
            users ON messages.userId = users.id
        WHERE 
            messages.callId = ?
            AND (? IS NULL OR messages.time < ?)
        ORDER BY 
            messages.time DESC 
        LIMIT 10
    `, [userId, callId, date, date]);

    //לא בטוח שנצטרך
    return messages.reverse();
}

//get the type code of a message by name
export async function getType(name) {
    const [[id]] = await pool.query(`SELECT id FROM messagetypes WHERE name = ?`, [name]);
    (id);
    return id.id;
}

