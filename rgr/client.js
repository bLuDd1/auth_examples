const net = require('net');
const crypto = require('crypto');

let sessionKey = null;

const generateSessionKey = (clientRandom, serverRandom, premasterSecret) => {
    return crypto.createHash('sha256')
        .update(clientRandom + serverRandom + premasterSecret)
        .digest();
};

const encryptWithSessionKey = (data, key) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decryptWithSessionKey = (data, key) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.alloc(16, 0));
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

const clientRandom = crypto.randomBytes(16).toString('hex');

const client = net.createConnection({ port: 3000 }, () => {
    console.log('Connected to server.');

    const clientHello = `hello-${clientRandom}`;
    console.log(`Sending to server: ${clientHello}`);

    client.write(`${clientHello}\n`);
});

let serverPublicKey = '';
let serverRandom = '';
let premasterSecret = '';

client.on('data', (data) => {
    const message = data.toString().trim();
    console.log(`Received from server: ${message}`);

    if (message.startsWith('server-hello')) {
        serverRandom = message.split('-')[2];
    } else if (message.startsWith('-----BEGIN PUBLIC KEY-----')) {
        serverPublicKey = message;

        premasterSecret = `premaster-${crypto.randomBytes(16).toString('hex')}`;
        console.log(`Generated premaster secret: ${premasterSecret}`);

        const encryptedPremaster = crypto.publicEncrypt(
            {
                key: serverPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            Buffer.from(premasterSecret)
        );

        console.log(`Sending encrypted premaster secret to server.`);
        client.write(`encrypted-premaster:${encryptedPremaster.toString('hex')}\n`);
    } else if (sessionKey === null) {
        sessionKey = generateSessionKey(clientRandom, serverRandom, premasterSecret);
        console.log('Session key generated:', sessionKey.toString('hex'));

        const decryptedReady = decryptWithSessionKey(message, sessionKey);
        console.log(`Decrypted ready message from server: ${decryptedReady}`);

        if (decryptedReady === 'ready') {
            const readyMessage = encryptWithSessionKey('ready', sessionKey);
            console.log(`Sending encrypted ready message: ${readyMessage}`);
            client.write(`${readyMessage}\n`);
        }
    } else {
        const decryptedMessage = decryptWithSessionKey(message, sessionKey);
        console.log(`Decrypted secure message from server: ${decryptedMessage}`);

        if (decryptedMessage === 'secure-channel-ready') {
            const secureData = encryptWithSessionKey('data:Hello, secure world!', sessionKey);
            console.log(`Sending secure data: ${secureData}`);
            client.write(`${secureData}\n`);
        }
    }
});

client.on('end', () => {
    console.log('Disconnected from server.');
});