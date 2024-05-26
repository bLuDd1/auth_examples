const axios = require("axios");
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

const changeUserPassword = async (accessToken, userId, newPassword) => {
    const url = `https://dev-hprfnpe8wc6pu5rn.us.auth0.com/api/v2/users/${userId}`;

    const data = {
        password: newPassword,
        connection: 'Username-Password-Authentication'
    };

    try {
        const response = await axios.patch(url, data, {
            headers: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('Password change response:', response.data);
    } catch (error) {
        console.error('Error changing user password:', error.response ? error.response.data : error.message);
    }
};

const main = async () => {
    const userId = 'auth0|665390e13d0a9374995d1899';
    const newPassword = 'asfgasatsa';

    const accessToken = await getToken();
    if (accessToken) {
        console.log('Access Token:', accessToken);

        await changeUserPassword(accessToken, userId, newPassword);
    }
};

main();

