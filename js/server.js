const websocket = require('ws');
const express = require("express");
const jwt = require("jsonwebtoken");
const path = require('path');
const url = require('url');
const runner = require('child_process');
var mongodb = require('mongodb');
var mongoDbQueue = require('mongodb-queue-up');
require('dotenv').config();
const cors = require('cors');
const User = require('./dbuser.js');
const Joi = require('@hapi/joi');
const { default: mongoose } = require('mongoose');
const bcrypt = require('bcrypt');

// Uri connection to mongodb
const uri = "mongodb://mongoadmin:secret@localhost:1888/?authMechanism=DEFAULT";
// Mongodb Client
const client = new mongodb.MongoClient(uri);
// Connect to database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to db');
    }).catch((e) => {
        console.log('Db error', e);
    });

var wsClients = [];

const app = express();
// Use Cross Origin Resource Sharing
app.use(cors());
app.use(express.json());
// Make html's dependencies working correctly
app.use(express.static(path.join(__dirname, '..')));

// Server listening on port 3000
const server = app.listen(3000, () => {
    console.log("Server running on port 3000");
});

// Set validation schema
const schemaLogin = Joi.object({
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(6).required()
});

// Register user
app.post('/register', async (req, res) => {
    // Login schema validation
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Check if email exists
    const isEmailExist = await User.findOne({ email: req.body.email });
    if (isEmailExist) return res.status(400).json({ error: 'Email already taken' });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    // Create user using the model
    const user = new User({
        email: req.body.email,
        password
    });

    // Save user into database
    try {
        const savedUser = await user.save();
        res.json({
            error: null,
            data: savedUser
        });
    } catch (error) {
        res.status(400).json({ error });
    }
});

// Receiving client's credentials and response with a token with a time no longer 
// than 10 minutes
app.post("/login", async (req, res) => {
    // Login schema validation
    const { error } = schemaLogin.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    // Email existence validation
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    // Password validation
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    // Create token
    const token = jwt.sign({
        email: user.email,
        id: user._id
    }, process.env.TOKEN_SECRET, {
        expiresIn: '10m'
    });

    res.header('auth-token', token).json({
        error: null,
        data: { token }
    });
});

// Set WebSocketServer in express server on path '/ws'
const wss = new websocket.Server({ server: server, path: '/ws' });

wss.on('connection', (ws, req) => {
    // Get token from the url and verifies it
    var token = url.parse(req.url, true).query.token;
    // If it is not valid, websocket connection is closed
    // Otherwise, client's websocket is saved with his correspondant token
    jwt.verify(token, process.env.TOKEN_SECRET, (err) => {
        if (err) {
            ws.close();
        } else {
            wsClients[token] = ws;
        }
    });
    // On message, if there is an error or current requests have reached the limit, websocket 
    // connection is closed
    ws.on('message', (data) => {
        data = JSON.parse(data);
        jwt.verify(token, process.env.TOKEN_SECRET, async (err) => {
            if (err || data.requests == 0) {
                ws.send("Your token is no longer valid.<br>");
                ws.close();
            } else {
                await client.connect();
                // Get 'test' db
                const db = client.db('test');
                // Create task queue on 'test' db
                const queue = mongoDbQueue(db, 'my-queue');
                // Add job to queue
                setTimeout(() => {
                    addJobToQueue(queue, data.operation).then(() => {
                        // If job has been correctly added, process it
                        queue.get((err, job) => {
                            // Execute the parser passing through params the input arithmetic operation checking 
                            // if it is correct or not
                            console.log(job);
                            if (job != undefined) {
                                runner.exec(`node ./js/parser.js ${job.payload}`, function (err, response) {
                                    if (err) ws.send('Error: ' + err);
                                    else ws.send(response);
                                });
                                // After processing job, remove it from the queue
                                queue.ack(job.ack, (err, id) => {
                                    console.log('Job removed from the queue');
                                });
                                queue.clean((err) => {
                                    console.log('The processed jobs have been deleted');
                                });
                            }
                        });
                    });
                }, (Math.floor(Math.random() * 5000)));
            }
        });
    });
});

// Adding job to task queue
async function addJobToQueue(queue, data) {
    await queue.add(data, function (err, id) {
        console.log('Added to queue');
    });
}