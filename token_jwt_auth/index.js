const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';

class Session {
    constructor() {}

    generateToken(payload) {
        return jwt.sign(payload, 'dimas1337');
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, 'dimas1337');
        } catch (err) {
            return null;
        }
    }
}

const sessions = new Session();

app.use((req, res, next) => {
    const token = req.headers.authorization;

    if (token) {
        const decoded = sessions.verifyToken(token);

        if (decoded) {
            req.session = decoded;
        }
    }

    next();
});


app.get('/', (req, res) => {
    if (req.session && req.session.username) {
        return res.json({
            username: req.session.username,
            logout: 'http://localhost:3000/logout'
        });
    }
    res.sendFile(path.join(__dirname+'/index.html'));
});


app.get('/logout', (req, res) => {
    sessions.destroy(req, res);
    res.redirect('/');
});

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'Login1',
        password: 'Password1',
        username: 'Username1',
    }
]

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const user = users.find((user) => {
        return user.login === login && user.password === password;
    });

    if (user) {
        const token = sessions.generateToken({ username: user.username, login: user.login });
        res.json({ token });
    } else {
        res.status(401).send();
    }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
