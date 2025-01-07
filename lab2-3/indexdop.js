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

app.use(async (req, res, next) => {
    const session = req.session;

    if (session?.token) {
        const now = Math.floor(Date.now() / 1000);

        try {
            const decoded = JSON.parse(Buffer.from(session.token.split('.')[1], 'base64').toString('utf-8'));
            const exp = decoded.exp;

            if (exp - now <= 60) {
                const refreshResponse = await axios.post(auth0Config.url, new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: auth0Config.clientId,
                    client_secret: auth0Config.clientSecret,
                    refresh_token: session.refresh_token,
                }).toString(), {
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                });

                session.token = refreshResponse.data.access_token;
            }
        } catch (error) {
            console.error('Error refreshing token:', error.message);
        }
    }

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
    res.sendFile(path.join(__dirname + '/indexdop.html'));
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

app.post('/api/register', async (req, res) => {
    const { login, password, username } = req.body;

    try {
        const managementToken = await getManagementToken();
        const response = await axios.post(`https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/users`, {
            email: login,
            password,
            connection: 'Username-Password-Authentication',
            user_metadata: { username },
        }, {
            headers: {
                Authorization: `Bearer ${managementToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json({ message: 'User registered successfully!', userId: response.data.user_id });
    } catch (error) {
        console.error('Registration failed:', error.response?.data || error.message);
        res.status(400).json({ error: 'Failed to register user' });
    }
});

app.post('/api/refresh-token', async (req, res) => {
    const { refresh_token } = req.body;

    try {
        const response = await axios.post(auth0Config.url, new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: auth0Config.clientId,
            client_secret: auth0Config.clientSecret,
            refresh_token,
        }).toString(), {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        });

        res.json({
            token: response.data.access_token,
            refresh_token: response.data.refresh_token || refresh_token,
        });
    } catch (error) {
        console.error('Token refresh failed:', error.response?.data || error.message);
        res.status(401).json({ error: 'Failed to refresh token' });
    }
});

async function getManagementToken() {
    const response = await axios.post(auth0Config.url, new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: auth0Config.clientId,
        client_secret: auth0Config.clientSecret,
        audience: auth0Config.audience,
    }).toString(), {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    return response.data.access_token;
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
