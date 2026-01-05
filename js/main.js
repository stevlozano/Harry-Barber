// Main application initialization
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the application
    initializeApp();

    // Set up event listeners
    setupEventListeners();
});

function initializeApp() {
    // Initialize default data if not present
    if (!localStorage.getItem('reservations')) {
        localStorage.setItem('reservations', JSON.stringify([]));
    }

    if (!localStorage.getItem('haircutTypes')) {
        localStorage.setItem('haircutTypes', JSON.stringify([
            { id: 1, name: 'Corte Clásico', price: 12.00, description: 'Corte básico con tijera y máquina' },
            { id: 2, name: 'Barba', price: 8.00, description: 'Afeitado y modelado de barba' },
            { id: 3, name: 'Corte y Barba', price: 18.00, description: 'Combo de corte y barba' }
        ]));
    }

    if (!localStorage.getItem('promotions')) {
        localStorage.setItem('promotions', JSON.stringify([
            { id: 1, name: 'Promoción Lunes', description: '20% de descuento en cortes', discount: 20 },
            { id: 2, name: 'Cliente Frecuente', description: '5ta visita gratis', discount: 100 }
        ]));
    }

    // Load initial data
    loadAppointments();
    loadHaircutTypes();
    loadPromotions();
    loadLandingPromotions();
}

function setupEventListeners() {
    // Navbar menu button
    document.getElementById('menuBtn').addEventListener('click', toggleMenu);

    // Close modal button
    document.querySelector('#closeModal').addEventListener('click', function () {
        document.getElementById('bookingModal').style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('bookingModal');

        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Modal dialog functionality
    const modalDialog = document.getElementById('modal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Toggle modal
    function toggleMenu() {
        if (modalDialog.open) {
            modalDialog.close();
        } else {
            modalDialog.showModal();
        }
    }

    // Close modal when close button is clicked
    closeModalBtn.addEventListener('click', function () {
        modalDialog.close();
    });

    // Navigation links
    document.getElementById('historialLink').addEventListener('click', function (e) {
        e.preventDefault();
        // Scroll to history section
        document.querySelector('.history-section').scrollIntoView({ behavior: 'smooth' });
        modalDialog.close();
    });

    document.getElementById('promocionesLink').addEventListener('click', function (e) {
        e.preventDefault();
        // Open barber panel to promotions tab
        document.getElementById('barberPanel').style.display = 'block';
        switchToTab('promotions');
        modalDialog.close();
    });

    document.getElementById('calendarioLink').addEventListener('click', function (e) {
        e.preventDefault();
        // Scroll to calendar section
        document.querySelector('.calendar-container').scrollIntoView({ behavior: 'smooth' });
        modalDialog.close();
    });

    // Filter event listeners
    document.getElementById('yearFilter').addEventListener('change', filterAppointments);
    document.getElementById('monthFilter').addEventListener('change', filterAppointments);
    document.getElementById('weekFilter').addEventListener('change', filterAppointments);
    document.getElementById('dayFilter').addEventListener('click', function () {
        // Set to current day
        const today = new Date();
        document.getElementById('yearFilter').value = today.getFullYear();
        document.getElementById('monthFilter').value = today.getMonth();
        filterAppointments();
    });
}

function toggleMenu() {
    // For now, just add a simple toggle effect
    const menuBtn = document.getElementById('menuBtn');
    menuBtn.classList.toggle('active');

    // Add animation or menu toggle functionality here if needed
    setTimeout(() => {
        menuBtn.classList.remove('active');
    }, 300);
}

// Function to switch to a specific tab in the barber panel
function switchToTab(tabId) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to selected tab and button
    document.getElementById(`${tabId}Tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Load data for the specific tab
    if (tabId === 'promotions') {
        loadPromotions();
    } else if (tabId === 'haircuts') {
        loadHaircutTypes();
    }

    // Show the barber panel if it's not already visible
    document.getElementById('barberPanel').style.display = 'block';
}

// Function to load appointments from localStorage
function loadAppointments() {
    const appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
    displayAppointments(appointments);
    updateCalendar();
}

// Function to load haircut types from localStorage
function loadHaircutTypes() {
    const haircutTypes = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    populateHaircutSelect(haircutTypes);
}

// Function to load promotions from localStorage
function loadPromotions() {
    const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    displayPromotions(promotions);
}

// Function to populate haircut select dropdown
function populateHaircutSelect(haircutTypes) {
    const haircutSelect = document.getElementById('haircutType');
    haircutSelect.innerHTML = '<option value="">Selecciona un tipo de corte</option>';

    haircutTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = `${type.name} - S/ ${type.price.toFixed(2)}`;
        haircutSelect.appendChild(option);
    });
}

// Function to display promotions in the barber panel
function displayPromotions(promotions) {
    const promotionsList = document.getElementById('promotionsList');
    promotionsList.innerHTML = '';

    promotions.forEach(promo => {
        const promoElement = document.createElement('div');
        promoElement.className = 'promotion-item';
        promoElement.innerHTML = `
            <h4>${promo.name}</h4>
            <p>${promo.description}</p>
            <p><strong>Descuento: ${promo.discount}%</strong></p>
        `;
        promotionsList.appendChild(promoElement);
    });
}

// Function to load promotions for the landing page
function loadLandingPromotions() {
    const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    const landingPromotions = document.getElementById('landingPromotions');

    if (!landingPromotions) return;

    landingPromotions.innerHTML = '';

    if (promotions.length === 0) {
        landingPromotions.innerHTML = '<p>No hay promociones disponibles actualmente.</p>';
        return;
    }

    // Show only the first 3 promotions
    const promotionsToShow = promotions.slice(0, 3);

    promotionsToShow.forEach(promo => {
        const promoElement = document.createElement('div');
        promoElement.className = 'promotion-item';
        promoElement.innerHTML = `
            <h4>${promo.name}</h4>
            <p>${promo.description}</p>
            <p><strong>Descuento: ${promo.discount}%</strong></p>
        `;
        landingPromotions.appendChild(promoElement);
    });
}

// Function to display appointments in the history section
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = '';

    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p>No hay reservas registradas.</p>';
        return;
    }

    // Sort appointments by date (newest first)
    appointments.sort((a, b) => new Date(b.date) - new Date(a.date));

    appointments.forEach(appointment => {
        const appointmentElement = document.createElement('div');
        appointmentElement.className = 'appointment-item';

        // Format the date for display
        const dateObj = new Date(appointment.date);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        appointmentElement.innerHTML = `
            <div class="appointment-details">
                <div class="appointment-date">${formattedDate}</div>
                <div class="appointment-time">${appointment.time}</div>
                <div class="appointment-name">${appointment.name}</div>
                <div class="appointment-phone">${appointment.encryptedPhone}</div>
                <div class="appointment-haircut">Corte: ${getHaircutName(appointment.haircutId)}</div>
            </div>
            <button class="delete-btn" data-id="${appointment.id}">Eliminar</button>
        `;

        // Add event listener to delete button
        const deleteBtn = appointmentElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function () {
            deleteAppointment(appointment.id);
        });

        appointmentsList.appendChild(appointmentElement);
    });
}

// Helper function to get haircut name by ID
function getHaircutName(haircutId) {
    const haircutTypes = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    const haircut = haircutTypes.find(type => type.id == haircutId);
    return haircut ? haircut.name : 'Corte no especificado';
}

// Function to delete an appointment
function deleteAppointment(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
        let appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
        appointments = appointments.filter(app => app.id !== id);
        localStorage.setItem('reservations', JSON.stringify(appointments));
        
        // Delete from Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            firebaseSync.deleteReservation(id);
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadAppointments(); // Reload the appointments list
    }
}

// Function to filter appointments
function filterAppointments() {
    const year = document.getElementById('yearFilter').value;
    const month = document.getElementById('monthFilter').value;
    const weekDay = document.getElementById('weekFilter').value;

    let appointments = JSON.parse(localStorage.getItem('reservations') || '[]');

    // Filter by year
    if (year) {
        appointments = appointments.filter(app => {
            const date = new Date(app.date);
            return date.getFullYear().toString() === year;
        });
    }

    // Filter by month
    if (month !== '') {
        appointments = appointments.filter(app => {
            const date = new Date(app.date);
            return date.getMonth().toString() === month;
        });
    }

    // Filter by day of week
    if (weekDay !== '') {
        appointments = appointments.filter(app => {
            const date = new Date(app.date);
            return date.getDay().toString() === weekDay;
        });
    }

    displayAppointments(appointments);
}

// Function to update calendar with appointments
function updateCalendar() {
    // This will be implemented in calendar.js
    // For now, just trigger the calendar update
    if (window.updateCalendarDays) {
        window.updateCalendarDays();
    }
}

// Function to show booking modal for a specific date
function showBookingModal(date) {
    document.getElementById('date').value = date;
    document.getElementById('bookingModal').style.display = 'block';
}