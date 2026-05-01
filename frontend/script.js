/**
 * Smart Crop Yield Prediction System
 * Main JavaScript File for API Integration and User Interactions
 */

// API Configuration
// API Configuration
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
    ? 'http://127.0.0.1:8000' 
    : window.location.origin;

/**
 * ================================
 * AUTHENTICATION FUNCTIONS
 * ================================
 */

async function handleLogin(event) {
    if (event) event.preventDefault();
    
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
    if (event) event.preventDefault();
    
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
 * CORE PREDICTION FUNCTIONS
 * ================================
 */

async function predict(event) {
    if (event) event.preventDefault();
    
    console.log("Predict triggered");
    
    // Get current user for token
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
        console.warn("No authentication token found");
        showAlert('✗ You must be logged in to make predictions', 'error');
        setTimeout(() => window.location.href = 'modern-login.html', 2000);
        return;
    }

    // Get form inputs
    const rainfall = parseFloat(document.getElementById('rainfall')?.value);
    const temperature = parseFloat(document.getElementById('temperature')?.value);
    const humidity = parseFloat(document.getElementById('humidity')?.value);
    const N = parseFloat(document.getElementById('N')?.value);
    const P = parseFloat(document.getElementById('P')?.value);
    const K = parseFloat(document.getElementById('K')?.value);
    const area = parseFloat(document.getElementById('area')?.value);
    const state = document.getElementById('state')?.value;
    const crop = document.getElementById('crop')?.value;

    console.log("Validating inputs...");
    // Validate inputs
    if (isNaN(rainfall) || isNaN(temperature) || isNaN(humidity) || isNaN(N) || isNaN(P) || isNaN(K) || isNaN(area) || !state || !crop) {
        console.error("Validation failed: Missing or invalid fields");
        showAlert('✗ Please fill in all fields correctly', 'error');
        return;
    }

    const payload = { rainfall, temperature, humidity, N, P, K, area, state, crop };
    console.log("Payload prepared:", payload);

    try {
        const predictBtn = document.getElementById('predictBtn');
        const btnText = predictBtn?.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Analyzing...';
        if (predictBtn) predictBtn.disabled = true;

        console.log("Fetching from API...");
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify(payload)
        });

        console.log('API Response Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Prediction Result Received:', data);

            // Update UI
            const resultValue = document.getElementById('resultValue');
            const totalYield = document.getElementById('totalYield');
            const resultSection = document.getElementById('resultSection');
            const confidenceEl = document.getElementById('confidence');

            if (resultValue) resultValue.textContent = data.predicted_yield.toFixed(2);
            if (totalYield) {
                const total = data.predicted_yield * area;
                totalYield.textContent = formatNumber(total.toFixed(0)) + ' T';
            }
            if (confidenceEl) confidenceEl.textContent = (data.confidence_score * 100).toFixed(1) + '%';
            
            if (resultSection) {
                resultSection.classList.add('show');
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Update charts safely
            try {
                console.log("Updating charts...");
                updateCharts();
            } catch (chartError) {
                console.error("Chart update failed, but prediction output was rendered:", chartError);
            }
            
            showAlert('✓ Prediction successful!', 'success');
        } else {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            showAlert('✗ Prediction failed: ' + (errorData.detail || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Network/Connection Error:', error);
        showAlert('✗ Connection error: ' + error.message, 'error');
    } finally {
        const predictBtn = document.getElementById('predictBtn');
        const btnText = predictBtn?.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Predict Yield';
        if (predictBtn) predictBtn.disabled = false;
        console.log("Prediction flow complete");
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
    // Check authentication and update UI
    const currentUser = localStorage.getItem('currentUser');
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const userGreeting = document.getElementById('userGreeting');
        
        if (userNameEl) {
            userNameEl.textContent = user.name || 'Farmer';
        }
        if (userAvatarEl && user.name) {
            userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
        }
        if (userGreeting) {
            userGreeting.style.display = 'flex';
        }

        // Update auth button on index.html
        if (pageName === 'index.html' || pageName === '') {
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) {
                authBtn.textContent = 'Dashboard';
                authBtn.href = 'dashboard.html';
                
                // Add logout if it doesn't exist
                if (!document.getElementById('logout-btn')) {
                    const logoutBtn = document.createElement('a');
                    logoutBtn.id = 'logout-btn';
                    logoutBtn.href = '#';
                    logoutBtn.className = 'btn-nav-login btn-outline';
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
    } else {
        // Protected pages redirect
        if (pageName === 'dashboard.html') {
            window.location.href = 'modern-login.html';
            return;
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
        predictionForm.addEventListener('submit', predict);
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

// Modern color palette for better visualization
const chartColors = {
    // Bar chart: N, P, K
    nitrogen: '#2ecc71',
    phosphorus: '#27ae60',
    potassium: '#145a32',
    // Pie chart: Weather
    rainfall: '#1abc9c',
    temperature: '#f39c12',
    humidity: '#3498db'
};

function initCharts() {
    const barChartCanvas = document.getElementById("barChart");
    const pieChartCanvas = document.getElementById("pieChart");

    if (!barChartCanvas || !pieChartCanvas) return;

    const barCtx = barChartCanvas.getContext("2d");
    const pieCtx = pieChartCanvas.getContext("2d");

    // Global Chart.js defaults for modern look
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = "'Poppins', sans-serif";

    dashboardBarChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ["Nitrogen (N)", "Phosphorus (P)", "Potassium (K)"],
            datasets: [{
                label: "Nutrient Level",
                data: [0, 0, 0],
                backgroundColor: [chartColors.nitrogen, chartColors.phosphorus, chartColors.potassium],
                borderRadius: 8,
                barThickness: 40,
                hoverBackgroundColor: ['#34e881', '#2fcf73', '#1b7a44'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(27, 67, 50, 0.9)',
                    titleColor: '#52B788',
                    bodyColor: '#ffffff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    }
                }
            }
        }
    });

    dashboardPieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ["Rainfall", "Temperature", "Humidity"],
            datasets: [{
                data: [1, 1, 1], // Initial placeholders
                backgroundColor: [chartColors.rainfall, chartColors.temperature, chartColors.humidity],
                hoverOffset: 15,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutBack'
            },
            cutout: '65%',
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(27, 67, 50, 0.9)',
                    padding: 12,
                    cornerRadius: 8
                }
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
