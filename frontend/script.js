/**
 * Smart Crop Yield Prediction System
 * Main JavaScript File for API Integration and User Interactions
 */

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * ================================
 * AUTHENTICATION FUNCTIONS
 * ================================
 */

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) return;

    try {
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${email}&password=${password}`
        });

        if (response.ok) {
            const data = await response.json();
            const userInfo = await fetchUserInfo(data.access_token);
            
            localStorage.setItem('currentUser', JSON.stringify({
                name: userInfo.full_name || userInfo.username,
                email: userInfo.email,
                token: data.access_token
            }));
            
            showAlert('✓ Login successful! Redirecting...', 'success', 'login');
            setTimeout(() => window.location.href = 'modern-dashboard.html', 1500);
        } else {
            showAlert('✗ Invalid email or password', 'error', 'login');
        }
    } catch (error) {
        showAlert('✗ Connection error: ' + error.message, 'error', 'login');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name')?.value;
    const email = document.getElementById('signup-email')?.value;
    const password = document.getElementById('signup-password')?.value;
    const confirm = document.getElementById('signup-confirm')?.value;

    if (!name || !email || !password || !confirm) return;

    if (password !== confirm) {
        showAlert('✗ Passwords do not match', 'error', 'signup');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: name,
                email: email,
                username: email,
                password: password
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('currentUser', JSON.stringify({
                name: name,
                email: email,
                token: data.access_token
            }));
            
            showAlert('✓ Account created! Logging in...', 'success', 'signup');
            setTimeout(() => window.location.href = 'modern-dashboard.html', 1500);
        } else {
            const error = await response.json();
            showAlert('✗ ' + (error.detail || 'Registration failed'), 'error', 'signup');
        }
    } catch (error) {
        showAlert('✗ Connection error: ' + error.message, 'error', 'signup');
    }
}

async function fetchUserInfo(token) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

/**
 * ================================
 * PREDICTION FUNCTIONS
 * ================================
 */

async function handlePrediction(event) {
    event.preventDefault();

    const rainfall = parseFloat(document.getElementById('rainfall')?.value);
    const temperature = parseFloat(document.getElementById('temperature')?.value);
    const humidity = parseFloat(document.getElementById('humidity')?.value);
    const N = parseFloat(document.getElementById('N')?.value);
    const P = parseFloat(document.getElementById('P')?.value);
    const K = parseFloat(document.getElementById('K')?.value);
    const area = parseFloat(document.getElementById('area')?.value);
    const state = document.getElementById('state')?.value;
    const crop = document.getElementById('crop')?.value;

    if (!rainfall || !temperature || !humidity || !N || !P || !K || !area || !state || !crop) {
        showAlert('✗ Please fill all fields', 'error');
        return;
    }

    const predictionData = {
        rainfall, temperature, humidity, N, P, K, area, state, crop
    };

    const btn = document.getElementById('predictBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Predicting...';

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(predictionData)
        });

        if (!response.ok) {
            throw new Error('Prediction failed with status ' + response.status);
        }

        const result = await response.json();
        
        displayPredictionResult(result, area);
        showAlert('✓ Prediction completed successfully!', 'success');

    } catch (error) {
        showAlert('✗ Error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Get Prediction</span>';
    }
}

function displayPredictionResult(result, area) {
    const resultSection = document.getElementById('resultSection');
    const yieldPerHectare = result.predicted_yield || 0;
    const totalYield = yieldPerHectare * area;
    const confidence = (result.confidence_score * 100).toFixed(1);

    if (resultSection) {
        document.getElementById('resultValue').textContent = yieldPerHectare.toFixed(2);
        document.getElementById('confidence').textContent = confidence + '%';
        document.getElementById('totalYield').textContent = totalYield.toFixed(2) + ' T';
        resultSection.classList.add('show');
    }
}

/**
 * ================================
 * UI UTILITY FUNCTIONS
 * ================================
 */

function switchTab(tab) {
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tab).classList.add('active');
    event.target.classList.add('active');
}

function showAlert(message, type = 'error', tabId = null) {
    const alertId = tabId ? `${tabId}-alert` : 'alert';
    const alertEl = document.getElementById(alertId);
    
    if (alertEl) {
        alertEl.textContent = message;
        alertEl.className = `alert show alert-${type}`;
        setTimeout(() => alertEl.classList.remove('show'), 5000);
    }
}

/**
 * ================================
 * PAGE INITIALIZATION
 * ================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on protected pages
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    
    if (pageName === 'modern-dashboard.html' || pageName === 'dashboard.html') {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            window.location.href = 'modern-login.html';
            return;
        }
        
        const user = JSON.parse(currentUser);
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.name || 'Farmer';
        }
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card, .step').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

/**
 * ================================
 * HELPER FUNCTIONS
 * ================================
 */

function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

function getStateOptions() {
    return [
        'Uttar Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Maharashtra',
        'Karnataka', 'Gujarat', 'Orissa', 'West Bengal', 'Andhra Pradesh',
        'Bihar', 'Telangana', 'Tamil Nadu', 'Assam', 'Punjab',
        'Chhattisgarh', 'Himachal Pradesh', 'Uttarakhand', 'Haryana',
        'Jharkhand', 'Kerala'
    ];
}

function getCropOptions() {
    return [
        'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean',
        'Chickpea', 'Gram', 'Pigeon Pea', 'Lentil', 'Barley', 'Jowar',
        'Bajra', 'Ragi', 'Groundnut', 'Sunflower', 'Sorghum', 'Mustard',
        'Coconut', 'Tobacco', 'Tea', 'Coffee'
    ];
}
