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

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/send', upload.single('photo'), (req, res) => {
    const message = req.body.message;
    const photo = req.file;

    if (message) messages.push({ message: message });
    if (photo) messages.push({ photoUrl: '/uploads/' + photo.filename });

    res.send('Message or photo sent');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});