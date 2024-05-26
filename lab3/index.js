const axios = require('axios');

const getUserToken = async (username, password) => {
    const tokenOptions = {
        method: 'POST',
        url: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: new URLSearchParams({
            grant_type: 'password',
            scope: 'offline_access',
            username: username,
            password: password,
            audience: 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/',
            client_id: 'XAh2jhZkd4v6PtufeXtWDD9WWcfJeNkQ',
            client_secret: 'fY2YQ9AJHlpB9sSwEXymn1j-SaLvv_s8uQKeXLI4QhFiSLc9m8Da9rPUhAKDFQqZ'
        })
    };

    try {
        const response = await axios(tokenOptions);
        return response.data;
    } catch (error) {
        console.error('Error getting user token:', error.response ? error.response.data : error.message);
        return null;
    }
};

const refreshUserToken = async (refresh_token) => {
    const data = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'XAh2jhZkd4v6PtufeXtWDD9WWcfJeNkQ',
        client_secret: 'fY2YQ9AJHlpB9sSwEXymn1j-SaLvv_s8uQKeXLI4QhFiSLc9m8Da9rPUhAKDFQqZ',
        refresh_token: refresh_token,
    });

    const url = 'https://dev-hprfnpe8wc6pu5rn.us.auth0.com/oauth/token';

    try {
        const response = await axios.post(url, data, {
            headers: {'content-type': 'application/x-www-form-urlencoded'}
        });
        return response.data;
    } catch (error) {
        console.error('Error refreshing token:', error.response ? error.response.data : error.message);
        return null;
    }
}

const main = async () => {
    const username = 'adidas97@gmail.com';
    const password = 'adfwetwgwg12@1';

    const userToken = await getUserToken(username, password);
    if (userToken) {
        console.log('User Token:', userToken);

        const refreshToken = userToken.refresh_token;
        const refreshedToken = await refreshUserToken(refreshToken);
        if (refreshedToken) {
            console.log('Refreshed Token:', refreshedToken);
        }
    }
};

main();
