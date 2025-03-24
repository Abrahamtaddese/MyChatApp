const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

// Set up multer to store files in memory (we’ll save photos as base64 in MongoDB instead of disk)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('.')); // Serve index.html and other static files

let messagesCollection;

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb+srv://abrahamtaddese21:pkOfzz8CHRV7oRuA@cluster0.ddm0y.mongodb.net/chatdb?retryWrites=true&w=majority";

async function connectDB() {
    try {
        const client = new MongoClient(uri, {
            tls: true,                  // Ensure secure connection
            serverSelectionTimeoutMS: 5000,  // Wait 5 seconds to find a server
            connectTimeoutMS: 10000          // Wait 10 seconds to connect
        });
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('chatdb');
        messagesCollection = db.collection('messages');
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err; // Stop the app if connection fails
    }
}

// Serve the chat page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Get all messages
app.get('/messages', async (req, res) => {
    try {
        const messages = await messagesCollection.find({}).toArray();
        res.json(messages);
    } catch (err) {
        res.status(500).send('Error fetching messages');
    }
});

// Send a message or photo
app.post('/send', upload.single('photo'), async (req, res) => {
    try {
        const message = req.body.message;
        const photo = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

        if (message || photo) {
            await messagesCollection.insertOne({ message, photoUrl: photo, timestamp: new Date() });
        }
        res.send('Message or photo sent');
    } catch (err) {
        res.status(500).send('Error sending message');
    }
});

// Clear all messages
app.post('/clear', async (req, res) => {
    try {
        await messagesCollection.deleteMany({});
        res.send('Chat cleared');
    } catch (err) {
        res.status(500).send('Error clearing chat');
    }
});

// Delete a message
app.post('/delete', async (req, res) => {
    try {
        const { index } = req.body;
        const messages = await messagesCollection.find({}).toArray();
        if (index >= 0 && index < messages.length) {
            const messageToDelete = messages[index];
            await messagesCollection.deleteOne({ _id: messageToDelete._id });
            res.send('Message deleted');
        } else {
            res.status(400).send('Invalid index');
        }
    } catch (err) {
        res.status(500).send('Error deleting message');
    }
});

// Start the server only after MongoDB connects
async function startServer() {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});