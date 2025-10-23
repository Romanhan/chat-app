// ============================================
// LOGIN PAGE - JavaScript
// ============================================

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const usernameError = document.getElementById('usernameError');
const loginButton = loginForm.querySelector('.btn-login');

// ============================================
// FORM SUBMISSION
// ============================================

loginForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent page refresh

    const username = usernameInput.value.trim();

    // Clear previous errors
    usernameError.textContent = '';

    // Validate username
    if (!username) {
        usernameError.textContent = 'Please enter a username';
        usernameInput.focus();
        return;
    }

    if (username.length < 1) {
        usernameError.textContent = 'Username must be at least 1 character';
        usernameInput.focus();
        return;
    }

    if (username.length > 20) {
        usernameError.textContent = 'Username must be less than 20 characters';
        return;
    }

    // Check for valid characters (alphanumeric and underscore)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        usernameError.textContent = 'Username can only contain letters, numbers, and underscore';
        return;
    }

    // All validations passed - save username and redirect
    saveUsernameAndRedirect(username);
});

// ============================================
// SAVE USERNAME TO SESSION & REDIRECT
// ============================================

function saveUsernameAndRedirect(username) {
    // Save to sessionStorage (cleared when browser closes)
    sessionStorage.setItem('currentUsername', username);

    console.log('✅ User logged in:', username);
    console.log('Redirecting to chat...');

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
        console.log('User already logged in as:', username);
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