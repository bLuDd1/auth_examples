const axios = require('axios');

const getToken = async () => {
    const tokenOptions = {
        method: 'POST',
        url: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
            audience: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/',
            grant_type: 'client_credentials',
            client_id: 'XAh2jhZkd4v6PtufeXtWDD9WWcfJeNkQ',
            client_secret: 'fY2YQ9AJHlpB9sSwEXymn1j-SaLvv_s8uQKeXLI4QhFiSLc9m8Da9rPUhAKDFQqZ'
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
        url: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/users',
        headers: {
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json'
        },
        data: {
            email: 'adidas97@gmail.com',
            password: 'adfwetwgwg12@',
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
