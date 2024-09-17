const express = require('express');
const firebaseAdmin = require('firebase-admin');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const socketIO = require('socket.io');
const http = require('http');
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, updateDoc, arrayUnion, getDoc , increment} = require("firebase/firestore");


// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDN3slQa3lzrTWWRd6qOsUPi7VHIKr6qBw",
    authDomain: "newproj-4c059.firebaseapp.com",
    databaseURL: "https://newproj-4c059-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "newproj-4c059",
    storageBucket: "newproj-4c059.appspot.com",
    messagingSenderId: "872195487749",
    appId: "1:872195487749:web:c571cb18044fd14516c46c",
    measurementId: "G-Y2CS506VXM"
};
const app2 = initializeApp(firebaseConfig);
const db = getFirestore(app2);  // Initialize Firestore

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*'
    }
});

app.use(cors());
app.use(express.json());

// Firebase Admin SDK initialization
const serviceAccount = require('./keydemo.json'); // Update with your Firebase Admin SDK path
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});

// SMTP setup using Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'rizviadnan72@gmail.com',
        pass: 'kqhr yhdw doqe erwo', // Replace with your app-specific password
    },
});

// reCAPTCHA secret key
const RECAPTCHA_SECRET_KEY = '6LcRMDwqAAAAAJF2NV2FwXZ6dbFXoJqo5VXnKvAz';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const saveItemForPlayer = async (roomId, player, item) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
    
        // Update the player's items directly in the room document using the playerId as the key
        await updateDoc(roomRef, {
            [`players.${player.id}.items`]: arrayUnion(item.Name)  // Use dot notation to update the player's items
        });
        await updateDoc(roomRef, {
            [`players.${player.id}.score`]: increment(Number(item.Price))  // Use dot notation to update the player's score
        });
        console.log(`Saved item ${item} for player ${player} in Firebase`);
    } catch (error) {
        console.error("Error saving item:", error);
    }
};

const startGame = async (roomId, players) => {
    console.log("Starting game for players:", players);
    console.log("Room ID:", roomId);
    const roomRef = doc(db, 'rooms', roomId);

    // Fetch the document data
    const roomSnapshot = await getDoc(roomRef);

    // Check if the document exists
    if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.data();
        const chests = roomData.chests;
        const receive = 12 / players.length;
        
        // Shuffle helper function
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        const chest_no = roomData.chests.length;

        // Loop through each chest and distribute items
        for (const chest of chests) {
            let items = chest.Items; // Get all items from the chest
            items = shuffleArray(items); // Shuffle items to distribute randomly
            let curr_player=0;
            console.log("Shuffled items:", items);
            
                // Distribute the required number of items to each player
                for (let i = 0; i < items.length ; i++) {
                    const item = items.pop();  // Take one item from the shuffled list

                    console.log("Emit item:", item, "to player:", players[curr_player]);

                    // Save the item for the player
                    await saveItemForPlayer(roomId, players[curr_player], item);

                    // Emit event for chest opened
                    io.to(roomId).emit('chest_opened', { roomId: roomId, playerId: players[curr_player].id, item, chest: chest.name });
                    curr_player = (curr_player + 1) % players.length;
                    // Wait for 10 seconds before processing the next item
                    await sleep(3000);
                }
            
        }
        io.to(roomId).emit('game_end', { roomId: roomId });

        // Mark room as inactive after all items are distributed
        
    }
};


// Socket.io handling
io.on('connection', (socket) => {
    
   
    // When a player joins a room
    socket.on('join', async (data) => {

        

        const { roomId, user_id } = data;
        const playerId = user_id;
        
        
       
        // Add player to room
        socket.join(roomId);
        socket.emit('joined_room', { user_id, score: 0 });

        
        
        const roomRef = doc(db, 'rooms', roomId);
        
        // Fetch the document data
        const roomSnapshot = await getDoc(roomRef);

        // Check if the document exists
        if (roomSnapshot.exists()) {
            const roomData = roomSnapshot.data();
            if(!roomData.active){
                return;
            }

            let players = roomData.player || [];



            // Check if the number of players is met to start the game
            
            if(Array.isArray(roomData.players)){
                if (players.length === roomData.players.length && roomData.active ) {
                    console.log("start game isArray")
                    await updateDoc(roomRef, {
                        active: false
                    });
                    // startGame(roomId, players);
                }
            }
            else{
            if (players.length === roomData.players && roomData.active) {
                console.log("start game else" + user_id)
                await updateDoc(roomRef, {
                    active: false
                });
                startGame(roomId, players);
                sleep(5)
                console.log("belowstart game")
            }
        }


            


        }
    })
});

// Email verification
const sendVerificationEmail = (email, verificationLink) => {
    const mailOptions = {
        from: 'rizviadnan72@gmail.com',
        to: email,
        subject: 'Verify your email address',
        text: `Click the link below to verify your email address:\n\n${verificationLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Failed to send email:', error);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
};

// reCAPTCHA verification route
app.post('/verify-captcha', async (req, res) => {
    const { recaptchaToken } = req.body;
    console.log("recaptchaToken", recaptchaToken)
    try {
        const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const response = await fetch(verificationUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: RECAPTCHA_SECRET_KEY,
                response: recaptchaToken,
            }),

        });
        const dat = await response.json();
        console.log("response", dat)
        const result = dat;
        console.log("result", result)
        if (result.success) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, 'error-codes': result['error-codes'] });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register user and send verification email
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await firebaseAdmin.auth().createUser({ email, password });
        console.log('Successfully created new user:', user.uid);

        const emailLink = await firebaseAdmin.auth().generateEmailVerificationLink(user.email);
        sendVerificationEmail(email, emailLink);

        res.status(200).json({ message: 'User registered successfully!', email_link: emailLink });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});



// Verify email
app.post('/verify-email', async (req, res) => {
    const { email } = req.body;

    try {
        const emailLink = await firebaseAdmin.auth().generateEmailVerificationLink(email);
        sendVerificationEmail(email, emailLink);

        res.status(200).json({ message: 'Verification email sent!', email_link: emailLink });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
