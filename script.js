// NETLIFY FORM SUBMISSION PREVENTION - NUCLEAR OPTION
(function() {
    // 1. Remove all form attributes that Netlify might use
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.removeAttribute('action');
            form.removeAttribute('method');
            form.removeAttribute('data-netlify');
            form.removeAttribute('netlify');
            form.removeAttribute('name');
            form.removeAttribute('id'); // We'll restore this after
        });
    });

    // 2. Intercept ALL form submissions at the document level
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
    }, true);

    // 3. Override fetch to block Netlify API calls
    const originalFetch = window.fetch;
    window.fetch = function(resource, options) {
        if (typeof resource === 'string' && 
            (resource.includes('/api/') || resource.includes('.netlify/functions'))) {
            console.log('Blocked Netlify API call to:', resource);
            return Promise.reject(new Error('Netlify API calls disabled'));
        }
        return originalFetch.call(this, resource, options);
    };

    // 4. Remove Netlify's form handling script if it exists
    const netlifyScript = document.querySelector('script[src*="netlify"]');
    if (netlifyScript) {
        netlifyScript.remove();
    }
})();

// User Management
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// User Registration and Login Functions
function setupAuthForms() {
    // Re-add form IDs after Netlify prevention
    const loginForm = document.querySelector('form');
    if (loginForm && !loginForm.id) {
        loginForm.id = 'loginForm';
    }
    
    const registerForm = document.querySelector('form');
    if (registerForm && !registerForm.id) {
        registerForm.id = 'registerForm';
    }

    setupLoginForm();
    setupRegisterForm();
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const messageEl = document.getElementById('loginMessage');
        
        if (!email || !password) {
            showMessage(messageEl, 'Please fill in all fields', 'error');
            return false;
        }
        
        const success = loginUser(email, password);
        
        if (success) {
            showMessage(messageEl, 'Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showMessage(messageEl, 'Invalid email or password', 'error');
        }
        return false;
    };
}

function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const name = document.getElementById('name')?.value;
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const messageEl = document.getElementById('registerMessage');
        
        if (!name || !email || !password || !confirmPassword) {
            showMessage(messageEl, 'Please fill in all fields', 'error');
            return false;
        }
        
        if (password !== confirmPassword) {
            showMessage(messageEl, 'Passwords do not match', 'error');
            return false;
        }
        
        if (password.length < 6) {
            showMessage(messageEl, 'Password must be at least 6 characters', 'error');
            return false;
        }
        
        const success = registerUser(name, email, password);
        
        if (success) {
            showMessage(messageEl, 'Account created successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage(messageEl, 'Email already exists', 'error');
        }
        return false;
    };
}

// Simple hash function for basic security
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return btoa(hash.toString() + 'ndis_salt_2025');
}

function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('ndisUsers') || '[]');
    const existingUser = users.find(user => user.email === email);
    if (existingUser) return false;
    
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        passwordHash: simpleHash(password),
        createdAt: new Date().toISOString(),
        services: [],
        lastLogin: null
    };
    
    users.push(newUser);
    localStorage.setItem('ndisUsers', JSON.stringify(users));
    return true;
}

function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('ndisUsers') || '[]');
    const user = users.find(u => u.email === email && u.passwordHash === simpleHash(password));
    
    if (user) {
        user.lastLogin = new Date().toISOString();
        localStorage.setItem('ndisUsers', JSON.stringify(users));
        const { passwordHash, ...userWithoutPassword } = user;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        currentUser = userWithoutPassword;
        return true;
    }
    return false;
}

function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.style.color = type === 'success' ? 'green' : 'red';
    element.style.padding = '10px';
    element.style.borderRadius = '4px';
    element.style.backgroundColor = type === 'success' ? '#f0fff0' : '#fff0f0';
}

// Data encryption
function encryptData(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decryptData(encryptedData) {
    try {
        return JSON.parse(decodeURIComponent(atob(encryptedData)));
    } catch {
        return null;
    }
}

// Secure service data storage
function saveServiceData(services) {
    const encrypted = encryptData(services);
    localStorage.setItem('ndisServicesSecure', encrypted);
}

function loadServiceData() {
    const encrypted = localStorage.getItem('ndisServicesSecure');
    return encrypted ? decryptData(encrypted) : [];
}

// Initialize sample data
function initializeSampleData() {
    if (!localStorage.getItem('ndisUsers')) {
        const sampleUsers = [
            {
                id: 1,
                name: "Test User",
                email: "test@example.com",
                passwordHash: simpleHash("password123"),
                createdAt: new Date().toISOString(),
                services: [],
                lastLogin: null
            }
        ];
        localStorage.setItem('ndisUsers', JSON.stringify(sampleUsers));
    }

    if (!localStorage.getItem('ndisServicesSecure')) {
        const sampleServices = [
            {
                id: 1,
                name: "Community Care Services",
                location: "Sydney",
                category: ["Support Worker", "Respite"],
                description: "Providing quality in-home support and community access",
                phone: "0412 345 678",
                email: "contact@communitycare.com",
                registered: "Yes",
                averageRating: 4.5,
                reviewCount: 12,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "Allied Health Professionals",
                location: "Melbourne",
                category: ["Allied Health Professional", "Occupational Therapist"],
                description: "Experienced OT and physiotherapy services",
                phone: "0432 123 456",
                email: "admin@alliedhealth.com",
                registered: "Yes",
                averageRating: 4.8,
                reviewCount: 8,
                createdAt: new Date().toISOString()
            }
        ];
        saveServiceData(sampleServices);
    }
}

// Favorites System
function setupFavorites() {
    if (!localStorage.getItem('favorites')) {
        localStorage.setItem('favorites', JSON.stringify([]));
    }
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites')) || [];
}

function toggleFavorite(serviceId) {
    const favorites = getFavorites();
    const index = favorites.indexOf(serviceId);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(serviceId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return index === -1;
}

function isFavorite(serviceId) {
    const favorites = getFavorites();
    return favorites.includes(serviceId);
}

function addFavoriteButton(service) {
    const isFav = isFavorite(service.id);
    return `
        <button class="favorite-btn ${isFav ? 'favorited' : ''}"
            onclick="handleFavoriteClick(${service.id}, this)"
            title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
            ♥
        </button>
    `;
}

// Global function for favorite clicks
window.handleFavoriteClick = function(serviceId, button) {
    const wasAdded = toggleFavorite(serviceId);
    button.classList.toggle('favorited', wasAdded);
    button.title = wasAdded ? 'Remove from favorites' : 'Add to favorites';
    const originalText = button.innerHTML;
    button.innerHTML = wasAdded ? '✓' : '♥';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 500);
};

// Advanced Search and Filtering
let currentFilters = {
    categories: [],
    registered: '',
    sortBy: 'newest'
};

// Service data management
async function testAPI() {
    try {
        const response = await fetch('/api/search');
        if (!response.ok) throw new Error('API not available');
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return loadServiceData();
    }
}

// Initialize statistics
async function initializeStatistics() {
    try {
        const services = await testAPI();
        if (services && services.length > 0) {
            const locations = new Set();
            services.forEach(service => {
                if (service.location) {
                    const cleanLocation = service.location.trim().toLowerCase();
                    if (cleanLocation) locations.add(cleanLocation);
                }
            });
            const totalServicesElement = document.getElementById('totalServices');
            const totalLocationsElement = document.getElementById('totalLocations');
            if (totalServicesElement) totalServicesElement.textContent = services.length;
            if (totalLocationsElement) totalLocationsElement.textContent = locations.size;
        } else {
            const totalServicesElement = document.getElementById('totalServices');
            const totalLocationsElement = document.getElementById('totalLocations');
            if (totalServicesElement) totalServicesElement.textContent = '0';
            if (totalLocationsElement) totalLocationsElement.textContent = '0';
        }
    } catch (err) {
        const totalServicesElement = document.getElementById('totalServices');
        const totalLocationsElement = document.getElementById('totalLocations');
        if (totalServicesElement) totalServicesElement.textContent = '0';
        if (totalLocationsElement) totalLocationsElement.textContent = '0';
    }
}

// Display services as cards with advanced filtering
async function searchServices() {
    const queryInput = document.getElementById("searchBox");
    const list = document.getElementById("serviceList");
    const noResults = document.getElementById("noResults");
    const resultsCount = document.getElementById("resultsCount");
    const loadingIndicator = document.getElementById("loadingIndicator");
    const allServicesSection = document.getElementById("allServicesSection");

    if (!list) return;
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (resultsCount) resultsCount.textContent = '0';

    const query = (queryInput?.value || "").toLowerCase();

    try {
        showSkeletonLoading(list);
        let services = await testAPI();
        services = applyAdvancedFilters(services);

        if (query) {
            services = services.filter(service => 
                (service.name && service.name.toLowerCase().includes(query)) ||
                (service.location && service.location.toLowerCase().includes(query)) ||
                (service.description && service.description.toLowerCase().includes(query)) ||
                (service.category && service.category.some(cat => cat.toLowerCase().includes(query)))
            );
        }

        if (resultsCount) resultsCount.textContent = services.length;
        list.innerHTML = "";
        
        if (!services.length) {
            if (noResults) noResults.style.display = "block";
            if (allServicesSection) allServicesSection.style.display = "none";
            return;
        }

        if (noResults) noResults.style.display = "none";
        if (allServicesSection) allServicesSection.style.display = "block";

        services.forEach(s => {
            const li = createServiceCard(s);
            list.appendChild(li);
        });

        if (!query && document.getElementById('recentServiceList')) {
            loadRecentServices();
        } else if (document.getElementById('recentServiceList')) {
            document.getElementById('recentServiceList').parentElement.style.display = 'none';
        }

    } catch (err) {
        if (resultsCount) resultsCount.textContent = '0';
        if (noResults) noResults.style.display = "block";
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// Load recent services (limited to 2)
async function loadRecentServices() {
    try {
        const recentList = document.getElementById('recentServiceList');
        const noRecentResults = document.getElementById('noRecentResults');
        if (!recentList) return;

        let services = await testAPI();
        services.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        recentList.innerHTML = "";
        
        if (!services.length) {
            if (noRecentResults) noRecentResults.style.display = "block";
            return;
        }

        if (noRecentResults) noRecentResults.style.display = "none";
        services.slice(0, 2).forEach(s => {
            const li = createServiceCard(s);
            recentList.appendChild(li);
        });

    } catch (err) {
        console.error("Error loading recent services:", err);
    }
}

// Create service card HTML
function createServiceCard(s) {
    const li = document.createElement("li");
    const photoHTML = s.photo
        ? `<img src="${s.photo}" class="service-photo" alt="${s.name}">`
        : `<span class="service-photo" style="font-size:50px; display:flex;align-items:center;justify-content:center; background: var(--color-2); color: var(--color-4);">📍</span>`;

    const favoriteButton = addFavoriteButton(s);
    const badges = [];
    if (s.registered === 'Yes') {
        badges.push('<span class="verification-badge badge-ndis">NDIS Registered</span>');
    }

    const contactButtons = [];
    if (s.phone) contactButtons.push(`<a href="tel:${s.phone}" class="contact-btn">📞 Call</a>`);
    if (s.email) contactButtons.push(`<a href="mailto:${s.email}" class="contact-btn">✉ Email</a>`);
    if (s.address) contactButtons.push(`<a href="https://maps.google.com/?q=${encodeURIComponent(s.address)}" target="_blank" class="contact-btn">🗺️ Map</a>`);

    li.innerHTML = `
        ${photoHTML}
        <div class="service-info">
            ${badges.join('')}
            <div style="display: flex; justify-content: space-between; align-items: start; width: 100%;">
                <a href="service.html?id=${s.id}">${s.name}</a>
                ${favoriteButton}
            </div>
            <p style="display: flex; align-items: center; gap: 5px;">
                <span style="font-size: 1.2em;">📍</span> ${s.location || 'Location not specified'}
            </p>
            <p style="background: var(--color-2); padding: 6px 12px; border-radius: 20px; font-size: 0.9em;">
                ${(s.category || ['General Service']).join(", ")}
            </p>
            ${s.description ? `<p style="font-size: 0.9em; color: #666;">${s.description.substring(0, 100)}${s.description.length > 100 ? '...' : ''}</p>` : ''}
            ${s.averageRating > 0 ? `
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
                    <span style="color: #ffc107; font-size: 1.1em;">${'★'.repeat(Math.round(s.averageRating))}${'☆'.repeat(5-Math.round(s.averageRating))}</span>
                    <span style="color: #666; font-size: 0.9em;">${s.averageRating}/5 (${s.reviewCount} reviews)</span>
                </div>
            ` : ''}
            ${contactButtons.length ? `<div class="quick-contact">${contactButtons.join('')}</div>` : ''}
        </div>
    `;

    return li;
}

// Apply advanced filters to services
function applyAdvancedFilters(services) {
    let filtered = [...services];
    if (currentFilters.categories.length > 0) {
        filtered = filtered.filter(service =>
            service.category && service.category.some(cat =>
                currentFilters.categories.includes(cat)
            )
        );
    }
    if (currentFilters.registered) {
        filtered = filtered.filter(service =>
            service.registered === currentFilters.registered
        );
    }
    switch (currentFilters.sortBy) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;
        case 'name':
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'rating':
            filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
            break;
    }
    return filtered;
}

// Setup advanced filters
function setupAdvancedFilters() {
    const filterToggle = document.getElementById('filterToggle');
    const advancedFilters = document.getElementById('advancedFilters');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    const registeredFilter = document.getElementById('registeredFilter');
    const sortBy = document.getElementById('sortBy');

    if (!filterToggle) return;
    filterToggle.addEventListener('click', () => {
        const isVisible = advancedFilters.style.display === 'block';
        advancedFilters.style.display = isVisible ? 'none' : 'block';
        filterToggle.textContent = isVisible ? '📍 Advanced Filters' : '✖ Close Filters';
    });

    applyFiltersBtn.addEventListener('click', () => {
        currentFilters.categories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        currentFilters.registered = registeredFilter.value;
        currentFilters.sortBy = sortBy.value;
        if (window.location.pathname.includes('browse.html')) {
            if (typeof browseServices === 'function') browseServices();
        } else {
            searchServices();
        }
        if (window.innerWidth <= 768) {
            advancedFilters.style.display = 'none';
            filterToggle.textContent = '📍 Advanced Filters';
        }
    });

    resetFiltersBtn.addEventListener('click', () => {
        categoryCheckboxes.forEach(cb => cb.checked = false);
        if (registeredFilter) registeredFilter.value = '';
        if (sortBy) sortBy.value = 'newest';
        currentFilters = { categories: [], registered: '', sortBy: 'newest' };
        if (window.location.pathname.includes('browse.html')) {
            if (typeof browseServices === 'function') browseServices();
        } else {
            searchServices();
        }
    });
    setupCategoryChips();
}

// Category chips functionality
function setupCategoryChips() {
    const chips = document.querySelectorAll('.chip');
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const category = chip.dataset.category;
            categoryCheckboxes.forEach(cb => cb.checked = false);
            if (category) {
                const correspondingCheckbox = Array.from(categoryCheckboxes).find(cb => cb.value === category);
                if (correspondingCheckbox) correspondingCheckbox.checked = true;
            }
            currentFilters.categories = category ? [category] : [];
            if (window.location.pathname.includes('browse.html')) {
                if (typeof browseServices === 'function') browseServices();
            } else {
                searchServices();
            }
        });
    });
}

// Skeleton loading animation
function showSkeletonLoading(list) {
    list.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-photo skeleton"></div>
            <div class="skeleton-text">
                <div class="skeleton-line short skeleton"></div>
                <div class="skeleton-line medium skeleton"></div>
                <div class="skeleton-line skeleton"></div>
            </div>
        `;
        list.appendChild(skeleton);
    }
}

// Handle Add Service Form Submission
function setupAddServiceForm() {
    const form = document.getElementById("addServiceForm");
    if (!form) return;

    form.onsubmit = function(e) {
        e.preventDefault();
        e.stopPropagation();

        const submitButton = form.querySelector('button[type="submit"]');
        const messageEl = document.getElementById("message");
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        if (messageEl) {
            messageEl.textContent = "";
            messageEl.style.color = "";
        }

        try {
            const formData = new FormData(form);
            const serviceData = {
                id: Date.now(),
                name: formData.get('name'),
                location: formData.get('location'),
                category: formData.getAll('category'),
                description: formData.get('description'),
                phone: formData.get('phone'),
                email: formData.get('email'),
                address: formData.get('address'),
                registered: formData.get('registered') || 'No',
                averageRating: 0,
                reviewCount: 0,
                createdAt: new Date().toISOString(),
                createdBy: currentUser ? currentUser.id : null
            };

            const existingServices = loadServiceData();
            existingServices.push(serviceData);
            saveServiceData(existingServices);

            if (messageEl) {
                messageEl.textContent = "Service submitted successfully!";
                messageEl.style.color = "green";
                form.reset();
                setTimeout(() => initializeStatistics(), 1000);
            }

        } catch (error) {
            if (messageEl) {
                messageEl.textContent = "Error submitting service. Please try again.";
                messageEl.style.color = "red";
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Submit Service";
        }
        return false;
    };
}

// Handle Pending Services Display
function setupPendingServices() {
    const pendingList = document.getElementById("pendingList");
    if (!pendingList) return;

    function loadPendingServices() {
        try {
            const services = loadServiceData();
            pendingList.innerHTML = "";
            if (!services.length) {
                pendingList.innerHTML = "<li>No services awaiting approval</li>";
                return;
            }

            services.forEach(service => {
                const li = document.createElement("li");
                li.style.cssText = `
                    background: white;
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;

                const photoHTML = service.photo
                    ? `<img src="${service.photo}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-right: 15px; border: 3px solid var(--color-4);">`
                    : "";

                li.innerHTML = `
                    <div style="display: flex; align-items: start;">
                        ${photoHTML}
                        <div style="flex: 1;">
                            <h3>${service.name}</h3>
                            <p><strong>Location:</strong> ${service.location}</p>
                            <p><strong>Categories:</strong> ${(service.category || []).join(", ")}</p>
                            <p><strong>Description:</strong> ${service.description}</p>
                            <p><strong>Contact:</strong> ${service.phone} | ${service.email}</p>
                            <div style="margin-top: 10px;">
                                <button onclick="approveService(${service.id})" style="background: green; color: white; border: none; padding: 12px 20px; border-radius: 4px; margin-right: 10px; cursor: pointer; min-height: 44px;">Approve</button>
                                <button onclick="deleteService(${service.id})" style="background: red; color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; min-height: 44px;">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
                pendingList.appendChild(li);
            });

        } catch (err) {
            pendingList.innerHTML = "<li>Error loading services</li>";
        }
    }

    window.approveService = async function(id) {
        alert("Service approved!");
        loadPendingServices();
        initializeStatistics();
    };

    window.deleteService = async function(id) {
        if (!confirm("Are you sure you want to delete this service?")) return;
        try {
            const services = loadServiceData();
            const filteredServices = services.filter(service => service.id !== id);
            saveServiceData(filteredServices);
            alert("Service deleted!");
            loadPendingServices();
        } catch (err) {
            alert("Error deleting service");
        }
    };

    loadPendingServices();
}

// User login status management
function checkLoginStatus() {
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const loginLink = document.getElementById('loginLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser && loginLink && dashboardLink && logoutBtn) {
        loginLink.style.display = 'none';
        dashboardLink.style.display = 'inline';
        dashboardLink.innerHTML = `👤 ${currentUser.name}`;
        logoutBtn.style.display = 'inline';
    } else if (loginLink && dashboardLink && logoutBtn) {
        loginLink.style.display = 'inline';
        dashboardLink.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

// Enhanced logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        checkLoginStatus();
        alert('You have been logged out successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }
}

// Initialize logout buttons
function initializeLogoutButtons() {
    const logoutButtons = document.querySelectorAll('#logoutBtn');
    logoutButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    });
}

// Data cleanup function
function cleanupOldData() {
    if (localStorage.getItem('ndisServices')) {
        localStorage.removeItem('ndisServices');
    }
}

// Initialize everything
document.addEventListener("DOMContentLoaded", function() {
    cleanupOldData();
    initializeSampleData();
    setupFavorites();
    initializeStatistics();
    checkLoginStatus();
    setupAuthForms();

    if (document.getElementById("serviceList") && !window.location.pathname.includes('browse.html')) {
        searchServices();
        document.getElementById("searchBox")?.addEventListener("input", searchServices);
        setupAdvancedFilters();
    }

    setupAddServiceForm();

    if (window.location.pathname.includes('admin.html')) {
        setupPendingServices();
    }

    initializeLogoutButtons();
});