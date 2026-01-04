// Load promotions when the page loads
document.addEventListener('DOMContentLoaded', function () {
    loadPromotions();
    setupModalHandlers();
});

function loadPromotions() {
    const promotions = JSON.parse(localStorage.getItem('promotions') || '[]');
    const promotionsContainer = document.getElementById('promotionsContainer');

    console.log('Promociones cargadas:', promotions);

    if (promotions.length === 0) {
        promotionsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No hay promociones disponibles</h3>
                <p>Vuelve pronto para ver nuestras ofertas especiales</p>
            </div>
        `;
        return;
    }

    promotionsContainer.innerHTML = '';

    promotions.forEach(promo => {
        const promoElement = document.createElement('div');
        promoElement.className = 'promotion-card';
        promoElement.innerHTML = `
            <div class="promotion-badge">-${promo.discount}%</div>
            <h3 class="promotion-title">${promo.name}</h3>
            <p class="promotion-description">${promo.description}</p>
            <div class="promotion-footer">
                <div class="promotion-price">
                    Ahorra <strong>${promo.discount}%</strong>
                </div>
                <button class="btn-reserve" onclick="reservePromotion('${promo.name}')">Reservar</button>
            </div>
        `;
        promotionsContainer.appendChild(promoElement);
    });
}

function reservePromotion(promoName) {
    const modal = document.getElementById('bookingModal');
    const promoInput = document.getElementById('promoInput');

    promoInput.value = promoName;
    modal.style.display = 'flex';
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

    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        dateInput.addEventListener('change', function () {
            updateAvailableTimes(this.value);
        });
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    form.onsubmit = (e) => {
        e.preventDefault();

        const promoInput = document.getElementById('promoInput');
        const dateInputEl = document.getElementById('dateInput');
        const timeInput = document.getElementById('timeInput');
        const nameInput = document.getElementById('nameInput');
        const whatsappInput = document.getElementById('whatsappInput');
        const paymentInput = document.getElementById('paymentInput');

        if (!promoInput || !dateInputEl || !timeInput || !nameInput || !whatsappInput || !paymentInput) return;

        const promoName = promoInput.value;
        const dateRaw = dateInputEl.value;
        const time = timeInput.value;
        const name = nameInput.value;
        const whatsapp = whatsappInput.value;
        const payment = paymentInput.value;

        // Format date to local string used in app: "3 de Enero de 2026"
        const dateObj = new Date(dateRaw + 'T00:00:00');
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

        // Get the price for this promotion
        // We'll try to find the base price of the haircut and apply the discount
        const haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
        const promos = JSON.parse(localStorage.getItem('promotions') || '[]');
        const currentPromo = promos.find(p => p.name === promoName);

        let price = 0;
        if (currentPromo) {
            // If the promo name matches a haircut (partially or fully), try to get its price
            const baseHaircut = haircuts.find(h => promoName.toLowerCase().includes(h.name.toLowerCase()));
            if (baseHaircut) {
                const discountAmount = (baseHaircut.price * currentPromo.discount) / 100;
                price = baseHaircut.price - discountAmount;
            } else {
                // Default fallback price if no haircut match is found
                price = 30 - ((30 * currentPromo.discount) / 100);
            }
        }

        const newReservation = {
            id: Date.now().toString(),
            fecha: formattedDate,
            hora: time,
            nombre: name,
            whatsapp: whatsapp,
            corte: `PROMO: ${promoName}`,
            price: parseFloat(price) || 0,
            pago: payment,
            paymentMethod: payment,
            status: 'pendiente',
            paymentStatus: 'pendiente',
            createdAt: new Date().toISOString()
        };

        reservations.push(newReservation);
        localStorage.setItem('reservations', JSON.stringify(reservations));

        sendWhatsAppMessage(newReservation);
        alert(`✅ ¡Reserva de Promoción Confirmada!\nOferta: ${promoName}\nFecha: ${formattedDate}\nHora: ${time}\n\nSe ha enviado la confirmación por WhatsApp.`);

        closeModal();
    };
}

function updateAvailableTimes(dateRaw) {
    if (!dateRaw) return;

    const timeSelect = document.getElementById('timeInput');
    if (!timeSelect) return;

    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');

    const dateObj = new Date(dateRaw + 'T00:00:00');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const formattedDate = `${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;

    const occupiedTimes = reservations
        .filter(res => res.fecha === formattedDate)
        .map(res => res.hora);

    const options = timeSelect.querySelectorAll('option');
    options.forEach(option => {
        if (!option.value) return;

        if (occupiedTimes.includes(option.value)) {
            option.disabled = true;
            option.textContent = option.value + ' (Ocupado)';
            option.style.color = '#999';
        } else {
            option.disabled = false;
            option.textContent = option.value;
            option.style.color = '';
        }
    });
}

function sendWhatsAppMessage(reservation) {
    const message = `🔔 *Nueva Reserva de Promoción - Harry Barber*\n\n` +
        `👤 Cliente: ${reservation.nombre}\n` +
        `📅 Fecha: ${reservation.fecha}\n` +
        `🕐 Hora: ${reservation.hora}\n` +
        `🎟️ Promoción: ${reservation.corte}\n` +
        `💳 Pago: ${reservation.pago}\n\n` +
        `¡Gracias por preferir Harry Barber! ✨`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/51912630560?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}
