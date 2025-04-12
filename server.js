//other way of writing the old way
//require("dotenv").config();
//const express = require("express");
//const cors = require("cors");
import 'dotenv/config'
import express from 'express'; //create entry points
import cors from 'cors';

import router from "./authRoutes.js";
import verifyToken from "./authMiddleware.js";
import pool from "./db.js";



import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bodyParser from 'body-parser';
import fs from "fs";



const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/auth", router);                                                           //connecting all the routes to this path.
//if we want to access post(/sigin) from authRouter.js and have a separate path, then we need to add app.use("/api/auth/signin", authRoutes);


//JSON HANDLING
app.use(bodyParser.urlencoded({ extended: true }));                                     //handle encoded jsons
app.use(bodyParser.json());

//PATHS - path to store stuff. Where to save data on backend. Store as Jsons
const PATH = path.join("./", "event.json");                                             //TELEMETRY - path for saving telemety data                                          
const SERVER_DATA_FILE = path.join(__dirname, "RafHousingGameStateData.json");          //CLOUD SAVING - path for saving game state


//TELEMETRY - GET
//dumby end point that should be refined later. We're currently sending a token but there is no code for what to do after we're logged in. It's just send a message
app.get("/api/protected", verifyToken, async (req, res) => {
    try {
        //try to get the info of the user
        //The verifyToken contains the data of [req.user.userId]. verifyToken calls the VerifyToken func in authMiddleWear, which decodes the data and send userId & userName
        //We can extact the userId from [req.user.userId])
        const [rows] = await pool.query("SELECT id, username, email FROM users WHERE id = ?",
            [req.user.userId]);
        //get info from user
        const user = row[0];
        res.json({ message: "This is hidden data", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "internal server error" });
    }
});

//start the server by adding PORT=3000 in .env 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(
        `server running on port ${PORT}`);
});


//TELEMETRY - POST
app.post('/telemetry', (req, res) => {
    try {
        const rawData = req.body;
        let exisingEvents = [];
        if (fs.existsSync(PATH)) {
            const rawData = fs.readFileSync(PATH, "utf-8");
            if (rawData.length > 0) {
                exisingEvents = JSON.parse(rawData);
            }
        }
        exisingEvents.push(eventData);
        fs.writeFileSync(PATH, JSON.stringify(exisingEvents, null, 2));
        return res.status(200).json({ message: "data stored" });
    } catch (error) {
        return res.status(500).json({ error: "interal server error" });
    }
});

//presistent path C:\Users\pg27reid\AppData\LocalLow\DefaultCompany\

//CLOUD SAVING - SERVER DATA
function loadServerData() {
    if (!fs.existsSync(SERVER_DATA_FILE)) {                 //check --> if files does NOT exist. If there is nothing in it, then return empty file (rawjson: "").
        return {
            rawjson: "",                                    //rawJson -- SAVED GAME INFO --> this is the json that holds all the game info. 
                                                            //It's currently blank, but it will be populated with the saved info.
            decryptedLastUpdated: 0,                        //decryptedLastUpdated --> hold time of last upsdate    0--> simple date format. The amount of seconds since 1970.
        }
    }
    try {                                                   //check --> if file exist, then try to read the file. Pass in the file and define the data format for the date. 
        const raw = fs.readFileSync(SERVER_DATA_FILE, "utf-8");
        return JSON.parse(raw);                             //when reading the info, we get raw info. Therefore, we need to parse it to get actual JSON
        
    } catch (e) {                                           //if there is an error, return the same thing just blank. Allows player to still play the game and not crash.
        console.error("Error reading file", e);
        return {
            rawjson: "",
            decryptedLastUpdated: 0
        }
    }
}

let serverData = loadServerData();                              //whenever we start backend, then load server data and save to var. Funcationality for saving info
                                                                //loadServerData(); returns object containing 1) rawJson and 2) decryptedLastUpdated


//CLOUD SAVING - SAVE SERVER DATA TO FILE
//once server data has been updated with data sent from client, pass it as 'serverData', stringify, and write it to the file defined in SERVER_DATA_FILE
function saveServerData(serverData) {
    fs.writeFileSync(SERVER_DATA_FILE, JSON.stringify(serverData), "utf-8");
}



//CLOUD SAVING - POST
app.post("/syncLocalClientWithCloud", (req, res) => {
    const clientPlainJson = req.body.plainJson;                 //req returns plain JSON within the header. The header is named 'plainJson.' This header contains all the data
    if (!clientPlainJson) {                                     //check if plainJson is valid
        return res.status(400).send("no json provided");
    }
    try {
        const clientObject = JSON.parse(clientPlainJson);       //try to parse data
        const clientLastUpdated = clientObject.lastUpdated || 0;//the PlayerData object contains a key named 'lastUpdated.' If it has info, store it. If empty, default to 0
        //COMPARE TIME STAMP
        if (clientLastUpdated >= serverData.decryptedLastUpdated) { //check --> if client date is newer than server
            serverData.rawjson = clientPlainJson;                   //replace server info with client info
            serverData.decryptedLastUpdated = clientLastUpdated;
            saveServerData(serverData);                             //write updated serverData to file
        }
        else {                                                      //cloud data is newer than clients data, therefore, no data update needed. 
            console.log("server info is newer, not updating");
        }
        console.log(serverData.rawjson);
        return res.send(serverData.rawjson);                        //send the info back from the server to the client
    } catch (e) {
        console.error("error in the sync request :", e);
        return res.status(500).send("server error");
    }
});


