// Configuration
const BARBER_WHATSAPP = '5197185907';

// State with enhanced data loading
const state = {
    currentDate: new Date(),
    selectedDate: null,
    reservations: [],
    isLoading: true,
    dataSync: new DataSync()
};

// Load data using the synchronization utility
async function loadData() {
    try {
        // Check if we have existing reservations in localStorage
        const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        state.reservations = await state.dataSync.initialize(() => {
            // Callback when data is updated from another tab
            renderCalendar();
            renderReservations();
        });
        
        // If we had existing reservations, preserve them
        if (existingReservations.length > 0 && state.reservations.length === 0) {
            state.reservations = existingReservations;
            console.log('Preserving existing reservations:', existingReservations.length);
        }
        
        console.log('Datos cargados:', state.reservations.length, 'reservas');
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Fallback to localStorage
        state.reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        localStorage.setItem('reservations', JSON.stringify(state.reservations));
    }
    state.isLoading = false;
}

// Save reservations using the synchronization utility
function saveReservations() {
    localStorage.setItem('reservations', JSON.stringify(state.reservations));
    state.dataSync.notifyDataChange();
    console.log('Reservas guardadas:', state.reservations);
}

// Get reservations for a specific date
function getReservationsForDate(dateString) {
    return state.reservations.filter(res => res.fecha === dateString);
}

// Get occupied time slots for a date
function getOccupiedTimes(dateString) {
    return getReservationsForDate(dateString).map(res => res.hora);
}

// Mask WhatsApp number for privacy (hide first digits, show last 3)
function maskWhatsApp(number) {
    if (!number || number.length < 3) return number;
    const last3 = number.slice(-3); // Get last 3 digits
    const hiddenCount = number.length - 3;
    return '*'.repeat(hiddenCount) + last3;
}

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();

    document.getElementById('monthYearDisplay').textContent = `${monthNames[month]} de ${year}`;

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    days.forEach(day => {
        const el = document.createElement('div');
        el.className = 'day-header';
        el.textContent = day;
        calendarGrid.appendChild(el);
    });

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;

        const currentDayDate = new Date(year, month, i);
        const todayDate = new Date(todayYear, todayMonth, todayDay);

        currentDayDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);

        if (currentDayDate.getTime() === todayDate.getTime()) {
            dayEl.classList.add('today');
        }

        if (currentDayDate < todayDate) {
            dayEl.classList.add('disabled');
            dayEl.style.cursor = 'not-allowed';
        } else {
            dayEl.onclick = () => selectDate(i);
        }

        calendarGrid.appendChild(dayEl);
    }

    const totalSlots = firstDayIndex + daysInMonth;
    const remaining = 35 - totalSlots > 0 ? 35 - totalSlots : (42 - totalSlots > 0 ? 42 - totalSlots : 0);

    for (let j = 0; j < remaining; j++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
}

function changeMonth(delta) {
    const current = state.currentDate;
    state.currentDate = new Date(current.getFullYear(), current.getMonth() + delta, 1);
    renderCalendar();
}

function goToToday() {
    state.currentDate = new Date();
    renderCalendar();
}

function setupNavigation() {
    const prevBtn = document.querySelector('.nav-btn:first-child');
    const nextBtn = document.querySelector('.nav-btn:last-child');
    const todayBtn = document.querySelector('.current-btn');

    const buttons = document.querySelectorAll('.nav-btn');
    const prev = buttons[0];
    const next = buttons[1];

    prev.onclick = () => changeMonth(-1);
    next.onclick = () => changeMonth(1);
    todayBtn.onclick = () => goToToday();
}

function setupFilters() {
    const pills = document.querySelectorAll('.pill');
    console.log('setupFilters: encontrados', pills.length, 'botones de filtro');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filterType = pill.textContent.trim();
            console.log('Filtro clickeado:', filterType);
            console.log('Reservas totales:', state.reservations.length);

            // Apply filter
            filterReservations(filterType);
        });
    });
}

function filterReservations(filterType) {
    const container = document.getElementById('reservationsList');
    if (!container) return;

    let filteredReservations = [...state.reservations];
    const now = new Date();

    switch (filterType) {
        case 'Todas':
            // Show all reservations
            break;

        case 'Por Año':
            // Show reservations from current year
            filteredReservations = filteredReservations.filter(res => {
                return res.fecha.includes(now.getFullYear().toString());
            });
            break;

        case 'Por Mes':
            // Show reservations from current month
            const currentMonth = monthNames[now.getMonth()];
            filteredReservations = filteredReservations.filter(res => {
                return res.fecha.includes(currentMonth) && res.fecha.includes(now.getFullYear().toString());
            });
            break;

        case 'Por Semanas':
            // Show reservations from current week
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            filteredReservations = filteredReservations.filter(res => {
                const resDate = parseDateString(res.fecha);
                return resDate >= weekStart && resDate <= weekEnd;
            });
            break;

        case 'Por Día':
            // Show reservations from today
            const today = `${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
            filteredReservations = filteredReservations.filter(res => {
                return res.fecha === today;
            });
            break;
    }

    // Render filtered reservations
    renderFilteredReservations(filteredReservations, filterType);
}

function parseDateString(dateStr) {
    // Parse "3 de Enero de 2026" format
    const parts = dateStr.split(' de ');
    const day = parseInt(parts[0]);
    const monthName = parts[1];
    const year = parseInt(parts[2]);
    const monthIndex = monthNames.indexOf(monthName);

    return new Date(year, monthIndex, day);
}

function renderFilteredReservations(reservations, filterType) {
    const container = document.getElementById('reservationsList');
    if (!container) return;

    const sortedReservations = [...reservations].reverse();

    if (sortedReservations.length === 0) {
        container.innerHTML = `<p style="color: #999; text-align: center; padding: 20px;">No hay reservas para "${filterType}"</p>`;
        return;
    }

    container.innerHTML = sortedReservations.map(res => `
        <div class="reservation-card" data-id="${res.id}">
            <div class="res-info">
                <h3>${res.nombre}</h3>
                <div class="res-details">${res.fecha} • ${res.hora} • ${res.corte}</div>
            </div>
            <button class="btn-black" onclick="viewReservationDetails('${res.id}')">Ver más</button>
        </div>
    `).join('');

    console.log(`Mostrando ${sortedReservations.length} reservas para filtro: ${filterType}`);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Cargando datos...');
    await loadData();
    console.log('Página cargada. Reservas:', state.reservations);
    renderCalendar();
    setupModalHandlers();
    setupNavigation();
    setupFilters();
    setupScrollButtons();
    setupDetailsModal();
    renderReservations();
    loadHaircutTypes(); // Load types from localStorage
    
    // Setup tab synchronization
    setupTabSync();
});

function loadHaircutTypes() {
    const types = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    const select = document.getElementById('cutTypeInput');
    if (!select) return;

    if (types.length > 0) {
        select.innerHTML = '<option value="" disabled selected>Seleccionar servicio</option>';
        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = `${t.name} - S/ ${t.price.toFixed(2)}`;
            opt.dataset.price = t.price;
            select.appendChild(opt);
        });
    }
}

function setupScrollButtons() {
    const leftBtn = document.getElementById('scrollLeft');
    const rightBtn = document.getElementById('scrollRight');
    const container = document.getElementById('filterContainer');

    if (!leftBtn || !rightBtn || !container) return;

    leftBtn.onclick = () => {
        container.scrollBy({ left: -150, behavior: 'smooth' });
    };

    rightBtn.onclick = () => {
        container.scrollBy({ left: 150, behavior: 'smooth' });
    };
}

function setupModalHandlers() {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('bookingForm');

    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    form.onsubmit = (e) => {
        e.preventDefault();

        const serviceSelect = document.getElementById('cutTypeInput');
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        const price = selectedOption ? parseFloat(selectedOption.dataset.price) : 0;

        const reservationData = {
            id: Date.now().toString(),
            fecha: document.getElementById('dateInput').value,
            hora: document.getElementById('timeInput').value,
            nombre: document.getElementById('nameInput').value,
            whatsapp: document.getElementById('whatsappInput').value,
            corte: serviceSelect.value,
            pago: document.getElementById('paymentInput').value,
            price: price, // Added price
            status: 'pendiente', // Default status
            paymentStatus: 'pendiente', // Default payment status
            paymentMethod: document.getElementById('paymentInput').value, // Standardized
            createdAt: new Date().toISOString()
        };

        const occupiedTimes = getOccupiedTimes(reservationData.fecha);
        if (occupiedTimes.includes(reservationData.hora)) {
            alert('⚠️ Lo sentimos, esta hora ya está ocupada. Por favor elige otra hora.');
            return;
        }

        state.reservations.push(reservationData);
        saveReservations();
        sendWhatsAppMessage(reservationData);

        alert(`✅ ¡Reserva Confirmada para ${reservationData.nombre}!
Fecha: ${reservationData.fecha}
Hora: ${reservationData.hora}

Se ha enviado la confirmación por WhatsApp.`);

        renderReservations();
        closeModal();
    };
}

function selectDate(day) {
    const modal = document.getElementById('bookingModal');
    const dateInput = document.getElementById('dateInput');
    const timeSelect = document.getElementById('timeInput');

    const year = state.currentDate.getFullYear();
    const month = monthNames[state.currentDate.getMonth()];
    const dateString = `${day} de ${month} de ${year}`;

    dateInput.value = dateString;
    state.selectedDate = dateString;

    const occupiedTimes = getOccupiedTimes(dateString);

    const timeOptions = timeSelect.querySelectorAll('option');
    timeOptions.forEach(option => {
        if (option.value && occupiedTimes.includes(option.value)) {
            option.disabled = true;
            option.textContent = option.textContent.replace(' (Ocupado)', '') + ' (Ocupado)';
            option.style.color = '#999';
        } else if (option.value) {
            option.disabled = false;
            option.textContent = option.textContent.replace(' (Ocupado)', '');
            option.style.color = '';
        }
    });

    document.getElementById('bookingForm').reset();
    dateInput.value = dateString;

    modal.style.display = 'flex';
}

function sendWhatsAppMessage(reservation) {
    const message = `🔔 *Nueva Reserva - Harry Barber*\n\n` +
        `👤 Cliente: ${reservation.nombre}\n` +
        `📅 Fecha: ${reservation.fecha}\n` +
        `🕐 Hora: ${reservation.hora}\n` +
        `✂️ Servicio: ${reservation.corte}\n` +
        `💳 Pago: ${reservation.pago}\n` +
        `📱 WhatsApp: ${reservation.whatsapp}`;

    const url = `https://wa.me/${BARBER_WHATSAPP}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function renderReservations() {
    const container = document.getElementById('reservationsList');
    console.log('renderReservations llamado. Container:', container, 'Reservas:', state.reservations);

    if (!container) {
        console.error('Container reservationsList no encontrado!');
        return;
    }

    const sortedReservations = [...state.reservations].reverse();

    if (sortedReservations.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No hay reservas aún</p>';
        return;
    }

    container.innerHTML = sortedReservations.map(res => `
        <div class="reservation-card" data-id="${res.id}">
            <div class="res-info">
                <h3>${res.nombre}</h3>
                <div class="res-details">${res.fecha} • ${res.hora} • ${res.corte}</div>
            </div>
            <button class="btn-black" onclick="viewReservationDetails('${res.id}')">Ver más</button>
        </div>
    `).join('');

    console.log('Reservas renderizadas:', sortedReservations.length);
}

function viewReservationDetails(id) {
    const reservation = state.reservations.find(r => r.id === id);
    if (!reservation) return;

    document.getElementById('detail-nombre').textContent = reservation.nombre;
    document.getElementById('detail-fecha').textContent = reservation.fecha;
    document.getElementById('detail-hora').textContent = reservation.hora;
    document.getElementById('detail-corte').textContent = reservation.corte;
    document.getElementById('detail-pago').textContent = reservation.pago;
    document.getElementById('detail-whatsapp').textContent = maskWhatsApp(reservation.whatsapp);

    const modal = document.getElementById('detailsModal');
    modal.style.display = 'flex';
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) modal.style.display = 'none';
}

function setupDetailsModal() {
    const modal = document.getElementById('detailsModal');
    const closeBtn = document.getElementById('closeDetailsModal');

    if (!modal || !closeBtn) return;

    closeBtn.onclick = closeDetailsModal;

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeDetailsModal();
        }
    });
}

// Setup synchronization between browser tabs
function setupTabSync() {
    // Tab synchronization is now handled by DataSync utility
    console.log('Tab synchronization managed by DataSync utility');
}
