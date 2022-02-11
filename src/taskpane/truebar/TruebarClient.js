export default class TruebarClient {

    static async build(authServiceHost, authServicePort, truebarServiceHost, truebarServicePort, useSSL, requestTimeoutMs, username, password, isAuthError) {
        // Build URL for authentication requests
        let authUrl = (useSSL ? "https" : "http") + "://" + authServiceHost  // Use unsecure or secure websocket connection
        // if (authServicePort !== 80) authUrl += ":" + authServicePort         // Append port number if not default 80
        authUrl += "/auth/realms/truebar/protocol/openid-connect/token"

        // Construct base URL for truebar HTTP requests
        let truebarBaseUrl = (useSSL ? "https" : "http") + "://" + truebarServiceHost // Use unsecure or secure websocket connection
        // if (truebarServicePort !== 80) truebarBaseUrl += ":" + truebarServicePort     // Append port number if not default 80
        truebarBaseUrl += "/api"

        // Construct WebSocket URL
        let truebarWsUrl = (useSSL ? "wss" : "ws") + "://" + truebarServiceHost        // Use unsecure or secure websocket connection
        // if (truebarServicePort !== 80) truebarWsUrl += ":" + truebarServicePort        // Append port number if not default 80
        truebarWsUrl += "/ws"                                                          // append websocket endpoint

        // Authenticate with username and password for the first time
        let auth = await TruebarClient.authenticateWithUsernameAndPassword(authUrl, requestTimeoutMs, username, password, isAuthError)
        let configData = await TruebarClient.getConfig(auth.access_token)

        // Create TruebarClient
        return new TruebarClient(truebarBaseUrl, truebarWsUrl, requestTimeoutMs, authUrl, auth, configData)
    }
    
    static async getConfig(token) { 
            
        let response = await axios('http://localhost:3001/configuration?token=' + token, {
            method: 'GET',
        }).catch(function (error) {
            console.log(error.response.status)
            return "error"
        });
        
        return response.data
    }

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


    constructor(truebarBaseUrl, truebarWsUrl, requestTimeoutMs, authUrl, auth, configData) {
        this.truebarBaseUrl = truebarBaseUrl;
        this.truebarWsUrl = truebarWsUrl;
        this.requestTimeoutMs = requestTimeoutMs;
        this.wsClosedReason = undefined;
        this.auth = auth;
        this.messages = [];
        this.configData = configData;
        this.createTokenRefresher(authUrl, auth)
    }

    createTokenRefresher(authUrl) {
        // Set timeout for requestTimeout seconds before access_token expires
        setTimeout(async () => {
                // Refresh token
                this.auth = await TruebarClient.authenticateWithRefreshToken(authUrl, this.auth.refresh_token)

                // Create new timeout for next refresh
                this.createTokenRefresher(authUrl)

            },
            this.auth.expires_in * 1000 - this.requestTimeoutMs)
    }

    async openSession(onMessage, sessionId) {
        if (this.ws !== undefined) {
            throw "Can not open new session before previous is closed."
        }

        let queryParams = ["access_token=" + this.auth.access_token]
        if (sessionId !== undefined) {
            queryParams.push("session_id=" + sessionId)
        }

        return new Promise((resolve, reject) => {
            // Create WebSocket connection
            console.log(this.truebarWsUrl + "?" + queryParams.join("&"))

            this.ws = new WebSocket(this.truebarWsUrl + "?" + queryParams.join("&"))

            // Register callback for message processing
            this.ws.onmessage = (e) => {
                let message = JSON.parse(e.data)
                switch (message.messageType) {
                    // In case of INFO message (last part of session initialization) resolve the promise
                    case "INFO":

                        // Register new callback for unexpected WS close that sets clos reason.
                        this.ws.onclose = (e) => {
                            this.wsClosedReason = e.reason;
                        }

                        resolve({
                            sessionId: message.sessionId,
                            isNew: message.isNew,
                            previousRecordings: message.previousRecordings,
                            totalRecordedSeconds: message.totalRecordedSeconds
                        })
                        break;

                    // For transcripts and translations call user provided callback
                    case "TRANSCRIPT":
                        onMessage(message)
                        break;
                    case "TRANSLATION":
                        onMessage(message)
                        break;

                    // For any other message type throw exception (should never happen)
                    default:
                        throw "Unknown message type received: " + message.messageType
                }
            }

            // Reject promise on error
            this.ws.onerror = (e) => {
                reject("Websocket error detected" + e)
            }

            // Reject promise if websocket was closed before INFO message was received
            this.ws.onclose = (e) => {
                reject("Code: " + e.code + ". Reason: " + e.reason)
            }

        });
    }

    async closeSession() {
        if (this.ws === undefined) {
            throw "No active session to close." + this.wsClosedReason === undefined ? "" : "Reason : " + this.wsClosedReason
        }

        // Create promise that will be resolved when server closes WS connection
        let closePromise = new Promise((resolve, reject) => {

            // Resolve promise on successful close
            this.ws.onclose = (e) => {
                this.ws = undefined
                resolve(e.reason)
            }

            // Reject promise on error
            this.ws.onerror = (e) => {
                console.log("error")
                reject(e)
            }
        });

        // Send empty packet to request session closing
        this.ws.send(new ArrayBuffer(0));

        // Return unresolved promise
        return closePromise;
    }

    sendAudioChunk(data) {
        if (this.ws === undefined) {
            throw "No active session." + this.wsClosedReason === undefined ? "" : "Reason : " + this.wsClosedReason
        }
        this.ws.send(data)
    }
}
