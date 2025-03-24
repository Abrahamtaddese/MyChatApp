const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('.'));

let messagesCollection;

const uri = process.env.MONGODB_URI || "mongodb+srv://abrahamtaddese21:pkOfzz8CHRV7oRuA@cluster0.ddm0y.mongodb.net/chatdb?retryWrites=true&w=majority&ssl=false";

async function connectDB() {
    try {
        const client = new MongoClient(uri, {
            useUnifiedTopology: true, // Modern topology engine
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 20000
        });
        await client.connect();
        console.log("Connected to MongoDB successfully");
        const db = client.db('chatdb');
        messagesCollection = db.collection('messages');
        return client;
    } catch (err) {
        console.error("Detailed MongoDB connection error:", err);
        throw err;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await messagesCollection.find({}).toArray();
        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).send('Error fetching messages');
    }
});

app.post('/send', upload.single('photo'), async (req, res) => {
    try {
        const message = req.body.message;
        const photo = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

        if (message || photo) {
            await messagesCollection.insertOne({ message, photoUrl: photo, timestamp: new Date() });
        }
        res.send('Message or photo sent');
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).send('Error sending message');
    }
});

app.post('/clear', async (req, res) => {
    try {
        await messagesCollection.deleteMany({});
        res.send('Chat cleared');
    } catch (err) {
        console.error('Error clearing chat:', err);
        res.status(500).send('Error clearing chat');
    }
});

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
        console.error('Error deleting message:', err);
        res.status(500).send('Error deleting message');
    }
});

async function startServer() {
    let client;
    try {
        client = await connectDB();
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();