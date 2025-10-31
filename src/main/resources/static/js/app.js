// ============================================
// CHAT APP - WebSocket Client with Session Management
// ============================================

let stompClient = null;
let username = "";
let isConnected = false;

const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messagesDiv = document.getElementById('messages');
const disconnectBtn = document.getElementById('disconnectBtn');

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const storedUsername = sessionStorage.getItem('currentUsername');

    if (!storedUsername) {
        // User not logged in - redirect to login page
        window.location.href = '/';
        return;
    }

    username = storedUsername;

    // Auto-connect to chat
    connect();
});

// ============================================
// CONNECT TO WEBSOCKET
// ============================================

function connect() {
    const socket = new SockJS('/chat');
    stompClient = Stomp.over(socket);

    // Disable debug output for cleaner console
    stompClient.debug = null;

    stompClient.connect({ username: username }, function (frame) {
        isConnected = true;

        // Enable message input
        messageInput.disabled = false;
        sendButton.disabled = false;

        // Subscribe to receive messages
        stompClient.subscribe('/topic/messages', onMessageReceived);
        stompClient.subscribe('/topic/onlineUsers', onlineUsersReceived);

        // Load message history from database
        loadMessageHistory();

        // Load initial online users list
        loadOnlineUsers();
    }, function (error) {
        console.error('❌ Connection failed:', error);
        isConnected = false;
        messageInput.disabled = true;
        sendButton.disabled = true;
        showError('Failed to connect to chat server. Make sure the backend is running.');
    });
}

// ============================================
// SEND MESSAGE
// ============================================

function sendMessage() {
    const messageText = messageInput.value.trim();

    if (!messageText) {
        return;
    }

    if (!isConnected) {
        showError('Not connected to chat. Please refresh the page.');
        return;
    }

    try {
        const message = {
            sender: username,
            text: messageText
        };

        // Send to server via WebSocket
        stompClient.send("/app/chat", {}, JSON.stringify(message));

        // Clear input field
        messageInput.value = '';
        messageInput.focus();
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message. Please try again.');
    }
}

// ============================================
// RECEIVE MESSAGE
// ============================================

function onMessageReceived(payload) {
    const message = JSON.parse(payload.body);
    displayMessage(message);
}

// ============================================
// RECEIVE ONLINE USERS UPDATE
// ============================================

function onlineUsersReceived(payload) {
    const users = JSON.parse(payload.body);
    updateOnlineUsersList(users);
}

// ============================================
// UPDATE ONLINE USERS LIST
// ============================================

function updateOnlineUsersList(users) {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '';

    // Sort users alphabetically
    const sortedUsers = [...users].sort();

    sortedUsers.forEach(user => {
        const listItem = document.createElement('li');

        if (user === username) {
            listItem.classList.add('current-user');
        }

        listItem.textContent = user;
        userListElement.appendChild(listItem);
    })
}

// ============================================
// DISPLAY MESSAGE
// ============================================

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    // Check if message is from current user
    if (message.sender === username) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    const senderSpan = document.createElement('strong');
    senderSpan.textContent = message.sender;

    const textSpan = document.createElement('span');
    textSpan.textContent = message.text;

    const timeSpan = document.createElement('small');
    timeSpan.classList.add('message-time');
    if (message.timestamp) {
        const date = new Date(message.timestamp);
        timeSpan.textContent = date.toLocaleTimeString();
    }

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(textSpan);
    messageElement.appendChild(timeSpan);

    messagesDiv.appendChild(messageElement);

    // Auto-scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================================
// LOAD MESSAGE HISTORY
// ============================================

function loadMessageHistory() {
    fetch('/api/messages')
        .then(response => response.json())
        .then(messages => {
            messages.forEach(message => displayMessage(message));
        })
        .catch(error => {
            console.error('Failed to load message history:', error);
            showError('Could not load message history.');
        });
}

// ============================================
// LOAD ONLINE USERS
// ============================================

function loadOnlineUsers() {
    fetch('/api/online-users')
        .then(response => response.json())
        .then(users => {
            updateOnlineUsersList(users);
        })
        .catch(error => {
            console.error('Failed to load online users:', error);
        });
}

// ============================================
// DISCONNECT / LOGOUT
// ============================================

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect();
    }

    // Clear session storage
    sessionStorage.removeItem('currentUsername');

    // Redirect to login
    window.location.href = '/';
}

// ============================================
// ERROR HANDLING
// ============================================

function showError(message) {
    console.error('⚠️', message);
    alert(message);
}

// ============================================
// EVENT LISTENERS
// ============================================

sendButton.addEventListener('click', sendMessage);

disconnectBtn.addEventListener('click', function () {
    if (confirm('Are you sure you want to disconnect?')) {
        disconnect();
    }
});

// Allow sending with Enter key
messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});