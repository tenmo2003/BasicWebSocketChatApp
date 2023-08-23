'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var chatName = document.querySelector('.chatName');

var stompClient = null;
var username = null;

var usersList = document.querySelector('#userList');

var colors = ['#2196F3', '#32c787', '#00BCD4', '#ff5652', '#ffc107', '#ff85af', '#FF9800', '#39bbb0'];

var weatherIconButton = document.getElementById("weatherIconButton");

var chats = {};

// Get the reference to the userList element
var userList = document.getElementById('userList');

// Get all list items within the userList
var listItems = userList.getElementsByTagName('li');

var currentSelectedUser = "Global Chat";

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if (username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        stompClient.connect({}, onConnected, onError);
    }

    event.preventDefault();
}

function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/global/public', onMessageReceived);
    stompClient.subscribe('/user/' + username + '/private', onPrivateMessageReceived);
    stompClient.subscribe('/onlineUsers', onNewUserConnect);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser", {}, JSON.stringify({sender: username, type: 'JOIN'}));
    connectingElement.classList.add('hidden');
}

function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = '#ff0000'; // red
}

function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else if (message.type === 'CHAT'){
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

    //append into chats["publicChats"]
    if (!chats["Global Chat"]) {
        chats["Global Chat"] = [];
    }

    if (message.sender !== username || message.type !== "CHAT") {
        chats["Global Chat"].push(message);
    }
    
    updateChatArea(chats["Global Chat"], "Global Chat");
    currentSelectedUser = "Global Chat";
    
}


function onPrivateMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    messageElement.classList.add('chat-message');

    var avatarElement = document.createElement('i');
    var avatarText = document.createTextNode(message.sender[0]);
    avatarElement.appendChild(avatarText);
    avatarElement.style['background-color'] = getAvatarColor(message.sender);
    messageElement.appendChild(avatarElement);

    var usernameElement = document.createElement('span');
    var usernameText = document.createTextNode(message.sender);
    usernameElement.appendChild(usernameText);
    messageElement.appendChild(usernameElement);

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);
    messageElement.appendChild(textElement);
    
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

    if (message.weatherSender) {
        var userExisting = false;
        //check if sender is in usersList yet
        for (var i = 0; i < usersList.getElementsByTagName('li').length; i++) {
            var user = usersList.getElementsByTagName('li')[i];
            if (user.textContent === message.weatherSender) {
                userExisting = true;
            }
        }

        if (!userExisting) {
            // If the sender's chat array doesn't exist, create it
            var payload = {
                body: JSON.stringify({
                    sender: message.weatherSender,
                    type: 'JOIN'
                })
            }
            
            onNewUserConnect(payload);
        }


        if (!chats[message.weatherSender]) {
            // If the sender's chat array doesn't exist, create it
            chats[message.weatherSender] = [];
        }

        if (message.weatherSender !== username) {
            chats[message.weatherSender].push(message);
        }

        updateChatArea(chats[message.weatherSender], message.weatherSender);
        currentSelectedUser = message.weatherSender;
    } else {
        var userExisting = false;
        //check if sender is in usersList yet
        for (var i = 0; i < usersList.getElementsByTagName('li').length; i++) {
            var user = usersList.getElementsByTagName('li')[i];
            if (user.textContent === message.sender) {
                userExisting = true;
            }
        }
    
        if (!userExisting) {
            // If the sender's chat array doesn't exist, create it
            var payload = {
                body: JSON.stringify({
                    sender: message.sender,
                    type: 'JOIN'
                })
            }
            
            onNewUserConnect(payload);
        }
    
    
        if (!chats[message.sender]) {
            // If the sender's chat array doesn't exist, create it
            chats[message.sender] = [];
        }
    
        if (message.sender !== username) {
            chats[message.sender].push(message);
        }
    
        updateChatArea(chats[message.sender], message.sender);
        currentSelectedUser = message.sender;
    }
}



function onNewUserConnect(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    //add message content to message element
    var messageText = document.createTextNode(message.sender);
    messageElement.appendChild(messageText);

    usersList.appendChild(messageElement);

    for (var i = 0; i < usersList.getElementsByTagName('li').length; i++) {
        var user = usersList.getElementsByTagName('li')[i];
        user.addEventListener('click', function(event) {
            var element = event.target;
            var chatContent;
            currentSelectedUser = element.textContent;
            if (element.textContent === "Global Chat") {
                // Load data from dictionary["publicChat"] for global chat
                chatContent = chats["Global Chat"] || [];
            } else {
                // Load data from dictionary[username] for user chat
                var username = element.textContent;
                chatContent = chats[username] || [];
            }
    
            updateChatArea(chatContent, element.textContent);
        });
    }
    
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();

    if (messageContent) {
        var chatMessage = {sender: username, content: messageContent, type: 'CHAT'};


        if (currentSelectedUser === "Global Chat") {
            chatMessage.receiver = "Global Chat";
            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        } else {
            chatMessage.receiver = currentSelectedUser;
            stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
        }
        
        messageInput.value = '';


        if (!chats[currentSelectedUser]) {
            // If the sender's chat array doesn't exist, create it
            chats[currentSelectedUser] = [];
        }

        chats[currentSelectedUser].push(chatMessage);

        updateChatArea(chats[currentSelectedUser], currentSelectedUser);
    }
    
    event.preventDefault();
}

function sendWeatherMessage(event) {
    // get data from api
    var weatherLocation = messageInput.value.trim();

    if (weatherLocation) {
        var weatherMessage;


        fetch("http://api.weatherapi.com/v1/current.json?key=441c8e026ba1440cbbd140748232008&q=" + weatherLocation + "&aqi=no").then(response => response.json()).then(data => {
            var messageContent = "Current weather in " + data.location.name + ", " + data.location.country + ": " +
                                data.current.temp_c + "°C. It's " + data.current.condition.text.toLowerCase() +
                                " with a " + data.current.humidity + "% humidity. The wind is coming from the " +
                                data.current.wind_dir + " at a speed of " + data.current.wind_kph + " km/h. The pressure is " +
                                data.current.pressure_mb + " mb and visibility is " + data.current.vis_km + " km. Feels like " +
                                data.current.feelslike_c + "°C. UV index is " + data.current.uv + ".";

            var avatar = data.current.condition.icon;

            weatherMessage = {sender: "Weather", content: messageContent, type: 'CHAT', avatar: avatar, weatherSender: username};

            console.log(currentSelectedUser);

            if (currentSelectedUser === "Global Chat") {
                weatherMessage.receiver = "Global Chat";
                stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(weatherMessage));
            } else {
                weatherMessage.receiver = currentSelectedUser;
                stompClient.send("/app/private-message", {}, JSON.stringify(weatherMessage));
                if (!chats[currentSelectedUser]) {
                    // If the sender's chat array doesn't exist, create it
                    chats[currentSelectedUser] = [];
                }
                chats[currentSelectedUser].push(weatherMessage);

                updateChatArea(chats[currentSelectedUser], currentSelectedUser);
            }
        });

        messageInput.value = '';
    }

    event.preventDefault();
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }

    var index = Math.abs(hash % colors.length);
    return colors[index];
}


function updateChatArea(messages, chatName) {
    messageArea.innerHTML = '';
    document.querySelector('.chatName').textContent = chatName;

    for (var i = 0; i < messages.length; i++) {
        var message = messages[i];
        var messageElement = document.createElement('li');
        if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
        } else if (message.type === 'LEAVE') {
            messageElement.classList.add('event-message');
            message.content = message.sender + ' left!';
        } else {
            messageElement.classList.add('chat-message');

            var avatarElement = document.createElement('i');
            if (message.avatar) {
                var avatarIcon = document.createElement('img');
                avatarIcon.src = message.avatar;
                avatarElement.appendChild(avatarIcon);
            } else {
                var avatarText = document.createTextNode(message.sender[0]);
                avatarElement.appendChild(avatarText);
                avatarElement.style['background-color'] = getAvatarColor(message.sender);

            }
            
            avatarElement.addEventListener('click', function(event) {
                currentSelectedUser = message.sender;
    
                var userExisting = false;
                //check if sender is in usersList yet
                for (var i = 0; i < usersList.getElementsByTagName('li').length; i++) {
                    var user = usersList.getElementsByTagName('li')[i];
                    if (user.textContent === message.sender) {
                        userExisting = true;
                    }
                }
    
                if (!userExisting) {
                    // If the sender's chat array doesn't exist, create it
                    var payload = {
                        body: JSON.stringify({
                            sender: message.sender,
                            type: 'JOIN'
                        })
                    }
                    
                    onNewUserConnect(payload);
                }
    
                updateChatArea(chats[currentSelectedUser], currentSelectedUser);
            });

            messageElement.appendChild(avatarElement);

            var usernameElement = document.createElement('span');
            var usernameText = document.createTextNode(message.sender);

            usernameElement.addEventListener('click', function(event) {
                currentSelectedUser = message.sender;
    
                var userExisting = false;
                for (var i = 0; i < usersList.getElementsByTagName('li').length; i++) {
                    var user = usersList.getElementsByTagName('li')[i];
                    if (user.textContent === message.sender) {
                        userExisting = true;
                    }
                }
    
                if (!userExisting) {
                    var payload = {
                        body: JSON.stringify({
                            sender: message.sender,
                            type: 'JOIN'
                        })
                    }
                    
                    onNewUserConnect(payload);
                }
    
                updateChatArea(chats[currentSelectedUser], currentSelectedUser);
            });

            usernameElement.appendChild(usernameText);
            messageElement.appendChild(usernameElement);
        }

        var textElement = document.createElement('p');
        var messageText = document.createTextNode(message.content);
        textElement.appendChild(messageText);

        messageElement.appendChild(textElement);


        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;

    }

    messageArea.scrollTop = messageArea.scrollHeight;
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
weatherIconButton.addEventListener('click', sendWeatherMessage, true);