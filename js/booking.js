// Booking functionality
document.addEventListener('DOMContentLoaded', function () {
    setupBookingForm();
});

function setupBookingForm() {
    const bookingForm = document.getElementById('bookingForm');

    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleBookingSubmit();
        });

        // Update time options based on selected date
        document.getElementById('date').addEventListener('change', updateAvailableTimes);
    }
}

function handleBookingSubmit() {
    // Get form values
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const haircutId = document.getElementById('haircutType').value;
    const notes = document.getElementById('notes').value.trim();

    // Validate form
    if (!date || !time || !name || !phone || !haircutId) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }

    // Check if time slot is available
    if (!isTimeSlotAvailable(date, time)) {
        alert('Lo siento, esta hora ya está reservada. Por favor, selecciona otra hora.');
        return;
    }

    // Format date to app standard: "3 de Enero de 2026"
    const dateObj = new Date(date + 'T00:00:00');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    // Get haircut details for pricing and naming
    const haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    const haircut = haircuts.find(h => h.id == haircutId) || { name: 'Servicio', price: 0 };

    // Create appointment object (Unified Schema)
    const appointment = {
        id: generateId().toString(),
        fecha: formattedDate,
        hora: time,
        nombre: name,
        whatsapp: phone,
        corte: haircut.name,
        price: parseFloat(haircut.price) || 0,
        status: 'pendiente',
        paymentStatus: 'pendiente',
        paymentMethod: 'none',
        notes: notes,
        createdAt: new Date().toISOString()
    };

    // Save appointment
    saveAppointment(appointment);

    // Show success message
    alert('¡Reserva realizada con éxito!');

    // Reset form and close modal
    document.getElementById('bookingForm').reset();
    document.getElementById('bookingModal').style.display = 'none';

    // Update calendar and appointments list
    loadAppointments();
    updateCalendarDays();
}

function generateId() {
    return Date.now() + Math.floor(Math.random() * 10000);
}

function saveAppointment(appointment) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    reservations.push(appointment);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    
    // Save to Firebase if available
    if (window.FirebaseDataSync) {
        const firebaseSync = new FirebaseDataSync();
        firebaseSync.addReservation(appointment);
    } else {
        // Fallback notification
        localStorage.setItem('lastUpdate', Date.now().toString());
    }
    
    // Refresh dashboard if available
    if (typeof refreshDashboard === 'function') {
        refreshDashboard();
    }
}

function updateAvailableTimes() {
    const date = document.getElementById('date').value;
    if (!date) return;

    // Format selected date to match reservations storage
    const dateObj = new Date(date + 'T00:00:00');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    const timeSelect = document.getElementById('time');
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

    const bookedTimes = reservations
        .filter(res => res.fecha === formattedDate)
        .map(res => res.hora);

    // Reset options
    const allOptions = Array.from(timeSelect.options).slice(1); // Skip the first "Selecciona una hora" option

    // Clear current options except the first one
    timeSelect.innerHTML = '<option value="">Selecciona una hora</option>';

    // Add available times
    allOptions.forEach(option => {
        if (!bookedTimes.includes(option.value)) {
            timeSelect.appendChild(option.cloneNode(true));
        }
    });

    // If all times are booked, show a message
    if (timeSelect.children.length === 1) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay horarios disponibles';
        option.disabled = true;
        timeSelect.appendChild(option);
    }
}

// Function to encrypt phone number
function encryptPhone(phone) {
    // Simple encryption: replace middle digits with asterisks
    // In a real application, you would use a proper encryption algorithm
    if (phone.length >= 6) {
        const start = phone.substring(0, 2);
        const end = phone.substring(phone.length - 2);
        const middle = '*'.repeat(phone.length - 4);
        return start + middle + end;
    }
    return phone.replace(/./g, '*');
}