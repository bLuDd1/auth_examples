const crypto = require('crypto');
const net = require('net');

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

const server = net.createServer((socket) => {
    console.log('Client connected.');

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    const serverRandom = crypto.randomBytes(16).toString('hex');
    let premasterSecret = '';
    let clientRandom = '';

    socket.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`Received from client: ${message}`);

        if (message.startsWith('hello')) {
            clientRandom = message.split('-')[1];
            const serverHello = `server-hello-${serverRandom}`;
            console.log(`Sending to client: ${serverHello}`);

            socket.write(`${serverHello}\n`);
            socket.write(`${publicKey.export({ type: 'spki', format: 'pem' })}\n`);
        } else if (message.startsWith('encrypted-premaster:')) {
            const encryptedPremaster = Buffer.from(message.split(':')[1], 'hex');

            premasterSecret = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                },
                encryptedPremaster
            ).toString();

            console.log(`Decrypted premaster secret: ${premasterSecret}`);

            sessionKey = generateSessionKey(clientRandom, serverRandom, premasterSecret);
            console.log('Session key generated:', sessionKey.toString('hex'));

            const readyMessage = encryptWithSessionKey('ready', sessionKey);
            console.log(`Sending encrypted ready message: ${readyMessage}`);
            socket.write(`${readyMessage}\n`);
        } else {
            const decryptedMessage = decryptWithSessionKey(message, sessionKey);
            console.log(`Decrypted message from client: ${decryptedMessage}`);

            if (decryptedMessage === 'ready') {
                const secureMessage = encryptWithSessionKey('secure-channel-ready', sessionKey);
                console.log(`Sending secure channel ready message: ${secureMessage}`);
                socket.write(`${secureMessage}\n`);
            } else if (decryptedMessage.startsWith('data:')) {
                console.log(`Secure data received: ${decryptedMessage.slice(5)}`);
            }
        }
    });

    socket.on('end', () => {
        console.log('Client disconnected.');
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000.');
});