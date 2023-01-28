const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const sendBtn = document.getElementById('send-btn');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const resgisterEmail = document.getElementById('registerEmail');
const registerPassword = document.getElementById('registerPassword');
const loginContainer = document.querySelector('.login');
const registerContainer = document.querySelector('.register');
const regexContainer = document.querySelector('.regex-container');
const reguex = document.getElementById('reguex');
const message = document.querySelector('.message');
const requests = document.querySelector('.requests');
const loader = document.querySelector('.lds-ellipsis');
const done = document.querySelector('.done');
const signUpBtn = document.getElementById('signUpBtn');
const signInBtn = document.getElementById('signInBtn');
const alert = document.querySelector('.alert');
var currentRequests = 5, token, ws;

// Register on click
registerBtn.addEventListener('click', () => {
    if (resgisterEmail.value != '' && registerPassword.value != '') {
        login('https://localhost:8000/register', {
            email: resgisterEmail.value,
            password: registerPassword.value
        }).then(res => {
            alert.style.display = "block";
            if (res.error != undefined) {
                alert.style.background = "#A11616";
                alert.innerHTML = res.error;
            } else {
                alert.style.display = "block";
                alert.innerHTML = "User registered successfully";
                alert.style.background = "#0FC956";
                loginContainer.style.display = "flex";
                registerContainer.style.display = "none";
            }
        }).catch((e) => console.log(e));
    }
});

// Login on click
loginBtn.addEventListener('click', () => {
    if (loginEmail.value != '' && loginPassword.value != '') {
        login('https://localhost:8000/login', {
            email: loginEmail.value,
            password: loginPassword.value
        }).then(res => {
            // If login is successful, save token and open the connection 
            // with WebSocketServer 
            if (res.error != undefined) {
                alert.style.background = "#A11616";
                alert.style.display = "block";
                alert.innerHTML = res.error;
            } else {
                alert.style.display = "none";
                token = res.data.token;
                openWsConnection(token);
                //Display none login form and display flex reguex form
                checkAuth();
            }
        }).catch((e) => console.log(e));
    }
});

// Sing up listener
signUpBtn.addEventListener('click', () => {
    loginContainer.style.display = "none";
    registerContainer.style.display = "flex";
});

// Sing in listener
signInBtn.addEventListener('click', () => {
    loginContainer.style.display = "flex";
    registerContainer.style.display = "none";
});

// Send regular expression to websocket on click
sendBtn.addEventListener('click', sendWsMessage);

function sendWsMessage() {
    if (ws && reguex.value != '') {
        // ws.send(JSON.parse(JSON.stringify(reguex.value)));
        ws.send(JSON.stringify({
            operation: reguex.value,
            requests: currentRequests
        }));
        if (currentRequests > 0) currentRequests--;
        loader.style.display = "inline-block";
        done.style.display = "none";
    } else {
        console.log('You\'re not login or input is empty');
    }
}

function openWsConnection(token) {
    // Connection with WebSocketServer passing token through params
    ws = new WebSocket("ws://localhost:3000/ws?token=" + token);

    // Send a message whenever the WebSocket connection opens.
    ws.onopen = (event) => {
        console.log("WebSocket connection established.");
    }

    ws.onmessage = (event) => {
        loader.style.display = "none";
        message.style.display = "block";
        let background = '#A11616';
        let color = '#fff';
        let result = "fa-solid fa-xmark";
        let donetext = "Error";
        try {
            message.innerHTML = '';
            if (!event.data.includes('<br>')) {
                background = '#0FC956';
                color = '#000';
                result = "fa-solid fa-check";
                donetext = "Done";
            }
        } catch (e) { }
        finally {
            requests.innerHTML = `Requests left: ${currentRequests}`;
            done.style.display = "flex";
            done.children[0].className = result;
            done.children[1].innerHTML = donetext;
            message.innerHTML = event.data;
            message.style.background = background;
            message.style.color = color;
        }
    }

    ws.onerror = (event) => {
        console.log("WebSocket error received: ", event.data);
    }

    ws.onclose = (event) => {
        console.log("WebSocket connection closed.");
        // Remove item reguex's send button when websocket connection is closed
        sendBtn.removeEventListener('click', sendWsMessage);
    }
}

function checkAuth() {
    if (token != undefined || token != null) {
        registerContainer.style.display = "none";
        loginContainer.style.display = "none";
        regexContainer.style.display = "flex";
    }
}

// Login fetch to express server
async function login(url, data) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': "http://localhost:3000"
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// Location function
function getLocation() {
    const successCb = (position) => {
        const {
            latitude,
            longitude
        } = position.coords;
        console.log(`Your location: ${latitude}, ${longitude}`);
    }
    const errorCb = (error) => {
        console.log(error);
    }
    navigator.geolocation.getCurrentPosition(successCb, errorCb);
}

getLocation();