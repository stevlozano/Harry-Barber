/*
UPDATE CONFIGURATION SYSTEM
Handles version-independent updates and cache management
*/

const UpdateConfig = {
    // Current version
    VERSION: '1.0.10',
    
    // Cache configuration
    CACHE: {
        VERSION: 'v1.0.10',
        STRATEGY: 'fresh-start', // 'fresh-start' or 'incremental'
        MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        CLEAN_INTERVAL: 30 * 60 * 1000 // 30 minutes
    },
    
    // Update settings
    UPDATE: {
        CHECK_INTERVAL: 60 * 60 * 1000, // 1 hour
        AUTO_UPDATE: true,
        NOTIFY_USER: true,
        BACKGROUND_SYNC: true
    },
    
    // Assets that should always be fresh
    FRESH_ASSETS: [
        '/api/',
        '/data/',
        '/images/'
    ],
    
    // Assets that can be cached longer
    STATIC_ASSETS: [
        '/css/',
        '/js/',
        '/fonts/',
        '/manifest.json'
    ],
    
    // Methods
    getCurrentVersion() {
        return this.VERSION;
    },
    
    shouldForceRefresh(assetPath) {
        return this.FRESH_ASSETS.some(prefix => assetPath.startsWith(prefix));
    },
    
    canCacheLong(assetPath) {
        return this.STATIC_ASSETS.some(prefix => assetPath.startsWith(prefix));
    },
    
    getVersionedCacheName() {
        return `harry-barber-${this.CACHE.VERSION}`;
    },
    
    getCacheTTL(assetPath) {
        if (this.shouldForceRefresh(assetPath)) {
            return 5 * 60 * 1000; // 5 minutes
        } else if (this.canCacheLong(assetPath)) {
            return 7 * 24 * 60 * 60 * 1000; // 7 days
        } else {
            return this.CACHE.MAX_AGE; // 24 hours
        }
    }
};

// Update checker class
class UpdateChecker {
    constructor(config = UpdateConfig) {
        this.config = config;
        this.lastCheck = 0;
        this.currentVersion = config.VERSION;
        this.updateAvailable = false;
        this.newVersion = null;
    }
    
    async checkForUpdates() {
        const now = Date.now();
        
        // Don't check too frequently
        if (now - this.lastCheck < this.config.UPDATE.CHECK_INTERVAL) {
            return false;
        }
        
        try {
            const response = await fetch('/api/version', {
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch version');
            }
            
            const data = await response.json();
            this.lastCheck = now;
            
            if (data.version && data.version !== this.currentVersion) {
                this.updateAvailable = true;
                this.newVersion = data.version;
                
                console.log(`[Update] New version available: ${data.version}`);
                
                if (this.config.UPDATE.NOTIFY_USER) {
                    this.notifyUser();
                }
                
                if (this.config.UPDATE.AUTO_UPDATE) {
                    this.triggerUpdate();
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[Update] Check failed:', error);
            return false;
        }
    }
    
    notifyUser() {
        // Show update notification
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration && registration.waiting) {
                    // Show update toast/notification
                    this.showUpdateNotification();
                }
            });
        }
    }
    
    showUpdateNotification() {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <p>Nueva versión disponible: ${this.newVersion}</p>
                <button onclick="updateChecker.applyUpdate()">Actualizar ahora</button>
                <button onclick="this.parentElement.parentElement.remove()">Más tarde</button>
            </div>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#000',
            color: '#fff',
            padding: '15px',
            borderRadius: '10px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        });
        
        document.body.appendChild(notification);
    }
    
    triggerUpdate() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    // Force refresh if no service worker
                    window.location.reload(true);
                }
            });
        }
    }
    
    applyUpdate() {
        this.triggerUpdate();
    }
    
    startAutoCheck() {
        if (this.config.UPDATE.AUTO_UPDATE) {
            setInterval(() => {
                this.checkForUpdates();
            }, this.config.UPDATE.CHECK_INTERVAL);
        }
    }
}

// Cache cleaner class
class CacheCleaner {
    constructor(config = UpdateConfig) {
        this.config = config;
        this.cleanInterval = null;
    }
    
    startCleaning() {
        this.cleanInterval = setInterval(() => {
            this.cleanExpiredCache();
        }, this.config.CACHE.CLEAN_INTERVAL);
    }
    
    stopCleaning() {
        if (this.cleanInterval) {
            clearInterval(this.cleanInterval);
            this.cleanInterval = null;
        }
    }
    
    async cleanExpiredCache() {
        try {
            const cacheNames = await caches.keys();
            const currentTime = Date.now();
            
            for (const cacheName of cacheNames) {
                if (cacheName.startsWith('harry-barber-')) {
                    const cache = await caches.open(cacheName);
                    const requests = await cache.keys();
                    
                    for (const request of requests) {
                        const response = await cache.match(request);
                        if (response) {
                            const cacheControl = response.headers.get('cache-control');
                            const maxAge = this.getMaxAgeFromHeaders(cacheControl);
                            
                            if (maxAge && (currentTime - new Date(response.headers.get('date')).getTime()) > maxAge) {
                                await cache.delete(request);
                                console.log(`[Cache] Removed expired entry: ${request.url}`);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Cache] Cleaning failed:', error);
        }
    }
    
    getMaxAgeFromHeaders(cacheControl) {
        if (cacheControl) {
            const match = cacheControl.match(/max-age=(\d+)/);
            if (match) {
                return parseInt(match[1]) * 1000; // Convert to milliseconds
            }
        }
        return null;
    }
    
    async clearAllVersions() {
        try {
            const cacheNames = await caches.keys();
            const deleted = [];
            
            for (const cacheName of cacheNames) {
                if (cacheName.startsWith('harry-barber-')) {
                    await caches.delete(cacheName);
                    deleted.push(cacheName);
                }
            }
            
            console.log(`[Cache] Cleared ${deleted.length} version caches`);
            return deleted;
        } catch (error) {
            console.error('[Cache] Clear all failed:', error);
            return [];
        }
    }
}

// Initialize systems
const updateChecker = new UpdateChecker();
const cacheCleaner = new CacheCleaner();

// Start automatic systems
document.addEventListener('DOMContentLoaded', () => {
    // Start update checking
    updateChecker.startAutoCheck();
    
    // Start cache cleaning
    cacheCleaner.startCleaning();
    
    // Check for updates on page load (delayed)
    setTimeout(() => {
        updateChecker.checkForUpdates();
    }, 5000);
});

// Export for global access
window.UpdateConfig = UpdateConfig;
window.UpdateChecker = UpdateChecker;
window.CacheCleaner = CacheCleaner;
window.updateChecker = updateChecker;
window.cacheCleaner = cacheCleaner;