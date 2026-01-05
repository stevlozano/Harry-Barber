// Firebase configuration for Harry Barber
const firebaseConfig = {
    apiKey: "AIzaSyAQq8x-bEK4zFS1c482yNXT8-rwEIL8r0g",
    authDomain: "jarry-barber.firebaseapp.com",
    databaseURL: "https://jarry-barber-default-rtdb.firebaseio.com",
    projectId: "jarry-barber",
    storageBucket: "jarry-barber.firebasestorage.app",
    messagingSenderId: "913159862387",
    appId: "1:913159862387:web:f316c450a9b0687728d206",
    measurementId: "G-N98YF4NX8C"
};

// Initialize Firebase
try {
    if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
    } else {
        console.error('Firebase SDK not loaded. Please include the Firebase scripts in your HTML.');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

const database = firebase?.database ? firebase.database() : null;

// Firebase data synchronization utility
class FirebaseDataSync {
    constructor() {
        this.dbRef = database ? database.ref('reservations') : null;
        this.storageKey = 'reservations';
        this.updateKey = 'lastUpdate';
    }

    // Initialize Firebase synchronization
    async initialize(onDataUpdate) {
        if (!database) {
            console.warn('Firebase not available, using local storage only');
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        }
        
        console.log('Initializing Firebase synchronization...');
        
        // Load initial data from localStorage
        let localData = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        
        // Listen for changes from Firebase
        this.dbRef.on('value', (snapshot) => {
            const firebaseData = snapshot.val() || [];
            const convertedData = this.convertFirebaseToApp(firebaseData);
            
            // Update localStorage with Firebase data
            localStorage.setItem(this.storageKey, JSON.stringify(convertedData));
            
            // Trigger callback if provided
            if (onDataUpdate && typeof onDataUpdate === 'function') {
                onDataUpdate();
            }
            
            console.log('Firebase data updated:', convertedData.length, 'reservations');
        });
        
        console.log('Firebase synchronization initialized');
        return localData;
    }

    // Convert Firebase format to app format
    convertFirebaseToApp(firebaseData) {
        if (!firebaseData) return [];
        
        // Firebase returns an object with keys, convert to array
        return Object.keys(firebaseData).map(key => ({
            id: key,
            ...firebaseData[key]
        }));
    }

    // Convert app format to Firebase format
    convertAppToFirebase(appData) {
        const firebaseFormat = {};
        appData.forEach(res => {
            firebaseFormat[res.id] = { ...res };
        });
        return firebaseFormat;
    }

    // Save data to Firebase
    async saveToFirebase(data) {
        if (!this.dbRef) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const firebaseData = this.convertAppToFirebase(data);
            await this.dbRef.set(firebaseData);
            console.log('Data saved to Firebase:', data.length, 'reservations');
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    }

    // Notify data change
    notifyDataChange() {
        // Data change is automatically handled by Firebase real-time sync
        console.log('Data change notification sent via Firebase');
    }

    // Get reservations from Firebase
    async getReservations() {
        if (!this.dbRef) {
            console.error('Firebase not initialized');
            return [];
        }
        
        try {
            const snapshot = await this.dbRef.once('value');
            const firebaseData = snapshot.val() || [];
            return this.convertFirebaseToApp(firebaseData);
        } catch (error) {
            console.error('Error getting reservations from Firebase:', error);
            return [];
        }
    }

    // Add a reservation to Firebase
    async addReservation(reservation) {
        if (!this.dbRef) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            await this.dbRef.child(reservation.id).set(reservation);
            console.log('Reservation added to Firebase:', reservation.id);
        } catch (error) {
            console.error('Error adding reservation to Firebase:', error);
        }
    }

    // Update a reservation in Firebase
    async updateReservation(id, reservation) {
        if (!this.dbRef) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            await this.dbRef.child(id).update(reservation);
            console.log('Reservation updated in Firebase:', id);
        } catch (error) {
            console.error('Error updating reservation in Firebase:', error);
        }
    }

    // Delete a reservation from Firebase
    async deleteReservation(id) {
        if (!this.dbRef) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            await this.dbRef.child(id).remove();
            console.log('Reservation deleted from Firebase:', id);
        } catch (error) {
            console.error('Error deleting reservation from Firebase:', error);
        }
    }
    
    // Get promotions from Firebase
    async getPromotions() {
        if (!database) {
            console.error('Firebase not initialized');
            return [];
        }
        
        try {
            const promoRef = database.ref('promotions');
            const snapshot = await promoRef.once('value');
            const firebaseData = snapshot.val() || [];
            return this.convertFirebaseToApp(firebaseData);
        } catch (error) {
            console.error('Error getting promotions from Firebase:', error);
            return [];
        }
    }
    
    // Add a promotion to Firebase
    async addPromotion(promotion) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const promoRef = database.ref('promotions');
            await promoRef.child(promotion.id).set(promotion);
            console.log('Promotion added to Firebase:', promotion.id);
        } catch (error) {
            console.error('Error adding promotion to Firebase:', error);
        }
    }
    
    // Update a promotion in Firebase
    async updatePromotion(id, promotion) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const promoRef = database.ref('promotions');
            await promoRef.child(id).update(promotion);
            console.log('Promotion updated in Firebase:', id);
        } catch (error) {
            console.error('Error updating promotion in Firebase:', error);
        }
    }
    
    // Delete a promotion from Firebase
    async deletePromotion(id) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const promoRef = database.ref('promotions');
            await promoRef.child(id).remove();
            console.log('Promotion deleted from Firebase:', id);
        } catch (error) {
            console.error('Error deleting promotion from Firebase:', error);
        }
    }
    
    // Get haircut types from Firebase
    async getHaircutTypes() {
        if (!database) {
            console.error('Firebase not initialized');
            return [];
        }
        
        try {
            const haircutRef = database.ref('haircutTypes');
            const snapshot = await haircutRef.once('value');
            const firebaseData = snapshot.val() || [];
            return this.convertFirebaseToApp(firebaseData);
        } catch (error) {
            console.error('Error getting haircut types from Firebase:', error);
            return [];
        }
    }
    
    // Add a haircut type to Firebase
    async addHaircutType(haircut) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const haircutRef = database.ref('haircutTypes');
            await haircutRef.child(haircut.id).set(haircut);
            console.log('Haircut type added to Firebase:', haircut.id);
        } catch (error) {
            console.error('Error adding haircut type to Firebase:', error);
        }
    }
    
    // Update a haircut type in Firebase
    async updateHaircutType(id, haircut) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const haircutRef = database.ref('haircutTypes');
            await haircutRef.child(id).update(haircut);
            console.log('Haircut type updated in Firebase:', id);
        } catch (error) {
            console.error('Error updating haircut type in Firebase:', error);
        }
    }
    
    // Delete a haircut type from Firebase
    async deleteHaircutType(id) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const haircutRef = database.ref('haircutTypes');
            await haircutRef.child(id).remove();
            console.log('Haircut type deleted from Firebase:', id);
        } catch (error) {
            console.error('Error deleting haircut type from Firebase:', error);
        }
    }
    
    // Update profile in Firebase
    async updateProfile(profile) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const profileRef = database.ref('adminProfile');
            await profileRef.set(profile);
            console.log('Profile updated in Firebase');
        } catch (error) {
            console.error('Error updating profile in Firebase:', error);
        }
    }
    
    // Update PIN in Firebase
    async updatePin(pin) {
        if (!database) {
            console.error('Firebase not initialized');
            return;
        }
        
        try {
            const pinRef = database.ref('barberPin');
            await pinRef.set(pin);
            console.log('PIN updated in Firebase');
        } catch (error) {
            console.error('Error updating PIN in Firebase:', error);
        }
    }
    
    // Get profile from Firebase
    async getProfile() {
        if (!database) {
            console.error('Firebase not initialized');
            return {"name": "Harry Barber", "photo": ""};
        }
        
        try {
            const profileRef = database.ref('adminProfile');
            const snapshot = await profileRef.once('value');
            return snapshot.val() || {"name": "Harry Barber", "photo": ""};
        } catch (error) {
            console.error('Error getting profile from Firebase:', error);
            return {"name": "Harry Barber", "photo": ""};
        }
    }
    
    // Get PIN from Firebase
    async getPin() {
        if (!database) {
            console.error('Firebase not initialized');
            return null;
        }
        
        try {
            const pinRef = database.ref('barberPin');
            const snapshot = await pinRef.once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting PIN from Firebase:', error);
            return null;
        }
    }
}

// Export for use in other files
window.FirebaseDataSync = FirebaseDataSync;