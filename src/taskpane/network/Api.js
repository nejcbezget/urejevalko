
export default class Api {

    static async authenticateWithUsernameAndPassword(url, timeout, username, password, isAuthError) {
        const data = new URLSearchParams();
        data.append('grant_type', 'password');
        data.append('username', username);
        data.append('password', password);
        data.append('client_id', "truebar-client");

        let response = await axios(url, {
            method: 'POST',
            timeout: timeout,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        }).catch(function (error) {
            console.log(error.response.status)
            isAuthError(true)
            document.getElementById("stopBtn").click()
            return "error"
          });
            
        return response.data
    }

    static async authenticateWithRefreshToken(url, timeout, refreshToken) {
        const data = new URLSearchParams();
        data.append('grant_type', 'refresh_token');
        data.append('refresh_token', refreshToken);
        data.append('client_id', "truebar-client");

        let response = await axios(url, {
            method: 'POST',
            timeout: timeout,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        })

        return response.data
    }

    static async getConfig(token) { 
            
        let response = await axios('https://demo-api.true-bar.si/api/client/configuration', {
            method: 'GET',
            headers: {Authorization: `Bearer ` + token}
        }).catch(function (error) {
            console.log(error.response.status)
            return "error"
        });
        
        return response.data
    }

    static async patchConfig(token, doPunctuation) { 
            
        await axios("https://demo-api.true-bar.si/api/client/configuration", {
            method: 'PATCH',
            headers: {Authorization: `Bearer ${token}`},
            data: {
                transcriptionDoPunctuation: doPunctuation,
            }
	    })
    }

}