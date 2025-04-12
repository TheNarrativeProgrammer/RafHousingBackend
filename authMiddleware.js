//MIDDLEWARE --> a connection between two things. Can be between software and hardware, or frontend and backend. 
//Here, we're using it to check the token. Once frontend asks for things, we need to validate them with a token.

//const jwt = require("jsonwebtoken");
//require('dotenv').config();

import jwt from 'jsonwebtoken';
import 'dotenv/config';


//next --> part of middelwear implementation. It processes something and then moves on to next step.
//It does some step and then moves to next step. It's a way to stop, process something, and then move on.

//authHeader --> Header --> whenever the user asks for something, they send JSON and within the headers there is a 'bearer' or 'authorization' which is followed by the token/
//bearer tokenName
//or
//authorization tokenName
//it's either bearer space something or authorization space something. Therefore, in the authHeader.split(" ")[1] step, we are lookign for the space and get the 2nd part
//authorization and bearer are two ways of writing the same thing.
//we need to caputure the token and then check it via salt signature.

//HEADER--> when you send data, you have the body, but you also have the header, which we put things like application, json, or authorization.
//Here, we're adding an addtional key/value pair called 'authorization' followed by the token.
//Wehn you do the POST, you put a new header key and put the token there
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    //get the token
    //within authHeader, look for the space " " and [1]-->take the 2nd of part (characters to the right of the space), which is index 1 of our array. This is the token
    const token = authHeader.split(" ")[1];
    //jwt--> library used to sign and verify
    //process.env.JWT_SECRET --> pass the secret as arguement. This is stored in hidden file .env   JWT_SECRET is key is key/value pair within the file.
    //(err, decoded) --> there are 2 possible options from here, error or decoded. 
    jwt.vertify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "invalid token" });
        }
        //The info we're decoding in the userId and userName. If decode is successful, then store the data in the req in the user key
        req.user = decoded;
        next();
    });
}
export default verifyToken;