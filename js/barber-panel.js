// Comprehensive Barber Panel Logic
document.addEventListener('DOMContentLoaded', async function () {
    // Tab Switching Logic
    setupTabs();

    // Initialize Firebase synchronization
    if (window.FirebaseDataSync) {
        const firebaseSync = new FirebaseDataSync();
        await firebaseSync.initialize(() => {
            // Callback when reservations data is updated from Firebase
            refreshDashboard();
            loadReservations();
            loadHaircutTypes();
            loadPromotions();
        });
        
        // Listen for changes in promotions
        if (database) {
            const promoRef = database.ref('promotions');
            promoRef.on('value', () => {
                loadPromotions();
            });
            
            // Listen for changes in haircut types
            const haircutRef = database.ref('haircutTypes');
            haircutRef.on('value', () => {
                loadHaircutTypes();
            });
        }
    }

    // Initial Load
    refreshDashboard();
    loadReservations();
    loadHaircutTypes();
    loadPromotions();
    loadProfile();

    // Form Event Listeners
    setupFormListeners();
    setupPinInput();
});

function setupTabs() {
    const sidebarItems = document.querySelectorAll('.nav-item[data-tab]');
    const bottomNavItems = document.querySelectorAll('.nav-btn[data-tab]');
    const allNavItems = [...sidebarItems, ...bottomNavItems];

    allNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');

            // UI Updates - Sync all nav elements (Sidebar + Bottom Nav)
            allNavItems.forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll(`[data-tab="${tabId}"]`).forEach(nav => nav.classList.add('active'));

            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(`${tabId}Tab`);
            if (targetTab) targetTab.classList.add('active');

            document.getElementById('tabTitle').textContent = item.textContent.trim();

            // Specific Tab Refresh
            if (tabId === 'dashboard') refreshDashboard();
            if (tabId === 'reservations') loadReservations();
            if (tabId === 'haircuts') loadHaircutTypes();
            if (tabId === 'promotions') loadPromotions();
            if (tabId === 'settings') loadProfile();
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// --- Dashboard Logic ---
function refreshDashboard() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = document.getElementById('dashboardDateFilter')?.value || 'upcoming';

    // Agenda Filtering logic
    const filteredReservations = reservations
        .filter(res => {
            const resDate = parseAppDate(res.fecha);
            if (filter === 'today') return resDate.getTime() === now.getTime();
            if (filter === 'tomorrow') return resDate.getTime() === tomorrow.getTime();
            if (filter === 'upcoming') return resDate >= now;
            return true; // "all"
        })
        .sort((a, b) => {
            const dateA = parseAppDate(a.fecha);
            const dateB = parseAppDate(b.fecha);
            if (dateA - dateB !== 0) return dateA - dateB;
            return a.hora.localeCompare(b.hora);
        });

    // Dashboard Stats logic
    const pending = reservations.filter(res => res.status !== 'atendido').length;
    const done = reservations.filter(res => res.status === 'atendido').length;

    // Total Global Revenue (Sum of all 'pagado' across all time)
    const totalRev = reservations
        .filter(res => res.paymentStatus === 'pagado')
        .reduce((acc, res) => acc + (parseFloat(res.price) || 0), 0);

    const pendingCount = document.getElementById('pendingCount');
    const doneCount = document.getElementById('doneCount');
    const totalRevenue = document.getElementById('totalRevenue');

    if (pendingCount) pendingCount.textContent = pending;
    if (doneCount) doneCount.textContent = done;
    if (totalRevenue) totalRevenue.textContent = `S/ ${totalRev.toFixed(2)}`;

    renderTable('todayReservationsTable', filteredReservations, true);
}

// --- Reservations Logic ---
function loadReservations() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const searchInput = document.getElementById('searchReservation');
    const statusFilterInput = document.getElementById('statusFilter');

    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusFilterInput ? statusFilterInput.value : 'all';

    let filtered = reservations.filter(res => {
        const matchesSearch = res.nombre.toLowerCase().includes(search) || res.whatsapp.includes(search);
        const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    renderTable('allReservationsTable', filtered, false);
}

function renderTable(tableId, data, isCompact) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${isCompact ? 5 : 8}" style="text-align:center">No se encontraron registros</td></tr>`;
        return;
    }

    data.reverse().forEach(res => {
        const tr = document.createElement('tr');
        if (isCompact) {
            tr.innerHTML = `
                <td data-label="Hora">${res.hora}</td>
                <td data-label="Cliente">${res.nombre}</td>
                <td data-label="Servicio">${res.corte}</td>
                <td data-label="Estado"><span class="status-badge status-${res.status || 'pendiente'}">${res.status || 'pendiente'}</span></td>
                <td data-label="Acciones">
                    <div style="display:flex; gap:8px">
                        <button class="btn-view" onclick="openReservationDetail('${res.id}')"><span class="material-symbols-outlined">visibility</span></button>
                    </div>
                </td>
            `;
        } else {
            tr.innerHTML = `
                <td data-label="Fecha">${res.fecha}</td>
                <td data-label="Hora">${res.hora}</td>
                <td data-label="Cliente">${res.nombre}</td>
                <td data-label="WhatsApp">${res.whatsapp}</td>
                <td data-label="Servicio">${res.corte}</td>
                <td data-label="Pago"><span class="status-badge status-${res.paymentStatus || 'pendiente'}">${res.paymentMethod || 'N/A'}</span></td>
                <td data-label="Estado"><span class="status-badge status-${res.status || 'pendiente'}">${res.status || 'pendiente'}</span></td>
                <td data-label="Acciones">
                    <div style="display:flex; gap:8px">
                        <button class="btn-view" onclick="openReservationDetail('${res.id}')"><span class="material-symbols-outlined">visibility</span></button>
                        <button class="btn-edit" onclick="openEditReservationModal('${res.id}')"><span class="material-symbols-outlined">edit</span></button>
                        <button class="btn-delete" onclick="deleteReservation('${res.id}')"><span class="material-symbols-outlined">delete</span></button>
                    </div>
                </td>
            `;
        }
        tbody.appendChild(tr);
    });
}

function openReservationDetail(id) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    const detailBody = document.getElementById('resDetailBody');
    detailBody.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Cliente</span>
            <span class="detail-value">${res.nombre}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">WhatsApp</span>
            <span class="detail-value">${res.whatsapp}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Fecha</span>
            <span class="detail-value">${res.fecha}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Hora</span>
            <span class="detail-value">${res.hora}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Servicio</span>
            <span class="detail-value">${res.corte}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Precio</span>
            <span class="detail-value">S/ ${(parseFloat(res.price) || 0).toFixed(2)}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Estado Pago</span>
            <span class="detail-value" style="color:${res.paymentStatus === 'pagado' ? 'var(--success)' : 'var(--warning)'}">${res.paymentStatus} (${res.paymentMethod})</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Estado Cita</span>
            <span class="detail-value" style="color:${res.status === 'atendido' ? 'var(--success)' : 'var(--warning)'}">${res.status}</span>
        </div>
    `;

    document.getElementById('btnEditFromDetail').onclick = () => {
        closeModal('resDetailModal');
        openEditReservationModal(id);
    };

    document.getElementById('resDetailModal').style.display = 'flex';
}

function openEditReservationModal(id) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    document.getElementById('editResId').value = res.id;
    document.getElementById('editResName').value = res.nombre;
    document.getElementById('editResStatus').value = res.status || 'pendiente';
    document.getElementById('editResPaymentStatus').value = res.paymentStatus || 'pendiente';
    document.getElementById('editResPaymentMethod').value = res.paymentMethod || 'none';

    document.getElementById('editReservationModal').style.display = 'flex';
}

function deleteReservation(id) {
    if (confirm('¿Eliminar esta reservación permanentemente?')) {
        let res = JSON.parse(localStorage.getItem('reservations') || '[]');
        res = res.filter(r => r.id !== id);
        localStorage.setItem('reservations', JSON.stringify(res));
        
        // Delete from Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            firebaseSync.deleteReservation(id);
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadReservations();
        refreshDashboard();
        
        // Refresh haircuts to ensure consistency across tabs
        if (typeof loadHaircutTypes === 'function') {
            loadHaircutTypes();
        }
    }
}

// --- Haircuts Logic ---
function loadHaircutTypes() {
    const haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    const grid = document.getElementById('adminHaircutsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (haircuts.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px; color:var(--text-muted)">No hay cortes registrados. Agrega uno nuevo.</p>';
        return;
    }

    haircuts.forEach(h => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <img src="${h.image || '/assets/images/placeholder.jpg'}" class="card-img" alt="${h.name}">
            <div class="card-content">
                <h3>${h.name}</h3>
                <p>${h.description}</p>
                <p style="margin-top:10px; font-weight:800; color:var(--primary)">S/ ${parseFloat(h.price).toFixed(2)}</p>
            </div>
            <div class="card-actions">
                <button class="btn-edit" onclick="editHaircut('${h.id}')"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-delete" onclick="deleteHaircut('${h.id}')"><span class="material-symbols-outlined">delete</span></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openHaircutModal() {
    document.getElementById('haircutForm').reset();
    document.getElementById('haircutId').value = '';
    document.getElementById('haircutModalTitle').textContent = 'Nuevo Tipo de Corte';
    document.getElementById('imagePreview').innerHTML = '<span class="material-symbols-outlined">add_a_photo</span><p>Subir Imagen</p>';
    document.getElementById('haircutModal').style.display = 'flex';
}

function editHaircut(id) {
    const haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
    const h = haircuts.find(item => item.id == id);
    if (!h) return;

    document.getElementById('haircutId').value = h.id;
    document.getElementById('haircutName').value = h.name;
    document.getElementById('haircutPrice').value = h.price;
    document.getElementById('haircutDescription').value = h.description;
    if (h.image) {
        document.getElementById('imagePreview').innerHTML = `<img src="${h.image}" style="width:100%;height:100%;object-fit:cover">`;
    }

    document.getElementById('haircutModalTitle').textContent = 'Editar Tipo de Corte';
    document.getElementById('haircutModal').style.display = 'flex';
}

function deleteHaircut(id) {
    if (confirm('¿Eliminar este tipo de corte?')) {
        let haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
        haircuts = haircuts.filter(h => h.id != id);
        localStorage.setItem('haircutTypes', JSON.stringify(haircuts));
        
        // Delete from Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            firebaseSync.deleteHaircutType(id);
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadHaircutTypes();
        
        // Refresh haircuts to ensure consistency across tabs
        if (typeof loadHaircutTypes === 'function') {
            loadHaircutTypes();
        }
    }
}

// --- Promotions Logic ---
function loadPromotions() {
    const promos = JSON.parse(localStorage.getItem('promotions') || '[]');
    const grid = document.getElementById('adminPromotionsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (promos.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:40px; color:var(--text-muted)">No hay promociones registradas. Agrega una nueva.</p>';
        return;
    }

    promos.forEach(p => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="card-content">
                <div style="background:var(--primary);color:white;padding:5px 12px;border-radius:10px;display:inline-block;margin-bottom:15px; font-weight:700">-${p.discount}%</div>
                <h3>${p.name}</h3>
                <p>${p.description}</p>
            </div>
            <div class="card-actions">
                <button class="btn-edit" onclick="editPromotion('${p.id}')"><span class="material-symbols-outlined">edit</span></button>
                <button class="btn-delete" onclick="deletePromotion('${p.id}')"><span class="material-symbols-outlined">delete</span></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openPromotionModal() {
    document.getElementById('promotionForm').reset();
    document.getElementById('promoId').value = '';
    document.getElementById('promoModalTitle').textContent = 'Nueva Promoción';
    document.getElementById('promotionModal').style.display = 'flex';
}

function editPromotion(id) {
    const promos = JSON.parse(localStorage.getItem('promotions') || '[]');
    const p = promos.find(item => item.id == id);
    if (!p) return;

    document.getElementById('promoId').value = p.id;
    document.getElementById('promoName').value = p.name;
    document.getElementById('promoDiscount').value = p.discount;
    document.getElementById('promoDescription').value = p.description;

    document.getElementById('promoModalTitle').textContent = 'Editar Promoción';
    document.getElementById('promotionModal').style.display = 'flex';
}

function deletePromotion(id) {
    if (confirm('¿Eliminar esta promoción?')) {
        let promos = JSON.parse(localStorage.getItem('promotions') || '[]');
        promos = promos.filter(p => p.id != id);
        localStorage.setItem('promotions', JSON.stringify(promos));
        
        // Delete from Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            firebaseSync.deletePromotion(id);
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadPromotions();
        
        // Refresh haircuts to ensure consistency across tabs
        if (typeof loadHaircutTypes === 'function') {
            loadHaircutTypes();
        }
    }
}

// --- Profile & PIN Logic ---
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('adminProfile') || '{"name": "Harry Barber", "photo": ""}');

    const profileNameInput = document.getElementById('profileName');
    if (profileNameInput) profileNameInput.value = profile.name;

    const headerUserName = document.getElementById('headerUserName');
    if (headerUserName) headerUserName.textContent = profile.name;

    const currentNameEl = document.getElementById('currentProfileName');
    if (currentNameEl) currentNameEl.textContent = profile.name;

    const profileImagePreview = document.getElementById('profileImagePreview');
    const headerAvatar = document.getElementById('headerAvatar');
    const mobileHeaderAvatar = document.getElementById('mobileHeaderAvatar');

    if (profile.photo) {
        if (profileImagePreview) profileImagePreview.innerHTML = `<img src="${profile.photo}" style="width:100%;height:100%;object-fit:cover">`;
        if (headerAvatar) headerAvatar.innerHTML = `<img src="${profile.photo}" style="width:100%;height:100%;object-fit:cover">`;
        if (mobileHeaderAvatar) mobileHeaderAvatar.innerHTML = `<img src="${profile.photo}" style="width:100%;height:100%;object-fit:cover">`;
    } else {
        if (profileImagePreview) profileImagePreview.innerHTML = `<span class="material-symbols-outlined" style="font-size:60px; color:var(--white)">person</span>`;
        if (headerAvatar) headerAvatar.textContent = profile.name.charAt(0);
        if (mobileHeaderAvatar) mobileHeaderAvatar.textContent = profile.name.charAt(0);
    }
}

function updateProfilePhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const photo = e.target.result;
            const profile = JSON.parse(localStorage.getItem('adminProfile') || '{"name": "Harry Barber", "photo": ""}');
            profile.photo = photo;
            localStorage.setItem('adminProfile', JSON.stringify(profile));
            loadProfile();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function setupPinInput() {
    const inputs = document.querySelectorAll('.pin-slot');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.data && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
}

// --- Form Submissions ---
function setupFormListeners() {
    // Profile Form
    document.getElementById('profileForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const profile = JSON.parse(localStorage.getItem('adminProfile') || '{"name": "Harry Barber", "photo": ""}');
        profile.name = document.getElementById('profileName').value;
        localStorage.setItem('adminProfile', JSON.stringify(profile));
        loadProfile();
        alert('Perfil actualizado correctamente');
    });

    // PIN Form
    document.getElementById('pinForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const pin = document.getElementById('pin1').value +
            document.getElementById('pin2').value +
            document.getElementById('pin3').value +
            document.getElementById('pin4').value;

        if (pin.length === 4) {
            localStorage.setItem('barberPin', pin);
            alert('PIN actualizado correctamente');
            document.querySelectorAll('.pin-digit').forEach(input => input.value = '');
        } else {
            alert('Por favor, ingresa un PIN de 4 dígitos');
        }
    });

    // Haircut Form
    document.getElementById('haircutForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('haircutId').value;
        const img = document.getElementById('imagePreview').querySelector('img')?.src || '';

        const haircut = {
            id: id || Date.now(),
            name: document.getElementById('haircutName').value,
            price: parseFloat(document.getElementById('haircutPrice').value),
            description: document.getElementById('haircutDescription').value,
            image: img
        };

        let haircuts = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
        if (id) {
            haircuts = haircuts.map(h => h.id == id ? haircut : h);
        } else {
            haircuts.push(haircut);
        }

        localStorage.setItem('haircutTypes', JSON.stringify(haircuts));
        
        // Save to Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            if (id) {
                firebaseSync.updateHaircutType(id, haircut);
            } else {
                firebaseSync.addHaircutType(haircut);
            }
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadHaircutTypes();
        closeModal('haircutModal');
        
        // Refresh haircuts to ensure consistency across tabs
        if (typeof loadHaircutTypes === 'function') {
            loadHaircutTypes();
        }
    });

    // Promotion Form
    document.getElementById('promotionForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('promoId').value;

        const promo = {
            id: id || Date.now(),
            name: document.getElementById('promoName').value,
            discount: parseInt(document.getElementById('promoDiscount').value),
            description: document.getElementById('promoDescription').value
        };

        let promos = JSON.parse(localStorage.getItem('promotions') || '[]');
        if (id) {
            promos = promos.map(p => p.id == id ? promo : p);
        } else {
            promos.push(promo);
        }

        localStorage.setItem('promotions', JSON.stringify(promos));
        
        // Save to Firebase if available
        if (window.FirebaseDataSync) {
            const firebaseSync = new FirebaseDataSync();
            if (id) {
                firebaseSync.updatePromotion(id, promo);
            } else {
                firebaseSync.addPromotion(promo);
            }
        } else {
            // Fallback notification
            localStorage.setItem('lastUpdate', Date.now().toString());
        }
        
        loadPromotions();
        closeModal('promotionModal');
        
        // Refresh haircuts to ensure consistency across tabs
        if (typeof loadHaircutTypes === 'function') {
            loadHaircutTypes();
        }
    });

    // Edit Reservation Form
    document.getElementById('editReservationForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = document.getElementById('editResId').value;

        let reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const idx = reservations.findIndex(r => r.id === id);

        if (idx !== -1) {
            reservations[idx].status = document.getElementById('editResStatus').value;
            reservations[idx].paymentStatus = document.getElementById('editResPaymentStatus').value;
            reservations[idx].paymentMethod = document.getElementById('editResPaymentMethod').value;

            // Ensure price is set and robust
            if (!reservations[idx].price || reservations[idx].price === 0) {
                const types = JSON.parse(localStorage.getItem('haircutTypes') || '[]');
                const promos = JSON.parse(localStorage.getItem('promotions') || '[]');

                let corteName = reservations[idx].corte;
                if (corteName.startsWith('PROMO: ')) {
                    const promoName = corteName.replace('PROMO: ', '');
                    const currentPromo = promos.find(p => p.name === promoName);
                    if (currentPromo) {
                        const baseHaircut = types.find(h => promoName.toLowerCase().includes(h.name.toLowerCase()));
                        const discount = currentPromo.discount || 0;
                        const basePrice = baseHaircut ? baseHaircut.price : 30; // Fallback base price
                        reservations[idx].price = basePrice - (basePrice * discount / 100);
                    }
                } else {
                    const type = types.find(t => t.name === corteName);
                    if (type) reservations[idx].price = type.price;
                }
            }

            localStorage.setItem('reservations', JSON.stringify(reservations));
            
            // Update in Firebase if available
            if (window.FirebaseDataSync) {
                const firebaseSync = new FirebaseDataSync();
                firebaseSync.updateReservation(id, reservations[idx]);
            } else {
                // Fallback notification
                localStorage.setItem('lastUpdate', Date.now().toString());
            }
            
            loadReservations();
            refreshDashboard();
            closeModal('editReservationModal');
            
            // Refresh haircuts to ensure consistency across tabs
            if (typeof loadHaircutTypes === 'function') {
                loadHaircutTypes();
            }
        }
    });

    // Search and filters
    document.getElementById('searchReservation').addEventListener('input', loadReservations);
    document.getElementById('statusFilter').addEventListener('change', loadReservations);
}

// --- Helpers ---
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('imagePreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:15px">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function getMonthName(index) {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return months[index];
}

function parseAppDate(dateStr) {
    // Format: "3 de Enero de 2026"
    const parts = dateStr.split(' de ');
    if (parts.length !== 3) return new Date(0);

    const day = parseInt(parts[0]);
    const monthName = parts[1];
    const year = parseInt(parts[2]);

    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const month = months.indexOf(monthName);

    return new Date(year, month, day);
}

function openRevenueDetails() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const paidReservations = reservations.filter(res => res.paymentStatus === 'pagado');

    const breakdown = {
        'Yape': 0,
        'Plin': 0,
        'Efectivo': 0,
        'Tarjeta': 0,
        'Otros/Ninguno': 0
    };

    let total = 0;

    paidReservations.forEach(res => {
        const method = res.paymentMethod || 'none';
        const price = parseFloat(res.price) || 0;
        total += price;

        if (method === 'Yape') breakdown['Yape'] += price;
        else if (method === 'Plin') breakdown['Plin'] += price;
        else if (method === 'Efectivo') breakdown['Efectivo'] += price;
        else if (method === 'Tarjeta') breakdown['Tarjeta'] += price;
        else breakdown['Otros/Ninguno'] += price;
    });

    const listContainer = document.getElementById('revenueBreakdownList');
    if (listContainer) {
        listContainer.innerHTML = '';
        Object.entries(breakdown).forEach(([method, amount]) => {
            if (amount > 0 || method !== 'Otros/Ninguno') {
                const item = document.createElement('div');
                item.className = 'revenue-breakdown-item';
                item.style = 'display:flex; justify-content:space-between; padding:12px 15px; background:rgba(0,0,0,0.03); border-radius:12px; margin-bottom:10px; align-items:center';

                let icon = 'payments';
                if (method === 'Yape' || method === 'Plin') icon = 'qr_code_2';
                if (method === 'Efectivo') icon = 'account_balance_wallet';
                if (method === 'Tarjeta') icon = 'credit_card';

                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px">
                        <span class="material-symbols-outlined" style="color:var(--primary); font-size:20px">${icon}</span>
                        <span style="font-weight:600">${method}</span>
                    </div>
                    <span style="font-weight:700">S/ ${amount.toFixed(2)}</span>
                `;
                listContainer.appendChild(item);
            }
        });
    }

    const totalEl = document.getElementById('breakdownTotalAmount');
    if (totalEl) totalEl.textContent = `S/ ${total.toFixed(2)}`;

    document.getElementById('revenueDetailModal').style.display = 'flex';
}

window.openEditReservationModal = openEditReservationModal;
window.deleteReservation = deleteReservation;
window.editHaircut = editHaircut;
window.deleteHaircut = deleteHaircut;
window.editPromotion = editPromotion;
window.deletePromotion = deletePromotion;
window.closeModal = closeModal;
window.previewImage = previewImage;
window.openHaircutModal = openHaircutModal;
window.openPromotionModal = openPromotionModal;
window.updateProfilePhoto = updateProfilePhoto;
window.openReservationDetail = openReservationDetail;window.openRevenueDetails = openRevenueDetails;

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar tu sesión?')) {
        window.location.href = '/index.html';
    }
}

window.logout = logout;
