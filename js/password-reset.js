// Password Reset Module
// This module handles password reset functionality for admin users

// Password visibility toggle
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    // Update button text
    const button = event?.target;
    if (button) {
        button.textContent = isPassword ? '🙈' : '👁️';
    }
}

// Modal management functions
function openForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('forgot-username').value = '';
        document.getElementById('forgot-email').value = '';
        document.getElementById('forgot-password-message').innerHTML = '';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) modal.classList.remove('open');
}

function openResetPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        document.getElementById('reset-password-message').innerHTML = '';
    }
}

function closeResetPasswordModal() {
    const modal = document.getElementById('reset-password-modal');
    if (modal) modal.classList.remove('open');
}

// Show message in modal
function showModalMessage(modalId, message, type = 'info') {
    const messageDiv = document.getElementById(modalId === 'forgot-password-modal' ? 'forgot-password-message' : 'reset-password-message');
    if (messageDiv) {
        messageDiv.innerHTML = `<div class="modal-message ${type}">${escapeHtml(message)}</div>`;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Get API URL
function getPasswordResetApiUrl(path) {
    const base = window.BACKEND_BASE || 'https://lamsl-backend.onrender.com';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
}

// Submit forgot password form
async function submitForgotPassword() {
    const username = document.getElementById('forgot-username').value.trim();
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!username || !email) {
        showModalMessage('forgot-password-modal', 'Please enter both username and email.', 'error');
        return;
    }
    
    try {
        showModalMessage('forgot-password-modal', 'Sending password reset request...', 'info');
        
        const response = await fetch(getPasswordResetApiUrl('/api/forgot-password'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        
        const result = await response.json().catch(() => ({}));
        
        if (!response.ok || result.success === false) {
            throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        // Store temp password and username for next step
        sessionStorage.setItem('resetUsername', username);
        sessionStorage.setItem('resetTempPassword', result.tempPassword);
        
        showModalMessage(
            'forgot-password-modal',
            `✓ Temporary password sent! Your temporary password is: <strong>${escapeHtml(result.tempPassword)}</strong><br><br>Use this password to log in, then you'll be prompted to set a new password.`,
            'success'
        );
        
        // Close modal after 3 seconds
        setTimeout(() => {
            closeForgotPasswordModal();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = result.tempPassword;
        }, 2000);
        
    } catch (error) {
        showModalMessage('forgot-password-modal', `Error: ${error.message}`, 'error');
    }
}

// Submit reset password form (after login with temp password)
async function submitResetPassword() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!newPassword || !confirmPassword) {
        showModalMessage('reset-password-modal', 'Please enter both passwords.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showModalMessage('reset-password-modal', 'Passwords do not match.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showModalMessage('reset-password-modal', 'Password must be at least 6 characters.', 'error');
        return;
    }
    
    try {
        showModalMessage('reset-password-modal', 'Setting new password...', 'info');
        
        const username = sessionStorage.getItem('resetUsername');
        const tempPassword = sessionStorage.getItem('resetTempPassword');
        
        if (!username || !tempPassword) {
            throw new Error('Session expired. Please log in again.');
        }
        
        const response = await fetch(getPasswordResetApiUrl('/api/reset-password'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, tempPassword, newPassword })
        });
        
        const result = await response.json().catch(() => ({}));
        
        if (!response.ok || result.success === false) {
            throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        showModalMessage('reset-password-modal', '✓ Password updated successfully! You can now use your new password.', 'success');
        
        // Clear session storage
        sessionStorage.removeItem('resetUsername');
        sessionStorage.removeItem('resetTempPassword');
        
        // Close modal and refresh page
        setTimeout(() => {
            closeResetPasswordModal();
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        showModalMessage('reset-password-modal', `Error: ${error.message}`, 'error');
    }
}

// Switch between tabs in forgot password modal
function switchForgotPasswordTab(tab) {
    const resetForm = document.getElementById('forgot-password-form');
    const claimForm = document.getElementById('claim-account-form');
    const resetTab = document.getElementById('reset-tab');
    const claimTab = document.getElementById('claim-tab');
    const submitBtn = document.getElementById('forgot-password-submit-btn');
    
    if (tab === 'reset') {
        resetForm.style.display = 'block';
        claimForm.style.display = 'none';
        resetTab.style.background = '#12324A';
        resetTab.style.color = 'white';
        claimTab.style.background = '#e4ebf1';
        claimTab.style.color = '#12324A';
        submitBtn.textContent = 'Send Temporary Password';
        submitBtn.onclick = submitForgotPassword;
    } else {
        resetForm.style.display = 'none';
        claimForm.style.display = 'block';
        resetTab.style.background = '#e4ebf1';
        resetTab.style.color = '#12324A';
        claimTab.style.background = '#12324A';
        claimTab.style.color = 'white';
        submitBtn.textContent = 'Claim Account & Set Password';
        submitBtn.onclick = submitClaimAccount;
        populateAccountsForClaiming();
    }
}

function populateAccountsForClaiming() {
    const select = document.getElementById('claim-username');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choose an account...</option>';
    
    // Get users from localStorage
    const usersJson = localStorage.getItem('lamslUsersV1');
    if (usersJson) {
        const users = JSON.parse(usersJson);
        users.forEach(user => {
            if (!user.email || user.email === '') {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = `${user.username} (${user.role || 'user'})`;
                select.appendChild(option);
            }
        });
    }
}

async function submitClaimAccount() {
    const username = document.getElementById('claim-username').value.trim();
    const email = document.getElementById('claim-email').value.trim();
    const password = document.getElementById('claim-password').value;
    const confirmPassword = document.getElementById('claim-password-confirm').value;
    
    if (!username || !email || !password || !confirmPassword) {
        showModalMessage('forgot-password-modal', 'Please fill in all fields.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showModalMessage('forgot-password-modal', 'Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showModalMessage('forgot-password-modal', 'Password must be at least 6 characters.', 'error');
        return;
    }
    
    try {
        showModalMessage('forgot-password-modal', 'Claiming account and setting password...', 'info');
        
        const response = await fetch(getPasswordResetApiUrl('/api/claim-account'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const result = await response.json().catch(() => ({}));
        
        if (!response.ok || result.success === false) {
            throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }
        
        showModalMessage(
            'forgot-password-modal',
            `✓ Account claimed successfully! You can now log in with your username and new password.`,
            'success'
        );
        
        // Close modal after 2 seconds
        setTimeout(() => {
            closeForgotPasswordModal();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }, 2000);
        
    } catch (error) {
        showModalMessage('forgot-password-modal', `Error: ${error.message}`, 'error');
    }
}

// Initialize password reset module
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for password toggle buttons
    const loginPasswordToggle = document.getElementById('login-password-toggle');
    if (loginPasswordToggle) {
        loginPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            togglePasswordVisibility('login-password');
        });
    }
    
    // Add event listener for forgot password button
    const forgotPasswordBtn = document.getElementById('forgot-password-btn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openForgotPasswordModal();
        });
    }
    
    // Add event listeners for forgot password form
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitForgotPassword();
            }
        });
    }
    
    // Check if user needs to reset password after login with temp password
    function checkResetPasswordNeeded() {
        const username = sessionStorage.getItem('resetUsername');
        const tempPassword = sessionStorage.getItem('resetTempPassword');
        if (username && tempPassword) {
            setTimeout(function() {
                openResetPasswordModal();
            }, 500);
        }
    }
    
    checkResetPasswordNeeded();
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const forgotModal = document.getElementById('forgot-password-modal');
        const resetModal = document.getElementById('reset-password-modal');
        
        if (event.target === forgotModal) {
            closeForgotPasswordModal();
        }
        if (event.target === resetModal) {
            closeResetPasswordModal();
        }
    });
});
