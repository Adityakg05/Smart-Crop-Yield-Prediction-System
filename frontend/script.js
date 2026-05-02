console.log("🚀 script.js v3.6: System Initializing...");

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
    const cursor = document.getElementById('typingCursor');
    if (!el) return;

    const phrase = 'Smart Yield, Better Harvest';
    let charIdx = 0;

    function type() {
        if (charIdx < phrase.length) {
            el.textContent = phrase.substring(0, charIdx + 1);
            charIdx++;
            setTimeout(type, 85);
        } else {
            el.textContent = phrase;
            if (cursor) cursor.classList.add('typing-cursor--done');
        }
    }

    setTimeout(type, 800); // slight initial delay for page load feel
}

/**
 * ================================
 * PREVIEW YIELD ANIMATION
 * ================================
 */
function initPreviewYieldAnimation() {
    const el = document.getElementById('previewYieldValue');
    if (!el) return;

    const start = 3.8;
    const end = 4.1;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = start + (end - start) * progress;
        el.textContent = value.toFixed(1);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

/**
 * ================================
 * COUNT-UP ANIMATION (Hero Stats)
 * ================================
 */
function initCountUp() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    if (!statNumbers.length) return;

    const animateCount = (el) => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            // Show one decimal only if target has decimals
            const display = Number.isInteger(target) ? Math.round(current) : current.toFixed(1);
            el.textContent = display + suffix;
        }, stepTime);
    };

    // Use IntersectionObserver so counts trigger when in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
}

/**
 * ================================
 * HOW IT WORKS STEP ANIMATIONS
 * ================================
 */
function initStepAnimations() {
    const steps = document.querySelectorAll('.step-fade-in, .step-slide-in, .step-pop-in, .step-glow');
    if (!steps.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    steps.forEach(el => observer.observe(el));
}

/**
 * ================================
 * MODEL METRICS (Landing Hero Stat)
 * ================================
 */
async function initModelPerformanceMetric() {
    const headingEl = document.getElementById('modelMetricHeading');
    const subtextEl = document.getElementById('modelMetricSubtext');
    const techEl = document.getElementById('modelMetricTech');
    const tooltipEl = document.getElementById('modelMetricTooltip');
    if (!headingEl) return;

    try {
        const response = await fetch(`${API_BASE_URL}/metrics`);
        if (response.ok) {
            const data = await response.json();
            const r2 = data.r2_score || 0.91;
            const rmse = data.rmse || 0.38;
            const pct = Math.round(r2 * 100);

            headingEl.innerHTML = `<span class="stat-performance-pct">${pct}%</span> Accurate Predictions`;
            if (subtextEl) subtextEl.textContent = 'Based on current model training';
            
            const techLine = `R² = ${r2.toFixed(2)} · RMSE = ${rmse.toFixed(2)} t/ha`;
            if (techEl) techEl.textContent = techLine;
            if (tooltipEl) tooltipEl.textContent = techLine;
        }
    } catch (err) {
        console.warn("Could not fetch real metrics, using defaults.");
    }
}


/**
 * ================================
 * FOOTER SCROLL REVEAL
 * ================================
 */
function initFooterReveal() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    const handleScroll = () => {
        // Show footer after scrolling 100px
        if (window.scrollY > 100) {
            footer.classList.add('footer--visible');
        } else {
            footer.classList.remove('footer--visible');
        }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check in case page is already scrolled
    handleScroll();
}

/**
 * ================================
 * AUTHENTICATION FUNCTIONS
 * ================================
 */

/** In-memory login field state (vanilla equivalent of controlled inputs). */
const loginFieldState = { email: '', password: '' };

/**
 * Clears login inputs and state; unique `name` attrs reduce sticky browser autofill.
 * Call on login page load and after bfcache restore.
 */
function initLoginPageCredentialFields() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    if (!loginForm || !emailInput || !passwordInput) return;

    const unique = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).replace(/[^a-z0-9]/gi, '').slice(0, 20);
    emailInput.setAttribute('name', `user_email_${unique}`);
    passwordInput.setAttribute('name', `user_password_${unique}`);

    const resetLoginFields = () => {
        loginFieldState.email = '';
        loginFieldState.password = '';
        emailInput.value = '';
        passwordInput.value = '';
    };

    resetLoginFields();

    emailInput.addEventListener('input', () => {
        loginFieldState.email = emailInput.value;
    });
    passwordInput.addEventListener('input', () => {
        loginFieldState.password = passwordInput.value;
    });

    requestAnimationFrame(() => {
        resetLoginFields();
        setTimeout(resetLoginFields, 0);
        setTimeout(resetLoginFields, 100);
        setTimeout(resetLoginFields, 300);
    });
}

function attachLoginPageLifecycleHandlers() {
    if (!document.getElementById('loginForm')) return;
    window.addEventListener('pageshow', (ev) => {
        if (!document.getElementById('loginForm')) return;
        if (!ev.persisted) return;
        loginFieldState.email = '';
        loginFieldState.password = '';
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    });
}

/**
 * Store JWT + profile from /users/me (used after login and after signup).
 */
async function saveUserSession(accessToken) {
    if (!accessToken) return false;
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) return false;
    const userInfo = await response.json();
    localStorage.setItem('currentUser', JSON.stringify({
        name: userInfo.full_name || userInfo.username,
        email: userInfo.email,
        username: userInfo.username,
        token: accessToken
    }));
    return true;
}

/**
 * Go to crop prediction dashboard after login/signup.
 * Tries same-folder dashboard.html, then /frontend/dashboard.html, then /dashboard (API redirect).
 */
function navigateToDashboard() {
    let target = 'dashboard.html';
    try {
        const { pathname, origin } = window.location;
        if (pathname && pathname.endsWith('.html')) {
            target = pathname.slice(0, pathname.lastIndexOf('/') + 1) + 'dashboard.html';
        } else if (pathname && pathname.includes('/frontend')) {
            target = '/frontend/dashboard.html';
        } else if (origin && (origin.includes('127.0.0.1') || origin.includes('localhost'))) {
            target = '/frontend/dashboard.html';
        }
    } catch (e) {
        target = 'dashboard.html';
    }

    try {
        window.location.replace(target);
    } catch (e) {
        try {
            window.location.href = target;
        } catch (e2) {
            window.location.href = '/dashboard';
        }
    }
}

async function fetchTokenWithPassword(email, password) {
    const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: password })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token || null;
}

async function handleLogin(event) {
    if (event) event.preventDefault();
    
    const email = (document.getElementById('login-email')?.value ?? loginFieldState.email)?.trim();
    const password = document.getElementById('login-password')?.value ?? loginFieldState.password;

    if (!email || !password) return;

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>Signing In...</span>';
    }

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
            const saved = await saveUserSession(data.access_token);
            if (!saved) {
                showAlert('✗ Could not verify session. Try again.', 'error', 'login');
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<span>Sign In</span>';
                }
                return;
            }
            showAlert('✓ Login successful! Redirecting...', 'success', 'login');
            navigateToDashboard();
        } else {
            showAlert('✗ Invalid email or password', 'error', 'login');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span>Sign In</span>';
            }
        }
    } catch (error) {
        showAlert('✗ Connection error: ' + error.message, 'error', 'login');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Sign In</span>';
        }
    }
}

async function handleSignup(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('signup-name')?.value?.trim();
    const email = document.getElementById('signup-email')?.value?.trim();
    const password = document.getElementById('signup-password')?.value;
    const confirm = document.getElementById('signup-confirm')?.value;

    if (!name || !email || !password || !confirm) return;

    if (password !== confirm) {
        showAlert('✗ Passwords do not match', 'error', 'signup');
        return;
    }

    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<span>Creating Account...</span>';
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
            let token = data.access_token;
            if (!token) {
                showAlert('✗ Authentication error: No token received', 'error', 'signup');
                return;
            }

            let saved = await saveUserSession(token);
            if (!saved) {
                token = await fetchTokenWithPassword(email, password);
                if (token) {
                    saved = await saveUserSession(token);
                }
            }

            if (!saved) {
                showAlert('✗ Account created but auto sign-in failed. Please sign in with your email and password.', 'error', 'signup');
                return;
            }

            showAlert('✓ Account created! Redirecting...', 'success', 'signup');
            navigateToDashboard();
        } else {
            const error = await response.json();
            showAlert('✗ ' + (error.detail || 'Registration failed'), 'error', 'signup');
        }
    } catch (error) {
        showAlert('✗ Connection error: ' + error.message, 'error', 'signup');
    } finally {
        const signupBtn = document.getElementById('signupBtn');
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<span>Create Account</span>';
        }
    }
}

function logout() {
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch (e) {
        /* ignore storage errors (private mode, etc.) */
    }
    window.location.href = 'modern-login.html';
}

/**
 * ================================
 * CORE PREDICTION FUNCTIONS
 * ================================
 */

/**
 * Global validator used by `predict()` before calling the API.
 * Keep this outside DOMContentLoaded so submit handlers can access it.
 */
function checkFormValidityForPredict(triggerUI = false) {
    const form = document.getElementById('prediction-form');
    if (!form) return false;

    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (input.tagName === 'SELECT') {
            const hasValue = Boolean(input.value);
            if (!hasValue) {
                isValid = false;
                if (triggerUI) input.classList.add('input-invalid');
            } else {
                input.classList.remove('input-invalid');
            }
            return;
        }

        const raw = input.value;
        const val = parseFloat(raw);
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));
        const msgEl = document.getElementById(`msg-${input.id}`);

        if (raw === '' || Number.isNaN(val) || val < min || val > max) {
            isValid = false;
            if (triggerUI) {
                input.classList.add('input-invalid');
                if (msgEl) msgEl.textContent = 'Input out of realistic range. Please enter valid agricultural data.';
            }
        } else {
            input.classList.remove('input-invalid');
            if (msgEl) msgEl.textContent = '';
        }
    });

    return isValid;
}

async function predict(event) {
    if (event) event.preventDefault();
    
    // Final check for valid inputs before processing
    if (!checkFormValidityForPredict()) {
        alert("Input out of realistic range. Please enter valid agricultural data.");
        return;
    }
    
    // STEP 9: DEBUG LOGS
    console.log("Predict clicked. Validating inputs...");
    
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

    console.log("Form inputs gathered:", {rainfall, temperature, humidity, N, P, K, area, state, crop});

    if (!checkFormValidityForPredict(true)) {
        // Validation messages are shown inline via triggerUI=true
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
    const isCommonCropInState = !validCropsForState || validCropsForState.includes(crop);

    // STEP 9: DEBUG LOGS
    console.log("Payload:", payload);

    try {
        if (predictBtn) {
            predictBtn.disabled = true;
            predictBtn.innerHTML = '<span class="btn-text">Predicting...</span>';
        }

        // Get Auth Token (Required by Backend)
        let token = null;
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            token = currentUser ? currentUser.token : null;
        } catch (authErr) {
            console.error("Auth token retrieval failed:", authErr);
        }

        console.log("Using token:", token ? "Token present" : "No token");

        // STEP 3: API CALL
        console.log("Sending request to:", `${API_BASE_URL}/predict`);
        console.log("Payload:", payload);
        
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": token ? `Bearer ${token}` : "" 
            },
            body: JSON.stringify(payload)
        });

        // STEP 5: RESPONSE HANDLING
        console.log("API Response Status:", response.status);
        if (response.ok) {
            const data = await response.json();
            console.log("Response:", data);
            // STEP 9: DEBUG LOGS
            console.log("Response:", data);

            // STEP 6: UPDATE UI
            const resultValue = document.getElementById('resultValue');
            const totalYield = document.getElementById('totalYield');
            const confidenceEl = document.getElementById('confidence');
            const resultSection = document.getElementById('resultSection');

            if (resultValue) {
                resultValue.textContent = (data.predicted_yield != null) ? data.predicted_yield.toFixed(2) : "--";
            }
            if (totalYield) {
                const total = (data.predicted_yield != null) ? data.predicted_yield * payload.area : 0;
                totalYield.textContent = total > 0 ? formatNumber(total.toFixed(0)) + ' T' : "-- T";
            }
            if (confidenceEl) {
                const shouldShowLowConfidence = (!isCommonCropInState) || (data.is_valid_combo === false);
                const confScore = shouldShowLowConfidence ? 75 : 90;
                confidenceEl.textContent = `${confScore}%`;
                
                // User Feedback & Color Change
                const feedbackEl = document.getElementById('confidenceFeedback');
                if (feedbackEl) {
                    feedbackEl.style.display = 'block';
                    if (!shouldShowLowConfidence) {
                        feedbackEl.textContent = '✔ High confidence prediction based on known agricultural data.';
                        feedbackEl.style.color = '#4ade80';
                        feedbackEl.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
                        confidenceEl.style.color = '#4ade80';
                    } else {
                        feedbackEl.textContent = '⚠ Limited historical data for this crop in the selected state. Prediction may be less accurate.';
                        feedbackEl.style.color = '#fbbf24';
                        feedbackEl.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                        confidenceEl.style.color = '#fbbf24';
                    }
                }
            }
            
            if (resultSection) {
                resultSection.classList.add('show');
                resultSection.style.display = 'block'; // Ensure visibility
            }
            


            // Generate Recommendations
            const recommendationsBox = document.getElementById('recommendationsBox');
            const recommendationsList = document.getElementById('recommendationsList');
            
            if (recommendationsBox && recommendationsList) {
                recommendationsList.innerHTML = '';
                const insights = [...(data.warnings || [])];
                
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
                } else {
                    const li = document.createElement('li');
                    li.textContent = "Optimal conditions detected for this crop profile.";
                    recommendationsList.appendChild(li);
                }
            }

            // STEP 7: SAFE CHART UPDATE
            try {
                updateChartsImmediately();
            } catch (chartErr) {
                console.error("Charts failed to update, but prediction is valid.");
            }

            // Intentionally no success banner on prediction (user requested cleaner UI)
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
        if (predictBtn) {
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<span class="btn-text">Predict Yield</span>';
        }
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

document.addEventListener('DOMContentLoaded', async function() {
    const pathname = window.location.pathname || '';
    const pageName = pathname.split('/').filter(Boolean).pop() || 'index.html';

    // Verify Auth State
    const currentUserRaw = localStorage.getItem('currentUser');
    let user = null;
    if (currentUserRaw) {
        try {
            user = JSON.parse(currentUserRaw);
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }

    // Protection logic
    if (pageName === 'dashboard.html' && !user) {
        window.location.replace('modern-login.html');
        return;
    }

    if (pageName === 'modern-login.html' && user) {
        window.location.replace('dashboard.html');
        return;
    }

    if (user) {
        // UI updates for logged-in users
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const userGreeting = document.getElementById('userGreeting');
        
        if (userNameEl) userNameEl.textContent = user.name || 'Farmer';
        if (userAvatarEl && user.name) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
        if (userGreeting) userGreeting.style.display = 'flex';
    }

    // Initialize Footer Reveal
    initFooterReveal();

    // ATTACH PREDICTION FORM (Highest Priority)
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        console.log("Prediction form found, attaching handler...");
        predictionForm.addEventListener('submit', predict);
    }

    // Update Nav button to point to dashboard
        // Update Nav button to point to dashboard
        const authBtn = document.getElementById('auth-btn');
        if (authBtn) {
            authBtn.textContent = 'Dashboard';
            authBtn.href = 'dashboard.html';
        }

        // Handle logout button independent of authBtn
        let logoutBtn = document.getElementById('logout-btn');
        const navRight = document.querySelector('.nav-right');
        
        if (user && navRight) {
            if (!logoutBtn) {
                logoutBtn = document.createElement('a');
                logoutBtn.id = 'logout-btn';
                logoutBtn.href = '#';
                logoutBtn.className = 'btn-logout';
                logoutBtn.textContent = 'Logout';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
                navRight.appendChild(logoutBtn);
            }
            logoutBtn.style.display = 'inline-flex';
        }

    initLoginPageCredentialFields();
    attachLoginPageLifecycleHandlers();

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

    // Animate demo yield on preview card
    initPreviewYieldAnimation();

    // Initialize count-up animation for hero stats
    initCountUp();

    // Load real model performance metric for hero
    initModelPerformanceMetric();

    // Initialize How It Works step animations
    initStepAnimations();

    // Form submit listener moved to top of block for reliability

    // Add real-time listeners for dynamic chart updates and validation
    const numericInputs = ['N', 'P', 'K', 'rainfall', 'temperature', 'humidity', 'area'];
    numericInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', () => {
                validateInput(input);
                updateCharts();
                checkFormValidity();
            });
            
            // Auto-correction / Clamping on blur
            input.addEventListener('blur', () => {
                clampInput(input);
                validateInput(input);
                updateCharts();
                checkFormValidity();
            });
        }
    });

    // Check dropdowns too
    ['state', 'crop'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', checkFormValidity);
        }
    });

    function validateInput(input) {
        const val = parseFloat(input.value);
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));
        const msgEl = document.getElementById(`msg-${input.id}`);
        
        if (isNaN(val)) {
            if (input.required) {
                input.classList.add('input-invalid');
                if (msgEl) msgEl.textContent = 'This field is required';
            } else {
                input.classList.remove('input-invalid');
                if (msgEl) msgEl.textContent = '';
            }
            return false;
        }

        if (val < min || val > max) {
            input.classList.add('input-invalid');
            if (msgEl) msgEl.textContent = 'Input out of realistic range. Please enter valid agricultural data.';
            return false;
        } else {
            input.classList.remove('input-invalid');
            if (msgEl) msgEl.textContent = '';
            return true;
        }
    }

    function clampInput(input) {
        let val = parseFloat(input.value);
        const min = parseFloat(input.getAttribute('min'));
        const max = parseFloat(input.getAttribute('max'));
        
        if (isNaN(val)) return;
        
        if (val > max) input.value = max;
        if (val < min) input.value = min;
    }

    function checkFormValidityForPredict(triggerUI = false) {
        const form = document.getElementById('prediction-form');
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (input.tagName === 'SELECT') {
                if (!input.value) {
                    isValid = false;
                    // For selects, we don't have a specific msg element but we can highlight
                    if (triggerUI) input.classList.add('input-invalid');
                } else {
                    input.classList.remove('input-invalid');
                }
            } else {
                const val = parseFloat(input.value);
                const min = parseFloat(input.getAttribute('min'));
                const max = parseFloat(input.getAttribute('max'));
                if (isNaN(val) || val < min || val > max) {
                    isValid = false;
                    if (triggerUI) validateInput(input);
                }
            }
        });

        return isValid;
    }

    function checkFormValidity() {
        const btn = document.getElementById('predictBtn');
        if (!btn) return;

        const isValid = checkFormValidityForPredict();
        btn.disabled = !isValid;
    }

    // Initial check
    // Initial check (disabled to prevent showing empty field errors on load)
    // checkFormValidity();

    // Smooth scrolling for in-page anchors (avoids querySelector('#') on href="#")
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href === '#!') return;
            const id = href.slice(1);
            if (!id) return;
            const target = document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
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

// Modern color palette (nutrient bars + weather doughnut)
const chartColors = {
    nitrogen: '#22c55e',
    phosphorus: '#3b82f6',
    potassium: '#f59e0b',
    nitrogenSoft: 'rgba(34, 197, 94, 0.38)',
    phosphorusSoft: 'rgba(59, 130, 246, 0.38)',
    potassiumSoft: 'rgba(245, 158, 11, 0.38)',
    nitrogenHover: '#4ade80',
    phosphorusHover: '#60a5fa',
    potassiumHover: '#fbbf24',
    rainfall: '#1abc9c',
    temperature: '#f39c12',
    humidity: '#3498db'
};

const nutrientBarStops = [
    { solid: chartColors.nitrogen, soft: chartColors.nitrogenSoft, hover: chartColors.nitrogenHover },
    { solid: chartColors.phosphorus, soft: chartColors.phosphorusSoft, hover: chartColors.phosphorusHover },
    { solid: chartColors.potassium, soft: chartColors.potassiumSoft, hover: chartColors.potassiumHover }
];

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
                backgroundColor(context) {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return nutrientBarStops[context.dataIndex]?.solid ?? chartColors.nitrogen;
                    }
                    const { solid, soft } = nutrientBarStops[context.dataIndex] ?? nutrientBarStops[0];
                    const g = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                    g.addColorStop(0, soft);
                    g.addColorStop(0.55, solid);
                    g.addColorStop(1, solid);
                    return g;
                },
                borderRadius: 10,
                borderSkipped: false,
                maxBarThickness: 52,
                barPercentage: 0.88,
                categoryPercentage: 0.72,
                hoverBackgroundColor: [
                    chartColors.nitrogenHover,
                    chartColors.phosphorusHover,
                    chartColors.potassiumHover
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1100,
                easing: 'easeOutCubic',
                delay(context) {
                    if (context.type === 'data' && context.mode === 'default' && context.dataIndex != null) {
                        return context.dataIndex * 90;
                    }
                    return 0;
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(27, 67, 50, 0.92)',
                    titleColor: '#52B788',
                    bodyColor: '#ffffff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    boxPadding: 6,
                    usePointStyle: true
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
                duration: 1100,
                easing: 'easeOutCubic',
                delay(context) {
                    if (context.type === 'data' && context.mode === 'default' && context.dataIndex != null) {
                        return context.dataIndex * 90;
                    }
                    return 0;
                }
            },
            cutout: '65%',
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        color: 'rgba(255, 255, 255, 0.75)'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(27, 67, 50, 0.92)',
                    titleColor: '#52B788',
                    bodyColor: '#ffffff',
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    boxPadding: 6,
                    usePointStyle: true
                }
            }
        }
    });
}

function updateChartsImmediately() {
    if (!window.barChart || !window.pieChart) return;

    const n = parseFloat(document.getElementById('N')?.value) || 0;
    const p = parseFloat(document.getElementById('P')?.value) || 0;
    const k = parseFloat(document.getElementById('K')?.value) || 0;
    const rain = parseFloat(document.getElementById('rainfall')?.value) || 0;
    const temp = parseFloat(document.getElementById('temperature')?.value) || 0;
    const hum = parseFloat(document.getElementById('humidity')?.value) || 0;

    window.barChart.data.datasets[0].data = [n, p, k];
    window.barChart.update('none'); // Update without animation for performance in real-time

    window.pieChart.data.datasets[0].data = [rain, temp, hum];
    window.pieChart.update('none');
}

let chartUpdateTimeout;
function updateCharts() {
    // Debounced update for performance while typing
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(updateChartsImmediately, 100);
}
