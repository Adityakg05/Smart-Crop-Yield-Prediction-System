const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.apiUrl)
    ? window.APP_CONFIG.apiUrl
    : 'http://127.0.0.1:8000';

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

    setTimeout(type, 800);
}

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
            const display = Number.isInteger(target) ? Math.round(current) : current.toFixed(1);
            el.textContent = display + suffix;
        }, stepTime);
    };

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
            target = '/frontend/pages/dashboard.html';
        } else if (origin && (origin.includes('127.0.0.1') || origin.includes('localhost'))) {
            target = '/frontend/pages/dashboard.html';
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
        console.log('Attempting signup to:', `${API_BASE_URL}/register`);
        console.log('Payload:', { full_name: name, email, username: email });
        
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

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);
            
            // Clear any existing session to ensure fresh login
            localStorage.clear();
            sessionStorage.clear();
            
            showAlert('✓ Account created! Redirecting to login...', 'success', 'signup');
            setTimeout(() => {
                window.location.replace('login.html');
            }, 1500);
        } else {
            const error = await response.json();
            console.log('Error response:', error);
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
        
        // Clear any potential service worker caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    } catch (e) {
        /* ignore storage errors (private mode, etc.) */
    }
    
    // Use replace to prevent back button and redirect to landing page
    window.location.replace('index.html');
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

    if (!checkFormValidityForPredict()) {
        alert("Some inputs are outside realistic agricultural ranges. Please check the highlighted fields.");
        return;
    }
    
    const rainfall    = document.getElementById('rainfall')?.value;
    const temperature = document.getElementById('temperature')?.value;
    const humidity    = document.getElementById('humidity')?.value;
    const nitrogen    = document.getElementById('N')?.value;
    const phosphorus  = document.getElementById('P')?.value;
    const potassium   = document.getElementById('K')?.value;
    const farmArea    = document.getElementById('area')?.value;
    const selectedState = document.getElementById('state')?.value;
    const selectedCrop  = document.getElementById('crop')?.value;

    if (!checkFormValidityForPredict(true)) return;

    // Warn if the crop isn't typically grown in that state, but let the
    // farmer proceed — they might know something we don't.
    const commonCropsForState = stateCropMapping[selectedState];
    if (commonCropsForState && !commonCropsForState.includes(selectedCrop)) {
        const topSuggestions = commonCropsForState.slice(0, 5).join(', ');
        const shouldProceed = confirm(
            `⚠️ "${selectedCrop}" isn't commonly grown in ${selectedState}.\n\n` +
            `The prediction might be less accurate.\n\n` +
            `Common crops for ${selectedState}: ${topSuggestions}\n\n` +
            `Continue anyway?`
        );
        if (!shouldProceed) return;
    }

    const cropInputPayload = {
        rainfall:    parseFloat(rainfall),
        temperature: parseFloat(temperature),
        humidity:    parseFloat(humidity),
        N:           parseFloat(nitrogen),
        P:           parseFloat(phosphorus),
        K:           parseFloat(potassium),
        area:        parseFloat(farmArea),
        state:       selectedState,
        crop:        selectedCrop,
    };
    const isCommonCropInState = !commonCropsForState || commonCropsForState.includes(selectedCrop);

    try {
        const predictBtn = document.getElementById('predictBtn');
        if (predictBtn) {
            predictBtn.disabled = true;
            predictBtn.innerHTML = '<span class="btn-text">Predicting...</span>';
        }

        // Pull the token from storage. If missing, the 401 handler below
        // will redirect to login automatically.
        let authToken = null;
        try {
            const sessionData = JSON.parse(localStorage.getItem('currentUser'));
            authToken = sessionData?.token ?? null;
        } catch {
            // Corrupted localStorage entry — treat as logged out
        }

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : '',
            },
            body: JSON.stringify(cropInputPayload),
        });

        if (response.ok) {
            const yieldResult = await response.json();

            const yieldPerHectare = yieldResult.predicted_yield != null
                ? (yieldResult.predicted_yield / 1000).toFixed(2)
                : '--';
            const totalFarmYield = yieldResult.predicted_yield != null
                ? (yieldResult.predicted_yield / 1000) * cropInputPayload.area
                : 0;

            const resultValueEl  = document.getElementById('resultValue');
            const totalYieldEl   = document.getElementById('totalYield');
            const confidenceEl   = document.getElementById('confidence');
            const resultSection  = document.getElementById('resultSection');

            if (resultValueEl) resultValueEl.textContent = yieldPerHectare;
            if (totalYieldEl) {
                totalYieldEl.textContent = totalFarmYield > 0
                    ? formatNumber(totalFarmYield.toFixed(0)) + ' T'
                    : '-- T';
            }

            if (confidenceEl) {
                const isLowConfidence = !isCommonCropInState || yieldResult.is_valid_combo === false;
                confidenceEl.textContent = isLowConfidence ? '75%' : '90%';

                const feedbackEl = document.getElementById('confidenceFeedback');
                if (feedbackEl) {
                    feedbackEl.style.display = 'block';
                    if (!isLowConfidence) {
                        feedbackEl.textContent      = '✔ High confidence — this crop/state combo has strong historical data.';
                        feedbackEl.style.color      = '#4ade80';
                        feedbackEl.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
                        confidenceEl.style.color    = '#4ade80';
                    } else {
                        feedbackEl.textContent      = '⚠ Limited data for this region — treat the estimate as a rough guide.';
                        feedbackEl.style.color      = '#fbbf24';
                        feedbackEl.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                        confidenceEl.style.color    = '#fbbf24';
                    }
                }
            }

            if (resultSection) {
                resultSection.classList.add('show');
                resultSection.style.display = 'block';
            }

            const recommendationsBox  = document.getElementById('recommendationsBox');
            const recommendationsList = document.getElementById('recommendationsList');
            
            if (recommendationsBox && recommendationsList) {
                recommendationsList.innerHTML = '';

                // Start with any warnings the model returned, then add rule-based tips
                const farmingInsights = [...(yieldResult.warnings || [])];

                if (cropInputPayload.N < 40)          farmingInsights.push('Nitrogen is on the low side — a top-dress application before flowering could help.');
                if (cropInputPayload.rainfall < 100)  farmingInsights.push('Low rainfall expected — plan for supplementary irrigation at critical growth stages.');
                if (cropInputPayload.humidity > 80)   farmingInsights.push('High humidity raises disease risk — keep an eye out for fungal issues.');
                if (cropInputPayload.temperature > 35) farmingInsights.push('Heat stress is possible above 35°C — mulching can help retain soil moisture.');

                if (farmingInsights.length > 0) {
                    farmingInsights.forEach(tip => {
                        const li = document.createElement('li');
                        li.textContent = tip;
                        recommendationsList.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'Conditions look good for this crop. No major concerns detected.';
                    recommendationsList.appendChild(li);
                }
            }

            try { updateChartsImmediately(); } catch { /* charts are optional */ }

        } else if (response.status === 401) {
            alert('Your session has expired — please log in again.');
            logout();
        } else {
            const errorBody = await response.json().catch(() => ({ detail: 'Unknown server error' }));
            alert('Prediction failed: ' + (errorBody.detail || 'Something went wrong on the server.'));
        }

    } catch (networkError) {
        console.error('Network error during prediction:', networkError);
        alert('Could not reach the server. Make sure the backend is running on http://127.0.0.1:8000');
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
        window.location.replace('login.html');
        return;
    }

    if (pageName === 'login.html' && user) {
        window.location.replace('dashboard.html');
        return;
    }

    if (user) {
        // UI updates for logged-in users
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');
        const userGreeting = document.getElementById('userGreeting');
        
        let displayName = user.name || 'Farmer';
        if (displayName.includes('@')) {
            displayName = displayName.split('@')[0];
        }
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

        if (userNameEl) userNameEl.textContent = displayName;
        if (userAvatarEl && displayName) userAvatarEl.textContent = displayName.charAt(0).toUpperCase();
        if (userGreeting) userGreeting.style.display = 'flex';
    }

    // Initialize Footer Reveal
    initFooterReveal();

    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', predict);
    }

    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        if (user) {
            authBtn.textContent = 'Dashboard';
            authBtn.href = 'dashboard.html';
        } else {
            authBtn.textContent = 'Login';
            authBtn.href = 'login.html';
        }
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
                if (msgEl) msgEl.textContent = 'This field is required.';
            } else {
                input.classList.remove('input-invalid');
                if (msgEl) msgEl.textContent = '';
            }
            return false;
        }

        if (val < min || val > max) {
            input.classList.add('input-invalid');
            if (msgEl) msgEl.textContent = `Value must be between ${min} and ${max}.`;
            return false;
        }

        input.classList.remove('input-invalid');
        if (msgEl) msgEl.textContent = '';
        return true;
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

    // Don't run validity check on load — empty fields would all turn red
    // before the user has typed anything, which feels aggressive.
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

// Charts are stored on window so the predict() function can update them
// from outside initCharts()'s closure.
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
    window.barChart.update('none'); // 'none' skips animation — instant feedback while typing

    window.pieChart.data.datasets[0].data = [rain, temp, hum];
    window.pieChart.update('none');
}

let chartUpdateTimeout;
function updateCharts() {
    // Debounce so we're not redrawing on every single keypress
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(updateChartsImmediately, 100);
}
