import 'dotenv/config';
import mysql from 'mysql2/promise';

//const mysql = require("mysql.promise") //this doesn't work. its an old way of importing

//pool of connections instead of single connection. You can do up to 10 queries at the same time.
//process -> allows access to .env file
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    //if all connections in pool are taken and a user tries to access, then allow teh use to wait for connection to open
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//module.exports = pool;
export default pool;
