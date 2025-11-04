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
    messageElement.dataset.messageId = message.id;

    // Check if message is from current user
    if (message.sender === username) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    const senderSpan = document.createElement('strong');
    senderSpan.textContent = message.sender;

    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.textContent = message.text;

    const timeSpan = document.createElement('small');
    timeSpan.classList.add('message-time');
    if (message.timestamp) {
        const date = new Date(message.timestamp);
        timeSpan.textContent = date.toLocaleTimeString();
    }

    if (message.edited && !message.deleted) {
        const editedLabel = document.createElement('span');
        editedLabel.classList.add('edited-label');
        editedLabel.textContent = ' [edited]';
        timeSpan.appendChild(editedLabel);
    }

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(textSpan);
    messageElement.appendChild(timeSpan);

    messagesDiv.appendChild(messageElement);

    // Add edit/delete buttons only for your own messages
    if (message.sender === username && !message.deleted) {
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');

        const editBtn = document.createElement('button');
        editBtn.classList.add('btn-edit');
        editBtn.textContent = '📝';
        editBtn.title = 'Edit message';
        editBtn.onclick = () => startEditMessage(messageElement, message);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn-delete');
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete message';
        deleteBtn.onclick = () => deleteMessage(message.id, messageElement);

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        messageElement.appendChild(actionsDiv);
    }

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
// START EDIT MESSAGE
// ============================================

function startEditMessage(messageElement, message) {
    if (messageElement.querySelector('.edit-input')) {
        return; // Already in edit mode
    }

    const textSpan = messageElement.querySelector('.message-text');
    const originalText = textSpan.textContent;

    textSpan.style.display = 'none';

    const actionsDiv = messageElement.querySelector('.message-actions');
    if (actionsDiv) {
        actionsDiv.style.display = 'none';
    }

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.classList.add('edit-input');
    editInput.value = originalText;

    const editActionsDiv = document.createElement('div');
    editActionsDiv.classList.add('edit-actions');

    const saveBtn = document.createElement('button');
    saveBtn.classList.add('btn-save');
    saveBtn.textContent = '💾 Save';
    saveBtn.onclick = () => {
        saveEditedMessage(message.id, editInput.value, messageElement, originalText);
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('btn-cancel');
    cancelBtn.textContent = '❌ Cancel';
    cancelBtn.onclick = () => {
        cancelEdit(messageElement, textSpan, actionsDiv, editInput, editActionsDiv);
    };

    editActionsDiv.appendChild(saveBtn);
    editActionsDiv.appendChild(cancelBtn);

    const timeSpan = messageElement.querySelector('.message-time');
    messageElement.insertBefore(editInput, timeSpan);
    messageElement.insertBefore(editActionsDiv, timeSpan);

    editInput.focus();
    editInput.select();

    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEditedMessage(message.id, editInput.value, messageElement, originalText);
        }
    });

    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelEdit(messageElement, textSpan, actionsDiv, editInput, editActionsDiv);
        }
    });
}

// ============================================
// SAVE EDITED MESSAGE
// ============================================

async function saveEditedMessage(messageId, newText, messageElement, originalText) {
    const trimmedText = newText.trim();

    if (!trimmedText) {
        showError('Message cannot be empty');
        return;
    }

    if (trimmedText === originalText) {
        const textSpan = messageElement.querySelector('.message-text');
        const actionsDiv = messageElement.querySelector('.message-actions');
        const editInput = messageElement.querySelector('.edit-input');
        const editActionsDiv = messageElement.querySelector('.edit-actions');
        cancelEdit(messageElement, textSpan, actionsDiv, editInput, editActionsDiv);
        return;
    }

    try {
        const response = await fetch('/api/messages/' + messageId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: trimmedText, sender: username })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const updatedMessage = await response.json();

        const textSpan = messageElement.querySelector('.message-text');
        const actionsDiv = messageElement.querySelector('.message-actions');
        const editInput = messageElement.querySelector('.edit-input');
        const editActionsDiv = messageElement.querySelector('.edit-actions');

        textSpan.textContent = updatedMessage.text;

        let editedLabel = messageElement.querySelector('.edited-label');
        if (!editedLabel) {
            editedLabel = document.createElement('span');
            editedLabel.classList.add('edited-label');
            editedLabel.textContent = ' [edited]';

            const timeSpan = messageElement.querySelector('.message-time');
            timeSpan.appendChild(editedLabel);
        }

        cancelEdit(messageElement, textSpan, actionsDiv, editInput, editActionsDiv);

    } catch (error) {
        console.error('Failed to save edited message:', error);
        showError('Failed to save changes. Please try again.');
    }
}

// ============================================
// CANCEL EDIT MESSAGE
// ============================================

function cancelEdit(messageElement, textSpan, actionsDiv, editInput, editActionsDiv) {
    editInput.remove();
    editActionsDiv.remove();

    textSpan.style.display = '';
    if (actionsDiv) {
        actionsDiv.style.display = '';
    }
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