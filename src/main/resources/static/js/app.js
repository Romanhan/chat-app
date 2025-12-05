// ============================================
// CHAT APP - WebSocket Client with Session Management
// ============================================

let stompClient = null;
let username = "";
let isConnected = false;
let typingTimeout = null;
let isCurrentlyTyping = false;
let typingInterval = null;
let typingHideTimeout = null;

const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');
const messagesDiv = document.getElementById('messages');
const disconnectBtn = document.getElementById('disconnectBtn');
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const emojiItems = document.querySelectorAll('.emoji-item');

// ============================================
// CUSTOM CONFIRMATION MODAL
// ============================================

/**
 * Show a custom confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmationModal(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmation-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        // Set content
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // Show modal
        modal.style.display = 'flex';

        // Handle confirm
        const handleConfirm = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(true);
        };

        // Handle cancel
        const handleCancel = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(false);
        };

        // Handle backdrop click
        const handleBackdropClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };

        // Add event listeners
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdropClick);
        document.addEventListener('keydown', handleEscape);

        // Cleanup function to remove event listeners
        function cleanup() {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdropClick);
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

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
        stompClient.subscribe('/topic/typing', onTypingRecieved);

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

    if (messageText.length > 300) {
        showError('Message exceeds maximum length of 300 characters.');
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

    const existingMessage = document.querySelector(`.message[data-message-id='${message.id}']`);

    if (existingMessage) {
        updateExistingMessage(existingMessage, message);
    } else {
        displayMessage(message);
        // If we receive a message from someone, they're done typing
        const typingUsernameElement = document.getElementById('typing-username');
        if (typingUsernameElement.textContent.includes(message.sender)) {
            // Hide the typing indicator
            if (typingHideTimeout) {
                clearTimeout(typingHideTimeout);
            }
            typingUsernameElement.textContent = '';
            document.getElementById('typing-indicator').style.display = 'none';
        }
    }
}

// ============================================
// HELPER: Mark message as deleted (UI update)
// ============================================

function markMessageAsDeleted(messageElement) {
    const textSpan = messageElement.querySelector('.message-text');
    textSpan.textContent = 'Message was deleted';
    textSpan.classList.add('deleted-message');

    // Remove [edited] label if exists
    const editedLabel = messageElement.querySelector('.edited-label');
    if (editedLabel) {
        editedLabel.remove();
    }

    // Remove action buttons
    const actionsDiv = messageElement.querySelector('.message-actions');
    if (actionsDiv) {
        actionsDiv.remove();
    }
}

// ============================================
// HELPER: Mark message as edited (UI update)
// ============================================

function markMessageAsEdited(messageElement, newText) {
    const textSpan = messageElement.querySelector('.message-text');
    textSpan.textContent = newText;

    // Add [edited] label if not already there
    let editedLabel = messageElement.querySelector('.edited-label');
    if (!editedLabel) {
        editedLabel = document.createElement('span');
        editedLabel.classList.add('edited-label');
        editedLabel.textContent = ' [edited]';

        const timeSpan = messageElement.querySelector('.message-time');
        timeSpan.appendChild(editedLabel);
    }
}

// ============================================
// UPDATE EXISTING MESSAGE (for WebSocket broadcasts)
// ============================================

function updateExistingMessage(messageElement, message) {
    if (message.deleted) {
        markMessageAsDeleted(messageElement);
    } else if (message.edited) {
        markMessageAsEdited(messageElement, message.text);
    }
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

        listItem.addEventListener('click', () => insertUserMention(user));

        listItem.textContent = user;
        userListElement.appendChild(listItem);
    })
}

// ============================================
// RECEIVE TYPING NOTIFICATION
// ============================================

function onTypingRecieved(payload) {
    const typingUsername = payload.body;

    if (typingUsername && typingUsername !== username) {
        const usernameElement = document.getElementById('typing-username');
        usernameElement.textContent = typingUsername + ' is typing';

        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = 'flex';
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        if (typingHideTimeout) {
            clearTimeout(typingHideTimeout);
        }

        // Set new hide timeout
        typingHideTimeout = setTimeout(() => {
            usernameElement.textContent = '';
            typingIndicator.style.display = 'none';
        }, 3000);
    }
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

    if (message.deleted) {
        textSpan.textContent = 'Message was deleted';
        textSpan.classList.add('deleted-message');
    } else {
        textSpan.innerHTML = parseMessageMentions(escapeHtml(message.text));
    }

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

    // Auto-scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================================
// PARSE USER MENTIONS
// ============================================

function parseMessageMentions(text) {
    const regex = /@(\w+)/g;
    return text.replace(regex, '<span class="mention">$&</span>');
}

// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LOAD MESSAGE HISTORY
// ============================================

function loadMessageHistory() {
    fetch('/api/messages')
        .then(response => response.json())
        .then(messages => {
            messages.reverse().forEach(message => displayMessage(message));
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
    const banner = document.getElementById('error-banner');
    const messageSpan = document.getElementById('error-message');
    messageSpan.textContent = message;
    banner.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        banner.style.display = 'none';
    }, 5000);
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

        // Update UI using helper function
        markMessageAsEdited(messageElement, updatedMessage.text);

        // Exit edit mode
        const textSpan = messageElement.querySelector('.message-text');
        const actionsDiv = messageElement.querySelector('.message-actions');
        const editInput = messageElement.querySelector('.edit-input');
        const editActionsDiv = messageElement.querySelector('.edit-actions');
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
// DELETE MESSAGE
// ============================================

async function deleteMessage(messageId, messageElement) {
    const confirmed = await showConfirmationModal(
        'Delete Message',
        'Are you sure you want to delete this message?'
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch('/api/messages/' + messageId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sender: username })
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        // Update UI using helper function
        markMessageAsDeleted(messageElement);

    } catch (error) {
        console.error('Failed to delete message:', error);
        showError('Failed to delete message. Please try again.');
    }
}

// ============================================
// INSERT USER MENTION INTO MESSAGE INPUT
// ============================================


function insertUserMention(user) {
    const mention = `@${user} `;
    const currentPos = messageInput.selectionStart;
    const currentText = messageInput.value;

    const messageBefore = currentText.slice(0, currentPos);
    const messageAfter = currentText.slice(currentPos);

    const needSpaceBefore = messageBefore.length > 0 && !messageBefore.endsWith(' ');
    const newText = messageBefore + (needSpaceBefore ? ' ' : '') + mention + messageAfter;

    messageInput.value = newText;

    const newCursorPos = currentPos + mention.length + (needSpaceBefore ? 1 : 0);

    messageInput.setSelectionRange(newCursorPos, newCursorPos);
    messageInput.focus();
}

// ============================================
// INSERT EMOJI AT CURSOR POSITION
// ============================================

function insertEmojiAtCursor(emoji) {
    const editInput = document.querySelector('.edit-input');

    let targetInput;

    if (editInput) {
        targetInput = editInput;
    } else {
        targetInput = messageInput;
    }

    const currentPos = targetInput.selectionStart;
    const currentText = targetInput.value;

    const messageBefore = currentText.slice(0, currentPos);
    const messageAfter = currentText.slice(currentPos);

    const newText = messageBefore + emoji + messageAfter;

    targetInput.value = newText;

    const newCursorPos = currentPos + emoji.length;

    targetInput.setSelectionRange(newCursorPos, newCursorPos);
    targetInput.focus();
}

// ============================================
// EVENT LISTENERS
// ============================================

sendButton.addEventListener('click', sendMessage);

disconnectBtn.addEventListener('click', async function () {
    const confirmed = await showConfirmationModal(
        'Disconnect',
        'Are you sure you want to disconnect?'
    );

    if (confirmed) {
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

// Typing notification
messageInput.addEventListener('input', function () {
    if (!isCurrentlyTyping) {
        if (stompClient && isConnected) {
            stompClient.send("/app/typing", {}, username);
        }

        isCurrentlyTyping = true;

        typingInterval = setInterval(function () {
            if (stompClient && isConnected) {
                stompClient.send("/app/typing", {}, username);
            }
        }, 2000);
    }

    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    typingTimeout = setTimeout(function () {
        isCurrentlyTyping = false;

        // Stop sending periodic updates
        if (typingInterval) {
            clearInterval(typingInterval);
            typingInterval = null;
        }
    }, 1000);
});

// Emoji picker toggle
emojiBtn.addEventListener('click', function () {
    if (emojiPicker.style.display === 'none') {
        emojiPicker.style.display = 'block';
    } else {
        emojiPicker.style.display = 'none';
    }
})

// Close emoji picker when clicking outside
document.addEventListener('click', function (event) {
    if (!emojiPicker.contains(event.target) && event.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
    }
})

// Insert emoji into message input
emojiItems.forEach(function (emojiItems) {
    emojiItems.addEventListener('click', function () {
        const emoji = this.textContent;

        insertEmojiAtCursor(emoji);
        emojiPicker.style.display = 'none';
        messageInput.focus();
    })
})