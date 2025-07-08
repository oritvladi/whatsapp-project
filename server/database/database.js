import mysql from 'mysql2'

//conect to sql database
const pool = mysql.createPool({
    host: '127.0.0.1',
    password: 'orit1234',
    user: 'root',
    database: 'whatsapp',
}).promise();

export default pool;












