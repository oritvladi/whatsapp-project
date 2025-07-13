import pool from './database.js'

//get specific message
export async function getMessage(id) {
    const [[message]] = await pool.query(`
    SELECT 
      m.*,
      CASE 
        WHEN m.replyOn IS NOT NULL THEN 
          (
            SELECT JSON_OBJECT(
              'id', r.id,
              'text', IF(r.active = 1, r.text, 'Message canceled')
            )
            FROM messages r
            WHERE r.id = m.replyOn
          )
        ELSE NULL
      END AS replyOn
    FROM messages m
    WHERE m.id = ?
  `, [id]);

    return message;
}

//create new Message
export async function postMessage(newMessage) {
    if (!newMessage.time) {
        const now = new Date();
        const localDate = new Date(now.setHours(now.getHours() + 3));
        newMessage.time = localDate;
    }

    const replyOn = newMessage.replyOn?.id || newMessage.replyOn || null;
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
export async function getAllMessages(callId, userId, lastId = null) {
    const [messages] = await pool.query(`
    SELECT 
        m.*, 
        IFNULL(n.name, u.name) AS writen,
        CASE 
            WHEN r.id IS NOT NULL THEN 
                JSON_OBJECT(
                    'id', r.id,
                    'text', IF(r.active = 1, r.text, 'Message canceled')
                )
            ELSE 
                NULL
        END AS replyOn
    FROM 
        messages m
    LEFT JOIN 
        names n ON m.userId = n.userId2 AND n.userId1 = ?
    LEFT JOIN 
        users u ON m.userId = u.id
    LEFT JOIN 
        messages r ON m.replyOn = r.id
    WHERE 
        m.callId = ?
        AND (? IS NULL OR m.id < ?)
    ORDER BY 
        m.id DESC 
    LIMIT 10
  `, [userId, callId, lastId, lastId]);

    return messages.reverse();
}


//get the type code of a message by name
export async function getType(name) {
    const [[id]] = await pool.query(`SELECT id FROM messagetypes WHERE name = ?`, [name]);
    (id);
    return id.id;
}

