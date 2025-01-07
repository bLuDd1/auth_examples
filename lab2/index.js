const axios = require('axios');

const getToken = async () => {
    const tokenOptions = {
        method: 'POST',
        url: 'https://kpi.eu.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
            audience: 'https://kpi.eu.auth0.com/api/v2/',
            grant_type: 'client_credentials',
            client_id: 'JIvCO5c2IBHlAe2patn6l6q5H35qxti0',
            client_secret: 'ZRF8Op0tWM36p1_hxXTU-B0K_Gq_-eAVtlrQpY24CasYiDmcXBhNS6IJMNcz1EgB'
        })
    };

    try {
        const response = await axios(tokenOptions);
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

const createUser = async (accessToken) => {
    const userOptions = {
        method: 'POST',
        url: 'https://kpi.eu.auth0.com/api/v2/users',
        headers: {
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json'
        },
        data: {
            email: 'adidas97@gmail.com',
            password: 'adbagaagaDDA12!',
            connection: 'Username-Password-Authentication'
        }
    };

    try {
        const response = await axios(userOptions);
        console.log('User created:', response.data);
    } catch (error) {
        console.error('Error creating user:', error);
    }
};

const main = async () => {
    const token = await getToken();
    if (token) {
        await createUser(token);
    }
};

main();
