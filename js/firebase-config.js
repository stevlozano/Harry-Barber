// Firebase configuration for Harry Barber
const firebaseConfig = {
    apiKey: "AIzaSyAqR2h5jG1KJ5tVJ9fQg3P7z6B8vX2Q0cE", // Replace with your actual API key
    authDomain: "jarry-barber.firebaseapp.com",
    databaseURL: "https://jarry-barber-default-rtdb.firebaseio.com/",
    projectId: "jarry-barber",
    storageBucket: "jarry-barber.appspot.com",
    messagingSenderId: "123456789", // Replace with your sender ID
    appId: "1:123456789:web:abc123" // Replace with your app ID
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} else {
    console.error('Firebase SDK not loaded. Please include the Firebase scripts in your HTML.');
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
}

// Export for use in other files
window.FirebaseDataSync = FirebaseDataSync;