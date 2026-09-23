//Ο server.js λειτουργεί ως ο Backend Server που συνδέει τη βάση δεδομένων με την ιστοσελίδα
//Framework: express 
//Node για να τρέχει το αρχείο server.js,να ακούει τα αιτήματα των χρηστών και τους στέλνει πίσω τα δεδομένα από τα αρχεία JSON

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken'); // Εισαγωγή της βιβλιοθήκης JWT
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not configured');
}

// Σωστό μονοπάτι για τα στατικά αρχεία (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../public')));

//Middleware(ενδιάμεσο λογισμικό) για να μπορεί ο server να διαβάζει δεδομένα από φόρμες (JSON)
app.use(express.json());

// API για Links
app.get('/api/links/:category', (req, res) => {
    const category = req.params.category;
    const filePath = path.join(__dirname, 'data', 'links.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "links.json not found" });
        const json = JSON.parse(data);
        res.json(json[category] || []);
    });
});

// API για Διακρίσεις
app.get('/api/distinctions/:category', (req, res) => {
    const category = req.params.category;
    const filePath = path.join(__dirname, 'data', 'distinctions.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "distinctions.json not found" });
        const json = JSON.parse(data);
        res.json(json[category] || []);
    });
});

//-----------------------------------------------------------------------------------
//Για να λειτουργήσει η σύνδεση, ο server πρέπει να ελέγχει τα στοιχεία. 
//Στο server.js, θα χρειαστούμε ένα "αντικείμενο" που θα κρατάει τον χρήστη

// Στοιχεία Διαχειριστή - Με παραγωγή JWT Token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Έλεγχος στοιχείων (Username:admin / Password:123)
    if (username === "admin" && password === "123") {
        // Δημιουργία Token που λήγει σε 1 ώρα
        const token = jwt.sign({ user: "admin" }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, token: token });
    } else {
        res.status(401).json({ success: false, message: "Λάθος στοιχεία!" });
    }
});

// Middleware για την επαλήθευση του Token (για μελλοντική χρήση σε POST/DELETE)
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(403).json({ error: "No token provided" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(401).json({ error: "Unauthorized access" });
        req.user = user;
        next();
    });
}



// Endpoint για προσθήκη δεδομένων (με έλεγχο Token)
app.post('/api/add/:type', verifyToken, (req, res) => {
    const type = req.params.type; // 'links' ή 'distinctions'
    const { category, item } = req.body;
    const filePath = path.join(__dirname, 'data', `${type}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });

        let json = JSON.parse(data);
        if (!json[category]) json[category] = [];
        
        json[category].push(item); // Προσθήκη του νέου στοιχείου

        fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

// Route για να φέρει ΟΛΑ τα δεδομένα ενός αρχείου (για τον πίνακα διαχείρισης)
app.get('/api/all/:type', verifyToken, (req, res) => {
    const type = req.params.type;
    const filePath = path.join(__dirname, 'data', `${type}.json`);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "File not found" });
        res.json(JSON.parse(data));
    });
});

// Route για Διαγραφή στοιχείου
app.delete('/api/delete/:type', verifyToken, (req, res) => {
    const type = req.params.type;
    const { category, index } = req.body;
    const filePath = path.join(__dirname, 'data', `${type}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });

        let json = JSON.parse(data);
        if (json[category]) {
            json[category].splice(index, 1); // Αφαίρεση του στοιχείου από τον πίνακα
        }

        fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false });
            res.json({ success: true });
        });
    });
});

// Route για Ενημέρωση (Update) στοιχείου
app.put('/api/update/:type', verifyToken, (req, res) => {
    const { type } = req.params;
    const { category, index, item } = req.body;
    const filePath = path.join(__dirname, 'data', `${type}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false });
        let json = JSON.parse(data);
        if (json[category] && json[category][index] !== undefined) {
            json[category][index] = item;
            fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
                if (err) return res.status(500).json({ success: false });
                res.json({ success: true });
            });
        }
    });
});

// Endpoint για τα δεδομένα του αθλητή (Bio & Images)
app.get('/api/athlete-info', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'athlete.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Cannot read data" });
        res.json(JSON.parse(data));
    });
});

// Vercel
module.exports = app;
