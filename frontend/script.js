/**
 * Smart Crop Yield Prediction System
 * Main JavaScript File for API Integration and User Interactions
 */

// API Configuration
// API Configuration
// API Configuration
const API_BASE_URL = (window.location.protocol === 'http:' || window.location.protocol === 'https:') 
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://127.0.0.1:8000' : window.location.origin)
    : 'http://127.0.0.1:8000'; // Default to localhost if opened as file

/**
 * ================================
 * TYPING ANIMATION (Hero Section)
 * ================================
 */
function initTypingAnimation() {
    const el = document.getElementById('typingText');
    if (!el) return;

    const phrases = [
        'Predict → Optimize → Grow',
        'AI-Powered Farming Solutions',
        'Smart Yield, Better Harvest',
        'Data-Driven Agriculture'
    ];

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function type() {
        const current = phrases[phraseIdx];
        if (isDeleting) {
            el.textContent = current.substring(0, charIdx - 1);
            charIdx--;
        } else {
            el.textContent = current.substring(0, charIdx + 1);
            charIdx++;
        }

        let delay = isDeleting ? 50 : 90;

        if (!isDeleting && charIdx === current.length) {
            delay = 2000; // pause at end
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            delay = 400;
        }

        setTimeout(type, delay);
    }

    setTimeout(type, 800); // slight initial delay for page load feel
}


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
    
    // STEP 9: DEBUG LOGS
    console.log("Predict clicked");
    
    // STEP 4: INPUT VALIDATION
    const rainfall = document.getElementById('rainfall')?.value;
    const temperature = document.getElementById('temperature')?.value;
    const humidity = document.getElementById('humidity')?.value;
    const N = document.getElementById('N')?.value;
    const P = document.getElementById('P')?.value;
    const K = document.getElementById('K')?.value;
    const area = document.getElementById('area')?.value;
    const state = document.getElementById('state')?.value;
    const crop = document.getElementById('crop')?.value;

    if (!rainfall || !temperature || !humidity || !N || !P || !K || !area || !state || !crop) {
        alert("Please fill in all fields before predicting.");
        return;
    }

    // Crop-State Combination Validation
    const validCropsForState = stateCropMapping[state];
    if (validCropsForState && !validCropsForState.includes(crop)) {
        const suggestions = validCropsForState.slice(0, 5).join(', ');
        const proceed = confirm(
            `⚠️ "${crop}" is not commonly grown in ${state}.\n\n` +
            `Prediction may not be accurate.\n\n` +
            `Crops commonly grown in ${state}:\n${suggestions}\n\n` +
            `Do you still want to proceed?`
        );
        if (!proceed) return;
    }

    const payload = {
        rainfall: parseFloat(rainfall),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        N: parseFloat(N),
        P: parseFloat(P),
        K: parseFloat(K),
        area: parseFloat(area),
        state: state,
        crop: crop
    };

    // STEP 9: DEBUG LOGS
    console.log("Payload:", payload);

    // Get Auth Token (Required by Backend)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const token = currentUser ? currentUser.token : null;

    try {
        const predictBtn = document.getElementById('predictBtn');
        if (predictBtn) predictBtn.disabled = true;

        // STEP 3: API CALL
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "" 
            },
            body: JSON.stringify(payload)
        });

        // STEP 5: RESPONSE HANDLING
        if (response.ok) {
            const data = await response.json();
            // STEP 9: DEBUG LOGS
            console.log("Response:", data);

            // STEP 6: UPDATE UI
            const resultValue = document.getElementById('resultValue');
            const totalYield = document.getElementById('totalYield');
            const confidenceEl = document.getElementById('confidence');
            const resultSection = document.getElementById('resultSection');

            if (resultValue) resultValue.textContent = data.predicted_yield.toFixed(2);
            if (totalYield) {
                const total = data.predicted_yield * payload.area;
                totalYield.textContent = formatNumber(total.toFixed(0)) + ' T';
            }
            if (confidenceEl) confidenceEl.textContent = (data.confidence_score * 100).toFixed(1) + '%';
            
            if (resultSection) {
                resultSection.classList.add('show');
                resultSection.style.display = 'block'; // Ensure visibility
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Generate Recommendations
            const recommendationsBox = document.getElementById('recommendationsBox');
            const recommendationsList = document.getElementById('recommendationsList');
            
            if (recommendationsBox && recommendationsList) {
                recommendationsList.innerHTML = '';
                const insights = [];
                
                if (payload.N < 40) insights.push("Nitrogen level is low. Consider applying nitrogen-rich fertilizers.");
                if (payload.rainfall < 100) insights.push("Low rainfall detected. Consider supplementary irrigation for better yield.");
                if (payload.humidity > 80) insights.push("High humidity increases risk of crop disease. Monitor for pests/fungus.");
                if (payload.temperature > 35) insights.push("High temperature may cause heat stress to crops.");
                
                if (insights.length > 0) {
                    insights.forEach(text => {
                        const li = document.createElement('li');
                        li.textContent = text;
                        recommendationsList.appendChild(li);
                    });
                    recommendationsBox.style.display = 'block';
                } else {
                    const li = document.createElement('li');
                    li.textContent = "Optimal conditions detected for this crop profile.";
                    recommendationsList.appendChild(li);
                    recommendationsBox.style.display = 'block';
                }
            }

            // STEP 7: SAFE CHART UPDATE
            try {
                updateCharts();
            } catch (chartErr) {
                console.error("Charts failed to update, but prediction is valid.");
            }

            showAlert('✓ Prediction successful!', 'success');
        } else if (response.status === 401) {
            // STEP 8: ERROR HANDLING - Auth failure
            console.error("Authentication failed: Session expired or invalid");
            alert("Your session has expired. Please log in again to continue.");
            logout(); // Redirect to login
        } else {
            // STEP 8: ERROR HANDLING - Other server errors
            const errData = await response.json().catch(() => ({ detail: "Unknown error" }));
            console.error("API Error:", errData);
            alert("Prediction failed: " + (errData.detail || "Server error"));
        }
    } catch (error) {
        // STEP 8: ERROR HANDLING
        console.error("Network Error:", error);
        alert("Connection refused. Please ensure the backend server is running on http://127.0.0.1:8000");
    } finally {
        const predictBtn = document.getElementById('predictBtn');
        if (predictBtn) predictBtn.disabled = false;
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

    // Initialize typing animation on landing page
    initTypingAnimation();

    // Attach form submit
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', predict);
    }

    // Add real-time listeners for dynamic chart updates
    ['N', 'P', 'K', 'rainfall', 'temperature', 'humidity'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updateCharts);
        }
    });

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

// Realistic mapping of crops to states in India
const stateCropMapping = {
    'Punjab': ['Wheat', 'Rice', 'Cotton', 'Maize', 'Barley'],
    'Haryana': ['Wheat', 'Rice', 'Cotton', 'Bajra', 'Mustard'],
    'Uttar Pradesh': ['Wheat', 'Rice', 'Sugarcane', 'Maize', 'Gram', 'Barley', 'Mustard'],
    'Maharashtra': ['Cotton', 'Sugarcane', 'Soybean', 'Jowar', 'Bajra', 'Grapes', 'Groundnut', 'Sorghum'],
    'West Bengal': ['Rice', 'Jute', 'Tea', 'Tobacco', 'Maize', 'Mustard'],
    'Karnataka': ['Coffee', 'Ragi', 'Maize', 'Sugarcane', 'Cotton', 'Sorghum', 'Groundnut'],
    'Kerala': ['Coconut', 'Tea', 'Coffee', 'Rice', 'Rubber', 'Pepper'],
    'Tamil Nadu': ['Rice', 'Sugarcane', 'Cotton', 'Groundnut', 'Coconut', 'Maize'],
    'Andhra Pradesh': ['Rice', 'Tobacco', 'Cotton', 'Maize', 'Groundnut', 'Sunflower'],
    'Telangana': ['Rice', 'Cotton', 'Maize', 'Sorghum', 'Soybean'],
    'Gujarat': ['Cotton', 'Groundnut', 'Wheat', 'Bajra', 'Mustard', 'Tobacco'],
    'Rajasthan': ['Bajra', 'Mustard', 'Wheat', 'Gram', 'Barley', 'Cotton'],
    'Madhya Pradesh': ['Soybean', 'Wheat', 'Gram', 'Maize', 'Cotton', 'Jowar'],
    'Bihar': ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Tobacco', 'Jute'],
    'Assam': ['Tea', 'Rice', 'Jute', 'Sugarcane', 'Maize'],
    'Orissa': ['Rice', 'Sugarcane', 'Groundnut', 'Tobacco', 'Maize'],
    'Chhattisgarh': ['Rice', 'Maize', 'Soybean', 'Sugarcane'],
    'Himachal Pradesh': ['Maize', 'Wheat', 'Rice', 'Barley', 'Apple'],
    'Uttarakhand': ['Rice', 'Wheat', 'Maize', 'Sugarcane', 'Soybean'],
    'Jharkhand': ['Rice', 'Maize', 'Wheat', 'Gram']
};

function getCropOptions() {
    return [
        'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Soybean',
        'Chickpea', 'Gram', 'Pigeon Pea', 'Lentil', 'Barley', 'Jowar',
        'Bajra', 'Ragi', 'Groundnut', 'Sunflower', 'Sorghum', 'Mustard',
        'Coconut', 'Tobacco', 'Tea', 'Coffee'
    ];
}

// Script to handle Chart.js integration and dynamic updates
window.barChart = null;
window.pieChart = null;

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

    window.barChart = new Chart(barCtx, {
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

    window.pieChart = new Chart(pieCtx, {
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
    if (!window.barChart || !window.pieChart) return;

    // Get input values
    const n = parseFloat(document.getElementById('N')?.value) || 0;
    const p = parseFloat(document.getElementById('P')?.value) || 0;
    const k = parseFloat(document.getElementById('K')?.value) || 0;
    
    const rain = parseFloat(document.getElementById('rainfall')?.value) || 0;
    const temp = parseFloat(document.getElementById('temperature')?.value) || 0;
    const hum = parseFloat(document.getElementById('humidity')?.value) || 0;

    // Update Bar Chart data
    window.barChart.data.datasets[0].data = [n, p, k];
    window.barChart.update();

    // Update Pie Chart data
    window.pieChart.data.datasets[0].data = [rain, temp, hum];
    window.pieChart.update();
}
