const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.')); // This serves files like index.html from the current folder

let messages = []; // Store messages here

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/send', (req, res) => {
    const message = req.body.message;
    messages.push(message);
    res.send('Message sent');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});