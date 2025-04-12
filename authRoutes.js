
import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db.js';


//const express = require("express")
//const router = express.Router();
//const bcrypt = require("bcrypt");
//const jwt = require("jsonwebtoken");


//need do 2 POST. USer writes info (username password) and then it's pushed to database

router.post("/signup", async (req, res) => {
    try {
        //get the user name, email, passwrod from body of req
        const { username, email, password } = req.body;

        //validation. Check if .com or @ included in email and no special characters in username. TODO
        if (!username || !email || !password) {
            return res.status(400).json()({ message: "Missing username/email/password" });
        }

        const [existing] = await pool.query(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            //? -? place holders. This info is passed into array if it exist.
            [username, email]
        );
        //if username or email does eixist, then length is greater than 0
        if (existing.length > 0) {
            return res.status(400).json({ message: "User of email already exist" })
        }

        //hash password.
        //add salt -> grab password and add reandom characters to the beginnning. The random things are the same for every password
        //define hash_password with const
        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password, saltRounds);

        await pool.query(
            "INSERT INTO users(username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "user created successfully." });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "internal server error" });
    }
});

router.post("/signin", async (req, res) => {
    try {
        //extract user and pass
        const { username, password } = req.body;

        //validation. TODO
        if (!username || !password) {
            return res.status(400).json()({ message: "Missing username/email/password" });
        }

        //[existing] -> were by default getting the whole table [[]] and [existing] limits this to just the rows []
        const [existing] = await pool.query(
            "SELECT id, username, password_has FROM users WHERE username = ?",
            [username]
        );

        if (existing.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //compare password entered with decyrpt library

        //get the user
        //first row in [existing] is user
        //table has passord_hash column, which is defined above in "SELECT id, username, password_has FROM users WHERE username = ?",
        const user = existing[0];

        const match = await bcrypt.compare(password, user.passord_hash);
        //if there is no match, then return error that doesn't give too much into
        if (!match) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //if match is true, then return token.
        const token = jwt.sign(
            //signature needs info (user id, user name )
            { userId: user.id, username: user.username },
            //key -> secret that is defined in the .env section of files. This is how the files are altered and the strign can be anything
            process.env.JWT_SECRET,
            //make token expire in 1 day
            { expiresIn: "1d" }
        );

        return res.status(200).json({ message: "loggged in", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "interal server error" });
    }
    
    //end of signing
});

//send router
export default router;