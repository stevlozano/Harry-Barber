/*
FRONTEND CACHE MANAGEMENT SYSTEM
Independent cache handling for browser storage
*/

class CacheManager {
    constructor() {
        this.version = '1.0.10';
        this.cachePrefix = 'harry-barber';
        this.storageKeys = {
            SERVICES: 'services-cache',
            APPOINTMENTS: 'appointments-cache',
            SETTINGS: 'settings-cache',
            USER_DATA: 'user-data-cache'
        };
    }
    
    // Generate cache key with version
    getCacheKey(baseKey) {
        return `${this.cachePrefix}-${baseKey}-${this.version}`;
    }
    
    // Store data with expiration
    async store(key, data, ttlMinutes = 60) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                expires: Date.now() + (ttlMinutes * 60 * 1000),
                version: this.version
            };
            
            localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheData));
            console.log(`[Cache] Stored ${key} successfully`);
            return true;
        } catch (error) {
            console.error(`[Cache] Failed to store ${key}:`, error);
            return false;
        }
    }
    
    // Retrieve data with validation
    async retrieve(key, bypassValidation = false) {
        try {
            const cachedData = localStorage.getItem(this.getCacheKey(key));
            
            if (!cachedData) {
                return null;
            }
            
            const parsedData = JSON.parse(cachedData);
            
            // Validate cache data
            if (!bypassValidation) {
                // Check version compatibility
                if (parsedData.version !== this.version) {
                    console.log(`[Cache] Version mismatch for ${key}, clearing cache`);
                    this.remove(key);
                    return null;
                }
                
                // Check expiration
                if (parsedData.expires < Date.now()) {
                    console.log(`[Cache] Expired data for ${key}, clearing cache`);
                    this.remove(key);
                    return null;
                }
            }
            
            console.log(`[Cache] Retrieved ${key} successfully`);
            return parsedData.data;
        } catch (error) {
            console.error(`[Cache] Failed to retrieve ${key}:`, error);
            return null;
        }
    }
    
    // Remove specific cache entry
    remove(key) {
        try {
            localStorage.removeItem(this.getCacheKey(key));
            console.log(`[Cache] Removed ${key} successfully`);
            return true;
        } catch (error) {
            console.error(`[Cache] Failed to remove ${key}:`, error);
            return false;
        }
    }
    
    // Clear all cache entries for this version
    clearAll() {
        try {
            const keysToRemove = [];
            const prefix = `${this.cachePrefix}-`;
            
            // Find all cache entries for current version
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix) && key.endsWith(`-${this.version}`)) {
                    keysToRemove.push(key);
                }
            }
            
            // Remove all matching entries
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log(`[Cache] Cleared ${keysToRemove.length} cache entries`);
            return keysToRemove.length;
        } catch (error) {
            console.error('[Cache] Failed to clear cache:', error);
            return 0;
        }
    }
    
    // Get cache statistics
    getStats() {
        try {
            const stats = {
                totalEntries: 0,
                totalSize: 0,
                versionEntries: 0,
                expiredEntries: 0
            };
            
            const prefix = `${this.cachePrefix}-`;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    stats.totalEntries++;
                    
                    const item = localStorage.getItem(key);
                    stats.totalSize += item.length;
                    
                    if (key.endsWith(`-${this.version}`)) {
                        stats.versionEntries++;
                        
                        try {
                            const parsed = JSON.parse(item);
                            if (parsed.expires < Date.now()) {
                                stats.expiredEntries++;
                            }
                        } catch (e) {
                            // Invalid JSON, count as expired
                            stats.expiredEntries++;
                        }
                    }
                }
            }
            
            return stats;
        } catch (error) {
            console.error('[Cache] Failed to get stats:', error);
            return null;
        }
    }
    
    // Smart prefetch for critical data
    async prefetchCriticalData() {
        const criticalEndpoints = [
            '/api/services',
            '/api/settings',
            '/data/appointments.json'
        ];
        
        const promises = criticalEndpoints.map(async (endpoint) => {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    const data = await response.json();
                    const key = endpoint.replace('/api/', '').replace('/', '-');
                    await this.store(key, data, 30); // 30 minutes TTL
                }
            } catch (error) {
                console.log(`[Cache] Failed to prefetch ${endpoint}:`, error);
            }
        });
        
        await Promise.all(promises);
        console.log('[Cache] Critical data prefetched');
    }
    
    // Background cache maintenance
    startMaintenance() {
        // Clean expired entries every 30 minutes
        setInterval(() => {
            this.cleanExpiredEntries();
        }, 30 * 60 * 1000);
        
        // Check for updates every hour
        setInterval(() => {
            this.checkVersionUpdates();
        }, 60 * 60 * 1000);
    }
    
    // Clean expired cache entries
    cleanExpiredEntries() {
        try {
            const cleaned = [];
            const prefix = `${this.cachePrefix}-`;
            
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const item = localStorage.getItem(key);
                        const parsed = JSON.parse(item);
                        
                        if (parsed.expires < Date.now()) {
                            localStorage.removeItem(key);
                            cleaned.push(key);
                        }
                    } catch (e) {
                        // Remove invalid entries
                        localStorage.removeItem(key);
                        cleaned.push(key);
                    }
                }
            }
            
            if (cleaned.length > 0) {
                console.log(`[Cache] Cleaned ${cleaned.length} expired entries`);
            }
        } catch (error) {
            console.error('[Cache] Maintenance failed:', error);
        }
    }
    
    // Check for version updates and clear incompatible cache
    async checkVersionUpdates() {
        try {
            const response = await fetch('/api/version');
            const data = await response.json();
            
            if (data.version && data.version !== this.version) {
                console.log(`[Cache] New version detected: ${data.version}`);
                // Clear all cache for old version
                this.clearAll();
                // Update version
                this.version = data.version;
            }
        } catch (error) {
            console.log('[Cache] Could not check version updates');
        }
    }
    
    // Export cache data for debugging
    exportCache() {
        try {
            const exportData = {};
            const prefix = `${this.cachePrefix}-`;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    exportData[key] = localStorage.getItem(key);
                }
            }
            
            return exportData;
        } catch (error) {
            console.error('[Cache] Failed to export cache:', error);
            return null;
        }
    }
    
    // Import cache data
    importCache(data) {
        try {
            Object.entries(data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            console.log('[Cache] Cache imported successfully');
            return true;
        } catch (error) {
            console.error('[Cache] Failed to import cache:', error);
            return false;
        }
    }
}

// Initialize cache manager
const cacheManager = new CacheManager();

// Auto-start maintenance
document.addEventListener('DOMContentLoaded', () => {
    cacheManager.startMaintenance();
    
    // Prefetch critical data after page load
    setTimeout(() => {
        cacheManager.prefetchCriticalData();
    }, 2000);
});

// Export for global use
window.CacheManager = CacheManager;
window.cacheManager = cacheManager;