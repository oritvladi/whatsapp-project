import { getManagerByCall } from './callsDB.js';
import pool from './database.js'
import { getName } from './namesDB.js';
//get all members of specific group
export async function getAllMembersById(callId) {
    const manager = await getManagerByCall(callId);
    const [members] = await pool.query(`SELECT userId from members where callId=?`, [callId]);
    for (let i = 0; i < members.length; i++) {
        {
            const name = await getName(manager, members[i].userId);
            members[i].name = name;
        }
    }
    return members;
}

//create new member
export async function postMember(userId, callId) {
    ("in post member", userId, callId);
    await pool.query(`insert into members(userId, callId) VALUES(?,?)`,
        [userId, callId])
}

//delete member from a group
export async function deletemember(userId, callId) {
    await pool.query(`DELETE FROM members WHERE userId = ? AND callId = ?;`, [userId, callId]);
}


