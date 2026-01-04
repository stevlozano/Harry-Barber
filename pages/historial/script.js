const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Load reservations from localStorage
let reservations = [];
let currentFilter = 'all';

// Mask WhatsApp number for privacy (hide first digits, show last 3)
function maskWhatsApp(number) {
    if (!number || number.length < 3) return number;
    const last3 = number.slice(-3); // Get last 3 digits
    const hiddenCount = number.length - 3;
    return '*'.repeat(hiddenCount) + last3;
}

document.addEventListener('DOMContentLoaded', function () {
    loadReservations();
    setupFilters();
    setupDetailsModal();
    renderReservations();
});

function loadReservations() {
    reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    console.log('Reservas cargadas desde localStorage:', reservations);
}

function setupFilters() {
    const pills = document.querySelectorAll('.pill');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            currentFilter = pill.dataset.filter;
            console.log('Filtro seleccionado:', currentFilter);
            renderReservations();
        });
    });
}

function renderReservations() {
    const container = document.getElementById('historyList');
    if (!container) return;

    const filtered = filterReservations(currentFilter);
    console.log(`Mostrando ${filtered.length} reservas con filtro: ${currentFilter}`);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No hay reservas</h3>
                <p>No se encontraron reservas para este filtro</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(res => {
        const timeStatus = getReservationStatus(res.fecha);
        // Prioritize barber's status if available
        const statusLabel = res.status ? (res.status.charAt(0).toUpperCase() + res.status.slice(1)) : timeStatus.label;
        const statusClass = res.status || timeStatus.type;

        return `
            <div class="history-card">
                <div class="history-info">
                    <h3>${res.nombre}</h3>
                    <div class="history-details">${res.fecha} • ${res.hora} • ${res.corte}</div>
                    <span class="history-status status-${statusClass}">${statusLabel}</span>
                </div>
                <button class="btn-view" onclick="viewDetails('${res.id}')">Ver Detalles</button>
            </div>
        `;
    }).join('');
}

function filterReservations(filter) {
    const now = new Date();
    const today = `${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;

    switch (filter) {
        case 'all':
            return reservations;

        case 'upcoming':
            return reservations.filter(res => {
                const resDate = parseDateString(res.fecha);
                return resDate >= now;
            });

        case 'past':
            return reservations.filter(res => {
                const resDate = parseDateString(res.fecha);
                return resDate < now;
            });

        case 'today':
            return reservations.filter(res => res.fecha === today);

        default:
            return reservations;
    }
}

function getReservationStatus(dateStr) {
    const now = new Date();
    const today = `${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;

    if (dateStr === today) {
        return { type: 'today', label: 'Hoy' };
    }

    const resDate = parseDateString(dateStr);
    if (resDate > now) {
        return { type: 'upcoming', label: 'Próxima' };
    }

    return { type: 'past', label: 'Pasada' };
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

function viewDetails(id) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    document.getElementById('detail-nombre').textContent = reservation.nombre;
    document.getElementById('detail-fecha').textContent = reservation.fecha;
    document.getElementById('detail-hora').textContent = reservation.hora;
    document.getElementById('detail-corte').textContent = reservation.corte;
    document.getElementById('detail-pago').textContent = reservation.paymentMethod || reservation.pago || 'No especificado';
    document.getElementById('detail-whatsapp').textContent = maskWhatsApp(reservation.whatsapp);
    document.getElementById('detail-status').textContent = reservation.status ? (reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)) : 'Pendiente';
    document.getElementById('detail-pago-status').textContent = reservation.paymentStatus ? (reservation.paymentStatus.charAt(0).toUpperCase() + reservation.paymentStatus.slice(1)) : 'Pendiente';

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
