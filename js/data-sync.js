// Data synchronization utility for Harry Barber app

class DataSync {
    constructor() {
        this.dataUrl = '/data/appointments.json';
        this.storageKey = 'reservations';
        this.updateKey = 'lastUpdate';
        this.syncInterval = 30000; // 30 seconds
        this.isSyncing = false;
    }

    // Load data from JSON file
    async loadDataFromServer() {
        try {
            const response = await fetch(this.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return this.convertServerData(data);
        } catch (error) {
            console.warn('Failed to load data from server:', error);
            return null;
        }
    }

    // Convert server JSON format to app format
    convertServerData(serverData) {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        function formatDate(dateStr) {
            const date = new Date(dateStr + 'T00:00:00');
            return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
        }

        function getHaircutInfo(id) {
            const haircut = serverData.haircutTypes.find(h => h.id == id);
            return {
                name: haircut ? haircut.name : 'Servicio',
                price: haircut ? haircut.price : 0
            };
        }

        return serverData.appointments.map(app => {
            const haircutInfo = getHaircutInfo(app.haircutId);
            
            return {
                id: app.id.toString(),
                fecha: formatDate(app.date),
                hora: app.time,
                nombre: app.name,
                whatsapp: app.phone,
                corte: haircutInfo.name,
                price: haircutInfo.price,
                pago: 'pendiente',
                status: 'confirmada',
                paymentStatus: 'pendiente',
                paymentMethod: 'none',
                createdAt: app.createdAt
            };
        });
    }

    // Sync data with localStorage
    syncWithLocalStorage(serverData = null) {
        let currentData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        
        if (serverData && serverData.length > 0) {
            // Merge server data with local data (avoid duplicates)
            const mergedData = this.mergeData(serverData, currentData);
            localStorage.setItem(this.storageKey, JSON.stringify(mergedData));
            console.log('Data synced with server:', mergedData.length, 'appointments');
            return mergedData;
        }
        
        return currentData;
    }

    // Merge data avoiding duplicates
    mergeData(serverData, localData) {
        const merged = [...localData];
        const localIds = new Set(localData.map(item => item.id));
        
        // Add server data that doesn't exist locally
        serverData.forEach(serverItem => {
            if (!localIds.has(serverItem.id)) {
                merged.push(serverItem);
            }
        });
        
        return merged;
    }

    // Notify other tabs of data changes
    notifyDataChange() {
        localStorage.setItem(this.updateKey, Date.now().toString());
    }

    // Setup automatic synchronization
    setupAutoSync(callback) {
        // Listen for changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey || e.key === this.updateKey) {
                console.log('Data updated from another tab');
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        });

        // Periodic sync check
        setInterval(async () => {
            if (this.isSyncing) return;
            
            this.isSyncing = true;
            try {
                const serverData = await this.loadDataFromServer();
                if (serverData) {
                    this.syncWithLocalStorage(serverData);
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            } catch (error) {
                console.warn('Periodic sync failed:', error);
            } finally {
                this.isSyncing = false;
            }
        }, this.syncInterval);
    }

    // Initialize synchronization
    async initialize(onDataUpdate) {
        console.log('Initializing data synchronization...');
        
        // Load initial data
        const serverData = await this.loadDataFromServer();
        const currentData = this.syncWithLocalStorage(serverData);
        
        // Setup auto-sync
        this.setupAutoSync(onDataUpdate);
        
        console.log('Data synchronization initialized with', currentData.length, 'appointments');
        return currentData;
    }
}

// Export for use in other files
window.DataSync = DataSync;
