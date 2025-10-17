// ============================================
// CHAT APP - WebSocket Client with AutoConnect
// ============================================

let stompClient = null;
let username = "";
let isConnected = false;

const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messagesDiv = document.getElementById('messages');

// ============================================
// AUTO-CONNECT: Connect when sending first message
// ============================================

async function ensureConnected() {
    if (isConnected) {
        return; // Already connected
    }

    if (!usernameInput.value.trim()) {
        alert('Please enter your name first!');
        messageInput.focus();
        return;
    }

    username = usernameInput.value.trim();
    usernameInput.disabled = true;

    const socket = new SockJS('/chat');
    stompClient = Stomp.over(socket);

    // Disable debug output for cleaner console
    stompClient.debug = null;

    return new Promise((resolve, reject) => {
        try {
            stompClient.connect({}, function (frame) {
                console.log('✅ Connected to chat server');
                isConnected = true;

                // Subscribe to receive messages
                stompClient.subscribe('/topic/messages', onMessageReceived);

                // Load message history from database
                loadMessageHistory();

                resolve();
            }, function (error) {
                isConnected = false;
                usernameInput.disabled = false;
                console.error('❌ Connection failed:', error);
                alert('Failed to connect. Make sure the server is running on localhost:8080');
                reject(error);
            });
        } catch (error) {
            isConnected = false;
            usernameInput.disabled = false;
            console.error('❌ Connection error:', error);
            reject(error);
        }
    });
}

// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {
    const messageText = messageInput.value.trim();

    if (!messageText) {
        return;
    }

    try {
        // Connect if not already connected
        await ensureConnected();

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

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(document.createElement('br'));
    messageElement.appendChild(textSpan);

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
        .catch(error => console.error('Failed to load message history:', error));
}

// ============================================
// EVENT LISTENERS
// ============================================

sendButton.addEventListener('click', sendMessage);

// Allow sending with Enter key
messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});