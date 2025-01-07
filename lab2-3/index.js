const axios = require('axios');
const uuid = require('uuid');
const express = require('express');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const SESSION_KEY = 'Authorization';

class Session {
    #sessions = {}

    constructor() {
        try {
            this.#sessions = fs.readFileSync('./sessions.json', 'utf8');
            this.#sessions = JSON.parse(this.#sessions.trim());
        } catch (e) {
            this.#sessions = {};
        }
    }

    #storeSessions() {
        fs.writeFileSync('./sessions.json', JSON.stringify(this.#sessions), 'utf-8');
    }

    set(key, value) {
        if (!value) {
            value = {};
        }
        this.#sessions[key] = value;
        this.#storeSessions();
    }

    get(key) {
        return this.#sessions[key];
    }

    init(res) {
        const sessionId = uuid.v4();
        this.set(sessionId);

        return sessionId;
    }

    destroy(req, res) {
        const sessionId = req.sessionId;
        delete this.#sessions[sessionId];
        this.#storeSessions();
    }
}

const sessions = new Session();

app.use((req, res, next) => {
    let currentSession = {};
    let sessionId = req.get(SESSION_KEY);

    if (sessionId) {
        currentSession = sessions.get(sessionId);
        if (!currentSession) {
            currentSession = {};
            sessionId = sessions.init(res);
        }
    } else {
        sessionId = sessions.init(res);
    }

    req.session = currentSession;
    req.sessionId = sessionId;

    onFinished(req, () => {
        const currentSession = req.session;
        const sessionId = req.sessionId;
        sessions.set(sessionId, currentSession);
    });

    next();
});

app.get('/', (req, res) => {
    if (req.session.username) {
        return res.json({
            username: req.session.username,
            logout: 'http://localhost:3000/logout'
        });
    }
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/logout', (req, res) => {
    sessions.destroy(req, res);
    res.redirect('/');
});

const auth0Config = {
    url: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/oauth/token',
    clientId: 'XAh2jhZkd4v6PtufeXtWDD9WWcfJeNkQ',
    clientSecret: 'fY2YQ9AJHlpB9sSwEXymn1j-SaLvv_s8uQKeXLI4QhFiSLc9m8Da9rPUhAKDFQqZ',
    audience: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/'
};

app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const response = await axios.post(auth0Config.url, new URLSearchParams({
            grant_type: 'password',
            username: login,
            password: password,
            audience: auth0Config.audience,
            client_id: auth0Config.clientId,
            client_secret: auth0Config.clientSecret,
            scope: 'offline_access'
        }).toString(), {
            headers: { 'content-type': 'application/x-www-form-urlencoded' }
        });

        const tokenData = response.data;

        req.session.username = login;
        req.session.token = tokenData.access_token;
        req.session.refresh_token = tokenData.refresh_token;

        res.json({ token: req.sessionId });
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        res.status(401).send({ error: 'Invalid credentials' });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
