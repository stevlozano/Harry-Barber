// Additional Services System
class AdditionalServices {
    constructor() {
        this.services = [
            // Eyebrows Services
            {
                id: 'eyebrows_basic',
                category: 'cejas',
                name: 'Cejas Básicas',
                price: 5.00,
                description: 'Perfilado y arreglo básico de cejas'
            },
            {
                id: 'eyebrows_deluxe',
                category: 'cejas',
                name: 'Cejas Deluxe',
                price: 8.00,
                description: 'Perfilado, arreglo y diseño personalizado'
            },
            {
                id: 'eyebrows_tinting',
                category: 'cejas',
                name: 'Tinte de Cejas',
                price: 12.00,
                description: 'Tinte profesional para cejas'
            },
            
            // Beard Services
            {
                id: 'beard_trim',
                category: 'barba',
                name: 'Recorte de Barba',
                price: 6.00,
                description: 'Mantenimiento y recorte de barba'
            },
            {
                id: 'beard_design',
                category: 'barba',
                name: 'Diseño de Barba',
                price: 10.00,
                description: 'Diseño y modelado profesional'
            },
            {
                id: 'beard_treatment',
                category: 'barba',
                name: 'Tratamiento Facial',
                price: 15.00,
                description: 'Tratamiento completo con productos'
            },
            
            // SPA Services
            {
                id: 'face_mask_basic',
                category: 'spa',
                name: 'Mascarilla Facial Básica',
                price: 12.00,
                description: 'Limpieza profunda con mascarilla hidratante'
            },
            {
                id: 'face_mask_premium',
                category: 'spa',
                name: 'Mascarilla Facial Premium',
                price: 20.00,
                description: 'Tratamiento completo con vapor y mascarilla especializada'
            },
            {
                id: 'facial_massage',
                category: 'spa',
                name: 'Masaje Facial',
                price: 18.00,
                description: 'Masaje relajante facial con aceites esenciales'
            },
            {
                id: 'hot_towel',
                category: 'spa',
                name: 'Toalla Caliente',
                price: 3.00,
                description: 'Aplicación de toalla caliente para abrir poros'
            },
            
            // Additional Services
            {
                id: 'scalp_massage',
                category: 'adicional',
                name: 'Masaje de Cuero Cabelludo',
                price: 8.00,
                description: 'Masaje relajante del cuero cabelludo'
            },
            {
                id: 'hair_wash',
                category: 'adicional',
                name: 'Lavado Profesional',
                price: 5.00,
                description: 'Lavado con champú premium'
            }
        ];
        
        this.initializeFirebaseSync();
    }
    
    initializeFirebaseSync() {
        // Listen for additional services updates from Firebase
        if (typeof window !== 'undefined' && window.firebase) {
            try {
                const db = window.firebase.database();
                const additionalServicesRef = db.ref('additionalServices');
                
                additionalServicesRef.on('value', (snapshot) => {
                    console.log('Firebase services update received');
                    const services = snapshot.val();
                    if (services) {
                        this.services = Object.values(services);
                        console.log('Updated services count:', this.services.length);
                    } else {
                        // If no services exist in Firebase, keep the default ones
                        console.log('No services in Firebase, keeping defaults');
                    }
                    this.updateUI();
                });
                
                // Also listen for child_removed events for immediate deletion sync
                additionalServicesRef.on('child_removed', (snapshot) => {
                    console.log('Service removed from Firebase:', snapshot.key);
                    this.services = this.services.filter(s => s.id !== snapshot.key);
                    this.updateUI();
                });
                
            } catch (error) {
                console.error('Error initializing Firebase sync:', error);
            }
        } else {
            console.warn('Firebase not available, using default services');
        }
    }
    
    getServicesByCategory(category) {
        return this.services.filter(service => service.category === category);
    }
    
    getServiceById(id) {
        return this.services.find(service => service.id === id);
    }
    
    getAllCategories() {
        const categories = [...new Set(this.services.map(service => service.category))];
        return categories.map(cat => ({
            id: cat,
            name: this.getCategoryName(cat)
        }));
    }
    
    getCategoryName(categoryId) {
        const names = {
            'cejas': 'Cejas',
            'barba': 'Barba',
            'spa': 'SPA',
            'adicional': 'Adicional'
        };
        return names[categoryId] || categoryId;
    }
    
    calculateTotalPrice(basePrice, selectedServices) {
        let total = parseFloat(basePrice) || 0;
        
        selectedServices.forEach(serviceId => {
            const service = this.getServiceById(serviceId);
            if (service) {
                total += parseFloat(service.price);
            }
        });
        
        return total;
    }
    
    formatServiceDisplay(selectedServices) {
        if (!selectedServices || selectedServices.length === 0) return '';
        
        const serviceNames = selectedServices.map(id => {
            const service = this.getServiceById(id);
            return service ? service.name : id;
        });
        
        return serviceNames.join(' + ');
    }
    
    // Admin functions
    addService(serviceData) {
        const newService = {
            id: this.generateServiceId(),
            ...serviceData
        };
        
        this.services.push(newService);
        this.syncToFirebase();
        return newService;
    }
    
    updateService(serviceId, updates) {
        const serviceIndex = this.services.findIndex(s => s.id === serviceId);
        if (serviceIndex !== -1) {
            this.services[serviceIndex] = { ...this.services[serviceIndex], ...updates };
            this.syncToFirebase();
            return true;
        }
        return false;
    }
    
    deleteService(serviceId) {
        this.services = this.services.filter(s => s.id !== serviceId);
        this.syncToFirebase();
    }
    
    generateServiceId() {
        return 'service_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    syncToFirebase() {
        if (typeof window !== 'undefined' && window.firebase) {
            const db = window.firebase.database();
            const servicesObject = {};
            this.services.forEach(service => {
                servicesObject[service.id] = service;
            });
            db.ref('additionalServices').set(servicesObject);
        }
    }
    
    updateUI() {
        // Trigger UI updates when services change
        // Refresh admin panel services
        if (typeof loadAdditionalServices === 'function') {
            loadAdditionalServices();
        }
        
        // Refresh calendar form services
        const calendarContainer = document.getElementById('additionalServicesContainer');
        if (calendarContainer) {
            if (typeof window.loadAdditionalServices === 'function') {
                window.loadAdditionalServices();
            } else if (typeof loadAdditionalServices === 'function') {
                loadAdditionalServices();
            }
        }
    }
}

// Initialize additional services
const additionalServices = new AdditionalServices();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdditionalServices;
}