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
            body: new URLSearchParams({
                'username': email,
                'password': password
            })
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
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
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
            
            // Verify token is present before storing
            if (data.access_token) {
                localStorage.setItem('currentUser', JSON.stringify({
                    name: name,
                    email: email,
                    token: data.access_token
                }));
                
                showAlert('✓ Account created! Logging in...', 'success', 'signup');
                setTimeout(() => window.location.href = 'dashboard.html', 1500);
            } else {
                showAlert('✗ Authentication error: No token received', 'error', 'signup');
            }
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
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const token = currentUser.token;

        if (!token) {
            showAlert('✗ Please login to get predictions', 'error');
            setTimeout(() => window.location.href = 'modern-login.html', 1500);
            return;
        }

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
        btn.innerHTML = '<span class="btn-text">Predict Yield</span>';
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
        
        // Update charts with current input values
        updateCharts();
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
    
    // Update auth button if on index.html
    if (pageName === 'index.html' || pageName === '') {
        const currentUser = localStorage.getItem('currentUser');
        const authBtn = document.getElementById('auth-btn');
        if (currentUser && authBtn) {
            authBtn.textContent = 'Dashboard';
            authBtn.href = 'dashboard.html';
            
            // Add a logout link if it doesn't exist
            if (!document.getElementById('logout-btn')) {
                const logoutBtn = document.createElement('a');
                logoutBtn.id = 'logout-btn';
                logoutBtn.href = '#';
                logoutBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                logoutBtn.style.fontWeight = '500';
                logoutBtn.style.marginLeft = '1rem';
                logoutBtn.textContent = 'Logout';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
                authBtn.parentNode.insertBefore(logoutBtn, authBtn.nextSibling);
            }
        }
    }

    // Populate State and Crop Dropdowns
    const stateSelect = document.getElementById('state');
    if (stateSelect) {
        getStateOptions().forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stateSelect.appendChild(option);
        });
    }

    const cropSelect = document.getElementById('crop');
    if (cropSelect) {
        getCropOptions().forEach(crop => {
            const option = document.createElement('option');
            option.value = crop;
            option.textContent = crop;
            cropSelect.appendChild(option);
        });
    }

    // Initialize Dashboard Charts if canvases exist
    initCharts();

    // Attach form submit
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', handlePrediction);
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
        if (!el.classList.contains('fade-in')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        }
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

// Script to handle Chart.js integration and dynamic updates
let dashboardBarChart = null;
let dashboardPieChart = null;

const chartColors = {
    green: '#1B4332',
    lightGreen: '#52B788',
    softYellow: '#D8F3DC'
};

function initCharts() {
    const barChartCanvas = document.getElementById("barChart");
    const pieChartCanvas = document.getElementById("pieChart");

    if (!barChartCanvas || !pieChartCanvas) return;

    const barCtx = barChartCanvas.getContext("2d");
    const pieCtx = pieChartCanvas.getContext("2d");

    dashboardBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"],
            datasets: [{
                label: "Nutrients",
                data: [0, 0, 0],
                backgroundColor: [chartColors.green, chartColors.lightGreen, chartColors.softYellow],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    dashboardPieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ["Rainfall", "Temperature", "Humidity"],
            datasets: [{
                data: [1, 1, 1], // Default equal chunks
                backgroundColor: [chartColors.green, chartColors.lightGreen, chartColors.softYellow],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function updateCharts() {
    if (!dashboardBarChart || !dashboardPieChart) return;

    // Get input values
    const n = parseFloat(document.getElementById('N').value) || 0;
    const p = parseFloat(document.getElementById('P').value) || 0;
    const k = parseFloat(document.getElementById('K').value) || 0;
    
    const rain = parseFloat(document.getElementById('rainfall').value) || 0;
    const temp = parseFloat(document.getElementById('temperature').value) || 0;
    const hum = parseFloat(document.getElementById('humidity').value) || 0;

    // Update Bar Chart
    dashboardBarChart.data.datasets[0].data = [n, p, k];
    dashboardBarChart.update();

    // Update Pie Chart (we normalize these or just show them relative to each other)
    dashboardPieChart.data.datasets[0].data = [rain, temp, hum];
    dashboardPieChart.update();
}
