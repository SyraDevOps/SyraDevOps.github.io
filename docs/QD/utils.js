/**
 * Shared utilities for Querido Diário Web App
 * Centralizes common functions to avoid code duplication
 */

// ============================================
// USERNAME NORMALIZATION
// ============================================

/**
 * Normalizes username by trimming and removing @ prefix
 * @param {string} value - Username to normalize
 * @returns {string} Normalized username
 */
export function normalizeUsername(value) {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.startsWith('@') ? trimmed.slice(1).trim() : trimmed;
}

// ============================================
// STORAGE ADAPTER (with quota handling)
// ============================================

export class StorageAdapter {
    /**
     * Set item in localStorage with quota exceeded fallback
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    static set(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, attempting cleanup...');
                this._cleanup();
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e2) {
                    console.error('Storage failed even after cleanup:', e2);
                    return false;
                }
            }
            console.error('Storage error:', e);
            return false;
        }
    }

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key not found
     * @returns {any} Parsed value or default
     */
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage read error:', e);
            return defaultValue;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    }

    /**
     * Clear old/unused data to free up space
     * @private
     */
    static _cleanup() {
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        try {
            // Remove old temporary data
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('temp_')) {
                    const item = localStorage.getItem(key);
                    try {
                        const data = JSON.parse(item);
                        if (data.timestamp && now - data.timestamp > maxAge) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        // Invalid JSON, remove it
                        localStorage.removeItem(key);
                    }
                }
            }
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    }
}

// ============================================
// ERROR HANDLER / TOAST UI
// ============================================

export class ErrorHandler {
    static toastContainer = null;

    /**
     * Initialize toast container
     */
    static init() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toast-container';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms (0 = permanent until dismissed)
     */
    static show(message, type = 'info', duration = 5000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconSvg = this._getIcon(type);
        const iconWrapper = document.createElement('span');
        iconWrapper.className = 'toast-icon';
        iconWrapper.innerHTML = iconSvg;
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        `;
        
        toast.appendChild(iconWrapper);
        toast.appendChild(messageSpan);
        toast.appendChild(closeBtn);
        
        this.toastContainer.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Close button
        closeBtn.addEventListener('click', () => this._removeToast(toast));

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this._removeToast(toast), duration);
        }

        return toast;
    }

    /**
     * Show success toast
     */
    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    /**
     * Show error toast
     */
    static error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    /**
     * Show warning toast
     */
    static warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * Show info toast
     */
    static info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }

    /**
     * Show loading toast (stays until dismissed)
     */
    static loading(message) {
        return this.show(message, 'info', 0);
    }

    /**
     * Remove toast
     * @private
     */
    static _removeToast(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Get SVG icon for toast type
     * @private
     */
    static _getIcon(type) {
        const icons = {
            success: `
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `,
            error: `
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `,
            warning: `
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 20h20L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
                    <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `,
            info: `
                <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                    <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `
        };
        return icons[type] || icons.info;
    }
}

// ============================================
// BOUNDED CACHE (prevents memory leaks)
// ============================================

export class BoundedCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    /**
     * Set cache item
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    set(key, value) {
        // If at capacity, remove oldest item (first in Map)
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    /**
     * Get cache item
     * @param {string} key - Cache key
     * @returns {any} Cached value or undefined
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Check if key exists
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache size
     * @returns {number} Number of cached items
     */
    get size() {
        return this.cache.size;
    }
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in ms (doubles each retry)
 * @returns {Promise<any>} Result of function
 */
export async function retryAsync(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// ============================================
// DEBOUNCE (prevent excessive calls)
// ============================================

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ============================================
// IMAGE OPTIMIZATION
// ============================================

/**
 * Optimize image by resizing and compressing
 * @param {string} dataUrl - Image data URL
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Optimized data URL
 */
export async function optimizeImage(dataUrl, maxWidth = 800, maxHeight = 800, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            let { width, height } = img;
            
            // Calculate new dimensions maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }
            
            // Create canvas and resize
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Export optimized image
            const optimized = canvas.toDataURL('image/jpeg', quality);
            resolve(optimized);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = dataUrl;
    });
}
