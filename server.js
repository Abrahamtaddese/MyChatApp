const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.')); // Serve static files (like index.html)
app.use('/uploads', express.static('uploads')); // Serve uploaded photos

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage: storage });

let messages = []; // Store messages and photo URLs

// Route to fetch all messages
app.get('/messages', (req, res) => {
    res.json(messages);
});

// Route to send a message or photo
app.post('/send', upload.single('photo'), (req, res) => {
    const message = req.body.message;
    const photo = req.file;

    if (message) messages.push({ message: message });
    if (photo) messages.push({ photoUrl: '/uploads/' + photo.filename });

    res.send('Message or photo sent');
});

// Route to clear all messages
app.post('/clear', (req, res) => {
    messages.length = 0; // Clear the messages array
    res.send('Chat cleared');
});

// Route to delete a specific message
app.post('/delete', (req, res) => {
    const { index } = req.body; // Get the index of the message to delete
    if (index >= 0 && index < messages.length) {
        messages.splice(index, 1); // Remove the specific message
        res.send('Message deleted');
    } else {
        res.status(400).send('Invalid index'); // Handle invalid index
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
