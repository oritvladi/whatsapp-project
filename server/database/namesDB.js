import pool from './database.js'
import { getUserName } from './usersDB.js';

//get specific name
export async function getName(userId1, userId2) {
    let [[ name ]] = await pool.query(`SELECT name FROM names WHERE userId1 = ? AND userId2 = ?`, [userId1, userId2]);
    name = name ?? await getUserName(userId2);
    (name);
    return name.name;
}

//post name
export async function postName(userId1, userId2, name) {
    await pool.query(`insert into names(userId1, userId2, name) VALUES(?,?,?)`,
        [userId1, userId2, name])
}

//delete name
export async function deletename(userId1, userId2) {
    await pool.query(`delete from names where userId1 = ? and userId2=?`, [userId1, userId2]);
}

//put name
export async function updateName(userId1, userId2, name) {
    await pool.query(`
    UPDATE names
        SET name = ?           
    WHERE userId1 = ?
    and userId2 = ?
`, [
        name,
        userId1,
        userId2
    ]);
}

// //get specific name
// export async function getName(userId1, userId2) {
//     // const [[name]] = await pool.query(`SELECT name FROM names where userId1=? and userId2=?`, [userId1, userId2]);
//     // if (name== null)
//     //      name = await getUserName(userId2);
//     let [[{ name }]] = await pool.query(`SELECT name FROM names WHERE userId1 = ? AND userId2 = ?`, [userId1, userId2]);
//     name = name ?? await getUserName(userId2);

//     return name;
// }