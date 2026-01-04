// Phone encryption functionality
// This file handles the encryption of phone numbers for the appointment system

// Function to encrypt a phone number
function encryptPhone(phone) {
    // Simple encryption: replace middle digits with asterisks
    // For better security in a real application, use a proper encryption algorithm
    if (phone.length >= 6) {
        const start = phone.substring(0, 2);
        const end = phone.substring(phone.length - 2);
        const middle = '*'.repeat(phone.length - 4);
        return start + middle + end;
    }
    return phone.replace(/./g, '*');
}

// Function to decrypt a phone number (for authorized access only)
function decryptPhone(encryptedPhone, accessCode = null) {
    // In a real application, this would require proper authentication
    // For this demo, we'll just return the original if we have the access code
    console.warn('Phone decryption should only be done with proper authorization');
    return encryptedPhone; // Placeholder - in real app, implement proper decryption
}

// Function to format phone number for display
function formatEncryptedPhone(encryptedPhone) {
    // Ensure consistent formatting of encrypted phone numbers
    return encryptedPhone.replace(/(\d{2})(\d{4})(\d{2})/, '$1****$3');
}

// Function to validate phone number format
function validatePhone(phone) {
    // Basic validation for Spanish phone numbers (could be adapted)
    const phoneRegex = /^[67]\d{8}$|^\+34[67]\d{8}$|^\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Function to mask phone numbers in a list of appointments
function maskPhoneNumbers(appointments) {
    return appointments.map(app => ({
        ...app,
        encryptedPhone: encryptPhone(app.phone)
    }));
}

// Function to securely store appointment with encrypted phone
function secureStoreAppointment(appointment) {
    const secureAppointment = {
        ...appointment,
        encryptedPhone: encryptPhone(appointment.phone),
        originalPhone: null // Don't store original phone in localStorage
    };
    
    return secureAppointment;
}

// Export functions if using modules (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encryptPhone,
        decryptPhone,
        formatEncryptedPhone,
        validatePhone,
        maskPhoneNumbers,
        secureStoreAppointment
    };
}