// Authentication state
let isAuthenticated = false;
let currentUser = null;

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                isAuthenticated = true;
                currentUser = data.user;
                showApp();
                return true;
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
    showLogin();
    return false;
}

// Show login modal
function showLogin() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('app-container').classList.add('hidden');
    isAuthenticated = false;
    currentUser = null;
}

// Show app (hide login)
function showApp() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    
    // Update user info
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl && currentUser) {
        userEmailEl.textContent = currentUser.email;
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            isAuthenticated = true;
            currentUser = data.user;
            showApp();
            return true;
        } else {
            showError(data.error || 'Login failed');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
        return false;
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    isAuthenticated = false;
    currentUser = null;
    showLogin();
}

// Show error message
function showError(message) {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

// Clear error message
function clearError() {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check if already authenticated
    await checkAuth();
    
    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            await login(email, password);
        });
    }
    
    // Logout button handlers
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const footerLogoutBtn = document.getElementById('logout-btn');
    if (footerLogoutBtn) {
        footerLogoutBtn.addEventListener('click', logout);
    }
});

// Make auth functions available globally
window.checkAuth = checkAuth;
window.logout = logout;

