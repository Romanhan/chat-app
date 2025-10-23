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
const currentUserSpan = document.querySelector('#currentUser strong');

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    // Check if user is logged in
    const storedUsername = sessionStorage.getItem('currentUsername');

    if (!storedUsername) {
        // User not logged in - redirect to login page
        console.log('No username found in session. Redirecting to login...');
        window.location.href = '/';
        return;
    }

    username = storedUsername;
    currentUserSpan.textContent = username;

    console.log('✅ User session found:', username);

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

    stompClient.connect({}, function (frame) {
        console.log('✅ Connected to chat server');
        isConnected = true;

        // Enable message input
        messageInput.disabled = false;
        sendButton.disabled = false;

        // Subscribe to receive messages
        stompClient.subscribe('/topic/messages', onMessageReceived);

        // Load message history from database
        loadMessageHistory();
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
    messageElement.appendChild(document.createElement('br'));
    messageElement.appendChild(textSpan);
    messageElement.appendChild(document.createElement('br'));
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
            console.log('📋 Loaded', messages.length, 'messages from history');
            messages.forEach(message => displayMessage(message));
        })
        .catch(error => {
            console.error('Failed to load message history:', error);
            showError('Could not load message history.');
        });
}

// ============================================
// DISCONNECT / LOGOUT
// ============================================

function disconnect() {
    if (stompClient !== null) {
        stompClient.disconnect(function () {
            console.log('✅ Disconnected from chat');
        });
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