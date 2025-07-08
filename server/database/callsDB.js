import pool from './database.js'
import { getUserByPhone } from './usersDB.js';
import { getName } from './namesDB.js';
//get specific call between two users
export async function getCall(id1, id2) {
    (id1, id2);
    const [[call]] = await pool.query(`SELECT * FROM calls WHERE (userId1=? AND userId2 = ?) OR (userId1=? AND userId2 = ?)`, [id1, id2, id2, id1]);
    return call;
}
export async function getCallById(id) {
    const [[call]] = await pool.query(`SELECT * FROM calls WHERE (id = ?)`, [id]);
    return call;
}
export async function postCall(newCall) {
    (newCall);
    const user = await getUserByPhone(newCall.phoneNumber);
    (user);
    if (!user) throw ("This phone number is not record")
    const call = await getCall(newCall.userId1, user.id);
    if (call) { throw ("Exsisting call") }
    else {
        const result = await pool.query(`insert into calls(type, userId1, userId2) VALUES(?,?,?)`,
            [newCall.type, newCall.userId1, user.id, newCall.alias])
        if (newCall.name != "")
            await pool.query(`insert into names(userId1, userId2, name) VALUES(?,?,?)`, [newCall.userId1, user.id, newCall.name]);
        return await getAllDetailsOfCall(result[0].insertId, newCall.userId1);
    }
}
export async function postGroup(newGroup) {
    (newGroup);
    const result = await pool.query(`insert into calls(type, userId1, alias) VALUES(?,?,?)`,
        [newGroup.type, newGroup.userId1, newGroup.name])
    const c = await getAllDetailsOfCall(result[0].insertId);
    (c);
    return c;
}
//'delete' call by Id => active = false
export async function deleteCall(id) {
    await pool.query(`update calls SET active = 0 where id = ?`, [id]);
}
//update call alias by Id & new alias
export async function updateNameCall(newAlias, id) {
    await pool.query(`
    UPDATE calls
        SET alias = ?       
    WHERE id = ?
`, [
        newAlias,
        id
    ]);
}
export async function isCall(userId, callId) {
    const [[call]] = await pool.query(`SELECT * 
FROM calls 
WHERE (id = ? AND (userId1 = ? OR userId2 = ?)) OR EXISTS (
    SELECT * 
    FROM members 
    WHERE callId = ? AND userId = ?
)`, [callId, userId, userId, callId, userId]);
    return call;
}
export async function getAllCalls(userId, lastCall = null) {
    const query = `
        SELECT 
            calls.id,
            calls.type,
            calls.userId1,
            calls.userId2,
            calls.alias,
            COALESCE(last_message.text, '') AS last_message,
            COALESCE(last_message.time, calls.createdAt) AS last_time
        FROM 
            calls
        LEFT JOIN 
            members ON calls.id = members.callId
        LEFT JOIN 
            (
                SELECT 
                    m1.callId,
                    m1.text,
                    m1.time
                FROM 
                    messages m1
                INNER JOIN 
                    (
                        SELECT 
                            callId, 
                            MAX(time) AS max_time
                        FROM 
                            messages
                        GROUP BY 
                            callId
                    ) AS m2 ON m1.callId = m2.callId AND m1.time = m2.max_time
            ) AS last_message ON calls.id = last_message.callId
        WHERE 
            (members.userId = ? OR calls.userId1 = ? OR calls.userId2 = ?)
            AND calls.active = ?
        GROUP BY 
            calls.id, calls.type, calls.userId1, calls.userId2, calls.alias, last_message.text, last_time
        ORDER BY 
            last_time DESC
    `;

    const params = [userId, userId, userId, true];
    const [allCalls] = await pool.query(query, params);

    // Find the index of the lastCall in the sorted results
    let startIndex = 0;
    if (lastCall) {
        startIndex = allCalls.findIndex(call => call.id === lastCall) + 1;
    }

    // Get the next 10 calls after the lastCall (or the first 10 calls if lastCall is not provided)
    const calls = allCalls.slice(startIndex, startIndex + 10);
    const readyCalls = calls.map(call => {
        if (call.type == 1 && call.userId1 !== userId && call.userId2 === userId) {
            return ({
                ...call,
                userId1: userId,
                userId2: call.userId1,
            });
        } else {
            return call;
        }
    });

    for (let i = 0; i < readyCalls.length; i++) {
        if (readyCalls[i].type === 1) {
            const name = await getName(userId, readyCalls[i].userId2);
            readyCalls[i].alias = name;
        }
    }
    return readyCalls;
}
export async function getManagerByCall(callId) {
    const [[managerId]] = await pool.query(`SELECT userId1 FROM calls WHERE id = ?`, [callId]);
    return managerId.userId1;
}

export async function getAllDetailsOfCall(callId, userId = null) {
    if (userId == null)
        userId = getManagerByCall(callId);
    const [[call]] = await pool.query(` 
      SELECT 
    calls.id,
    calls.type,
    calls.userId1,
    calls.userId2,
    COALESCE(
        CASE 
            WHEN calls.type = 2 THEN calls.alias
            ELSE NULL
        END,
        names.name,
        users.name
    ) AS alias,
    COALESCE(last_message.text, '') AS last_message,
    COALESCE(last_message.time, calls.createdAt) AS last_time
FROM 
    calls
LEFT JOIN 
    members ON calls.id = members.callId
LEFT JOIN 
    names ON calls.userId1 = names.userId1 AND calls.userId2 = names.userId2
LEFT JOIN 
    users ON calls.userId2 = users.id
LEFT JOIN 
    (
        SELECT 
            m1.callId,
            m1.text,
            m1.time
        FROM 
            messages m1
        INNER JOIN 
            (
                SELECT 
                    callId, 
                    MAX(time) AS max_time
                FROM 
                    messages
                GROUP BY 
                    callId
            ) AS m2 ON m1.callId = m2.callId AND m1.time = m2.max_time
    ) AS last_message ON calls.id = last_message.callId
WHERE 
    calls.id = ?   `, [callId]);

    if (call && call.type&& call.type==1&& call.alias=='')
        call.alias = await getName(userId, call.userId1 + call.userId2 - userId);
    return call;
}