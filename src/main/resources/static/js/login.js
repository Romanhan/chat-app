// ============================================
// LOGIN PAGE - JavaScript
// ============================================

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const loginButton = loginForm.querySelector('.btn-login');

// ============================================
// SHOW ERROR FUNCTION
// ============================================

function showError(message) {
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
// FORM SUBMISSION
// ============================================

loginForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent page refresh

    const username = usernameInput.value.trim();

    // Clear previous errors
    document.getElementById('error-banner').style.display = 'none';

    // Validate username
    if (!username) {
        showError('Please enter a username');
        usernameInput.focus();
        return;
    }

    if (username.length < 1) {
        showError('Username must be at least 1 character');
        usernameInput.focus();
        return;
    }

    if (username.length > 20) {
        showError('Username must be less than 20 characters');
        return;
    }

    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('Username can only contain letters, numbers, and underscore');
        return;
    }

    // All validations passed - check username availability
    checkUsernameAndLogin(username);
});

// ============================================
// CHECK USERNAME AVAILABILITY & LOGIN
// ============================================

async function checkUsernameAndLogin(username) {
    try {
        loginButton.disabled = true;
        loginButton.textContent = 'Checking...';

        const response = await fetch(`/api/check-username/${username}`);
        const data = await response.json();

        if (!data.available) {
            showError('Username "' + username + '" is already taken. Please choose another.');
            loginButton.disabled = false;
            loginButton.textContent = 'Enter Chat';
            return;
        }

        saveUsernameAndRedirect(username);
    } catch (error) {
        console.error('Error checking username:', error);
        showError('An error occurred while checking the username. Please try again.');
        loginButton.disabled = false;
        loginButton.textContent = 'Enter Chat';
    }
}

// ============================================
// SAVE USERNAME TO SESSION & REDIRECT
// ============================================

function saveUsernameAndRedirect(username) {
    // Save to sessionStorage (cleared when browser closes)
    sessionStorage.setItem('currentUsername', username);

    // Redirect to chat page
    window.location.href = '/chat';
}

// ============================================
// CHECK IF USER ALREADY LOGGED IN
// ============================================

// If user already has a username in session, redirect them directly to chat
function checkExistingSession() {
    const username = sessionStorage.getItem('currentUsername');

    if (username) {
        window.location.href = '/chat';
    }
}

// Run this check when page loads
document.addEventListener('DOMContentLoaded', function () {
    checkExistingSession();
});

// ============================================
// AUTO-FOCUS USERNAME INPUT
// ============================================

// Focus the username input when page loads
document.addEventListener('DOMContentLoaded', function () {
    usernameInput.focus();
});
