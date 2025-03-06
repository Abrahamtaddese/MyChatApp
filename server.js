const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// MongoDB Connection
const uri = process.env.MONGODB_URI || "mongodb+srv://abrahamtaddese21:pkOfzz8CHRV7oRuA@cluster0.ddm0y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let messagesCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db('chatdb');
        messagesCollection = db.collection('messages');
    } catch (err) {
        console.error("MongoDB error:", err);
    }
}
connectDB();

app.get('/messages', async (req, res) => {
    const messages = await messagesCollection.find({}).toArray();
    res.json(messages);
});

app.post('/send', upload.single('photo'), async (req, res) => {
    const message = req.body.message;
    const photo = req.file;

    if (message) await messagesCollection.insertOne({ message: message, timestamp: new Date() });
    if (photo) await messagesCollection.insertOne({ photoUrl: '/uploads/' + photo.filename, timestamp: new Date() });

    res.send('Message or photo sent');
});

app.post('/clear', async (req, res) => {
    await messagesCollection.deleteMany({});
    res.send('Chat cleared');
});

app.post('/delete', async (req, res) => {
    const { index } = req.body;
    const messages = await messagesCollection.find({}).toArray();
    if (index >= 0 && index < messages.length) {
        const messageToDelete = messages[index];
        await messagesCollection.deleteOne({ _id: messageToDelete._id });
        res.send('Message deleted');
    } else {
        res.status(400).send('Invalid index');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});