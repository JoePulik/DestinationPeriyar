/**
 * Elysian Heights - Host Administration Portal Logic
 * Manages booking requests, custom offer creation, and payment approvals
 */

const STORAGE_KEY = 'elysian_homestay_bookings';
let currentBookings = [];
let activeFilter = 'ALL';
let searchQuery = '';
let activeBookingIdForOffer = null;
let activeBookingIdForPayment = null;

// ==========================================================================
// 1. AUTHENTICATION (HOST PIN LOCK)
// ==========================================================================
function initAdminAuth() {
    const lockOverlay = document.getElementById('adminLockOverlay');
    const pinForm = document.getElementById('adminPinForm');
    const pinInput = document.getElementById('adminPinInput');
    const pinError = document.getElementById('adminPinError');

    if (sessionStorage.getItem('eh_admin_auth') === 'true') {
        if (lockOverlay) lockOverlay.style.display = 'none';
        loadDashboard();
        return;
    }

    if (pinForm) {
        pinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = (pinInput.value || '').trim().toLowerCase();
            if (val === '2026' || val === 'joe') {
                sessionStorage.setItem('eh_admin_auth', 'true');
                if (lockOverlay) lockOverlay.style.display = 'none';
                loadDashboard();
            } else {
                if (pinError) pinError.style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
            }
        });
    }
}

function adminLogout() {
    sessionStorage.removeItem('eh_admin_auth');
    window.location.reload();
}

// ==========================================================================
// 2. DATA MANAGEMENT (LOCALSTORAGE & DEMO DATA)
// ==========================================================================
function fetchBookings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Error fetching bookings:', e);
        return [];
    }
}

function saveBookings(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        currentBookings = list;
    } catch (e) {
        console.error('Error saving bookings:', e);
    }
}

function loadDashboard() {
    currentBookings = fetchBookings();
    updateMetrics();
    renderBookingsList();
}

// ==========================================================================
// 3. METRICS / KPIS
// ==========================================================================
function updateMetrics() {
    const total = currentBookings.length;
    const pending = currentBookings.filter(b => b.status === 'PENDING_APPROVAL').length;
    const offers = currentBookings.filter(b => b.status === 'OFFER_SENT').length;
    const confirmed = currentBookings.filter(b => b.status === 'CONFIRMED').length;

    let revenue = 0;
    currentBookings.forEach(b => {
        if (b.status === 'CONFIRMED') {
            const amt = b.payment?.amountPaid || b.offer?.finalOfferTotal || b.estimatedTotal || 0;
            revenue += amt;
        }
    });

    document.getElementById('metricTotal').innerText = total;
    document.getElementById('metricPending').innerText = pending;
    document.getElementById('metricOffers').innerText = offers;
    document.getElementById('metricConfirmed').innerText = confirmed;
    document.getElementById('metricRevenue').innerText = `₹${revenue.toLocaleString('en-IN')}`;

    // Update tab badges
    document.getElementById('badgeAll').innerText = total;
    document.getElementById('badgePending').innerText = pending;
    document.getElementById('badgeOffers').innerText = offers;
    document.getElementById('badgeConfirmed').innerText = confirmed;
}

// ==========================================================================
// 4. RENDERING & FILTERING
// ==========================================================================
function setPipelineFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
    renderBookingsList();
}

function handleSearch(query) {
    searchQuery = (query || '').toLowerCase().trim();
    renderBookingsList();
}

function renderBookingsList() {
    const container = document.getElementById('bookingsListContainer');
    if (!container) return;

    let filtered = currentBookings.filter(b => {
        if (activeFilter === 'PENDING' && b.status !== 'PENDING_APPROVAL') return false;
        if (activeFilter === 'OFFERS' && b.status !== 'OFFER_SENT') return false;
        if (activeFilter === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
        if (activeFilter === 'DECLINED' && b.status !== 'DECLINED') return false;

        if (searchQuery) {
            const matchName = (b.guestName || '').toLowerCase().includes(searchQuery);
            const matchPhone = (b.phone || '').toLowerCase().includes(searchQuery);
            const matchEmail = (b.email || '').toLowerCase().includes(searchQuery);
            const matchId = (b.id || '').toLowerCase().includes(searchQuery);
            return matchName || matchPhone || matchEmail || matchId;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="background:#151411;border:1px dashed var(--border);border-radius:8px;padding:3rem 2rem;text-align:center;">
                <p style="color:var(--text-muted);font-size:1rem;margin-bottom:1rem;">No reservations found matching this filter.</p>
                <button class="btn-admin btn-admin-secondary" onclick="setPipelineFilter('ALL')">Clear Filters</button>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(b => generateBookingCardHtml(b)).join('');
}

function generateBookingCardHtml(b) {
    const statusClassMap = {
        'PENDING_APPROVAL': 'status-pending',
        'OFFER_SENT': 'status-offer',
        'CONFIRMED': 'status-confirmed',
        'DECLINED': 'status-declined'
    };

    const statusLabelMap = {
        'PENDING_APPROVAL': 'Pending Approval',
        'OFFER_SENT': 'Offer Sent',
        'CONFIRMED': 'Confirmed & Paid',
        'DECLINED': 'Declined'
    };

    const statusClass = statusClassMap[b.status] || 'status-pending';
    const statusLabel = statusLabelMap[b.status] || b.status;

    // Relative created time
    const createdDate = new Date(b.createdAt);
    const dateFormatted = createdDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Financial calculations
    const displayTotal = b.offer ? b.offer.finalOfferTotal : b.estimatedTotal;
    const advanceAmount = b.offer ? b.offer.advancePayable : Math.round(displayTotal * 0.5);

    // Clean phone number for WhatsApp
    const rawPhone = (b.phone || '').replace(/[^0-9]/g, '');
    const waPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    // Payment link
    const paymentUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}payment.html?id=${b.id}`;

    // Addons tags
    const addonsHtml = (b.addons && b.addons.length > 0)
        ? b.addons.map(a => `<span class="addon-pill">${a}</span>`).join('')
        : '<span style="font-size:0.75rem;color:var(--text-muted);">No extra add-ons requested</span>';

    // Actions depending on status
    let actionButtons = '';
    if (b.status === 'PENDING_APPROVAL') {
        actionButtons = `
            <button class="btn-admin btn-admin-outline" onclick="declineBooking('${b.id}')">Decline</button>
            <button class="btn-admin btn-admin-primary" onclick="openOfferModal('${b.id}')">
                ✨ Approve &amp; Create Offer &rarr;
            </button>
        `;
    } else if (b.status === 'OFFER_SENT') {
        const waOfferMsg = `*Elysian Heights - Homestay Booking Offer Approved!* 🏔️\n` +
                           `Dear ${b.guestName},\n` +
                           `Your reservation request (Ref: ${b.id}) has been approved!\n` +
                           `Stay: ${b.checkIn} to ${b.checkOut} (${b.nights} Nights)\n` +
                           `Total Offer: ₹${displayTotal.toLocaleString('en-IN')}\n` +
                           `Advance Required (50%): ₹${advanceAmount.toLocaleString('en-IN')}\n` +
                           (b.offer?.hostNotes ? `Host Note: "${b.offer.hostNotes}"\n` : '') +
                           `\n👉 Review your offer and complete payment here:\n${paymentUrl}`;

        actionButtons = `
            <button class="btn-admin btn-admin-outline" onclick="copyPaymentLink('${paymentUrl}')">Copy Payment Link</button>
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waOfferMsg)}" target="_blank" class="btn-admin btn-admin-secondary" style="border-color:#25d366;color:#25d366;">
                💬 Send on WhatsApp
            </a>
            <button class="btn-admin btn-admin-primary" style="background:#10b981;color:#fff;" onclick="openConfirmPaymentModal('${b.id}')">
                ✓ Confirm Payment Received
            </button>
        `;
    } else if (b.status === 'CONFIRMED') {
        const waConfirmMsg = `*Elysian Heights - Booking Confirmed!* 🎉\n` +
                             `Dear ${b.guestName}, we have received your payment of ₹${(b.payment?.amountPaid || advanceAmount).toLocaleString('en-IN')}.\n` +
                             `Your luxury homestay reservation (${b.id}) is officially secured!\n` +
                             `Check-in: ${b.checkIn} (from 2:00 PM)\n` +
                             `Location: Idukki, Kerala (Periyar River Bluff)\n` +
                             `Caretaker Contact: +91 98765 43210\n` +
                             `\nView your official stay voucher here:\n${paymentUrl}`;

        actionButtons = `
            <a href="${paymentUrl}" target="_blank" class="btn-admin btn-admin-outline">View Stay Voucher</a>
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waConfirmMsg)}" target="_blank" class="btn-admin btn-admin-secondary" style="border-color:#25d366;color:#25d366;">
                💬 Send Voucher on WhatsApp
            </a>
        `;
    } else if (b.status === 'DECLINED') {
        actionButtons = `
            <button class="btn-admin btn-admin-outline" onclick="reopenBooking('${b.id}')">Reopen Request</button>
        `;
    }

    return `
        <div class="booking-item-card" id="card-${b.id}">
            <div class="booking-card-top">
                <div class="booking-meta-left">
                    <span class="booking-id-tag">${b.id}</span>
                    <span class="booking-time-ago">${dateFormatted}</span>
                </div>
                <div class="status-badge ${statusClass}">
                    ● ${statusLabel}
                </div>
            </div>

            <div class="booking-card-grid">
                <!-- Guest Column -->
                <div class="guest-info-block">
                    <h4>${b.guestName}</h4>
                    <div class="guest-contact-links">
                        <a href="https://wa.me/${waPhone}" target="_blank">📱 ${b.phone} (WhatsApp)</a>
                        <a href="mailto:${b.email}">✉️ ${b.email}</a>
                        ${b.notes ? `<p style="font-size:0.8rem;color:#b4b4b0;margin-top:0.35rem;font-style:italic;">"${b.notes}"</p>` : ''}
                    </div>
                </div>

                <!-- Stay Details Column -->
                <div class="stay-info-block">
                    <div class="stay-dates-line">📅 ${b.checkIn} &rarr; ${b.checkOut} (${b.nights} Nights)</div>
                    <div class="stay-badge-party">👥 ${b.adults} Adults${b.children > 0 ? ', ' + b.children + ' Children' : ''} &bull; Entire 4 BHK Estate</div>
                    <div class="addons-tag-list">
                        ${addonsHtml}
                    </div>
                </div>

                <!-- Financial Column -->
                <div class="financial-block">
                    <div class="financial-sub">${b.offer ? 'Approved Offer Total' : 'Estimated Fare'}</div>
                    <div class="financial-total">₹${displayTotal.toLocaleString('en-IN')}</div>
                    <div class="financial-sub">50% Advance: ₹${advanceAmount.toLocaleString('en-IN')}</div>
                    ${b.payment ? `<div style="font-size:0.75rem;color:#10b981;margin-top:0.25rem;">Paid: ₹${b.payment.amountPaid.toLocaleString('en-IN')} (${b.payment.method})</div>` : ''}
                </div>
            </div>

            <!-- Actions Row -->
            <div class="booking-card-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

// ==========================================================================
// 5. APPROVE & CREATE OFFER MODAL
// ==========================================================================
function openOfferModal(bookingId) {
    const b = currentBookings.find(x => x.id === bookingId);
    if (!b) return;

    activeBookingIdForOffer = bookingId;
    document.getElementById('offerModalRef').innerText = b.id;
    document.getElementById('offerModalGuest').innerText = b.guestName;
    document.getElementById('offerModalDates').innerText = `${b.checkIn} to ${b.checkOut} (${b.nights} Nights)`;

    // Defaults
    document.getElementById('offerRatePerNight').value = 28000;
    document.getElementById('offerDiscountPercent').value = 5;
    document.getElementById('offerAdvancePercent').value = 50;
    document.getElementById('offerCustomNotes').value = `Dear ${b.guestName.split(' ')[0]}, we are delighted to approve your reservation! We have arranged a complimentary plantation walk and evening tea by the river for your group.`;

    recalcOfferModal();
    document.getElementById('createOfferModal').classList.add('active');
}

function closeOfferModal() {
    document.getElementById('createOfferModal').classList.remove('active');
    activeBookingIdForOffer = null;
}

function recalcOfferModal() {
    const b = currentBookings.find(x => x.id === activeBookingIdForOffer);
    if (!b) return;

    const rate = parseFloat(document.getElementById('offerRatePerNight').value) || 28000;
    const discountPct = parseFloat(document.getElementById('offerDiscountPercent').value) || 0;
    const advancePct = parseFloat(document.getElementById('offerAdvancePercent').value) || 50;

    const baseFare = rate * b.nights;
    const discountAmt = Math.round(baseFare * (discountPct / 100));
    const subtotalAfterDisc = baseFare - discountAmt;

    // Calculate addons if any
    const addonsEstimate = (b.estimatedTotal > (28000 * b.nights)) ? (b.estimatedTotal - (28000 * b.nights)) : 0;
    const finalTotal = subtotalAfterDisc + addonsEstimate;
    const advancePayable = Math.round(finalTotal * (advancePct / 100));
    const balanceDue = finalTotal - advancePayable;

    document.getElementById('modalPreviewBase').innerText = `₹${baseFare.toLocaleString('en-IN')}`;
    document.getElementById('modalPreviewDiscount').innerText = discountPct > 0 ? `-₹${discountAmt.toLocaleString('en-IN')} (${discountPct}%)` : 'None';
    document.getElementById('modalPreviewAddons').innerText = addonsEstimate > 0 ? `+₹${addonsEstimate.toLocaleString('en-IN')}` : 'Included';
    document.getElementById('modalPreviewFinalTotal').innerText = `₹${finalTotal.toLocaleString('en-IN')}`;
    document.getElementById('modalPreviewAdvance').innerText = `₹${advancePayable.toLocaleString('en-IN')} (${advancePct}%)`;
    document.getElementById('modalPreviewBalance').innerText = `₹${balanceDue.toLocaleString('en-IN')}`;
}

function saveAndSendOffer() {
    const b = currentBookings.find(x => x.id === activeBookingIdForOffer);
    if (!b) return;

    const rate = parseFloat(document.getElementById('offerRatePerNight').value) || 28000;
    const discountPct = parseFloat(document.getElementById('offerDiscountPercent').value) || 0;
    const advancePct = parseFloat(document.getElementById('offerAdvancePercent').value) || 50;
    const hostNotes = (document.getElementById('offerCustomNotes').value || '').trim();

    const baseFare = rate * b.nights;
    const discountAmt = Math.round(baseFare * (discountPct / 100));
    const addonsEstimate = (b.estimatedTotal > (28000 * b.nights)) ? (b.estimatedTotal - (28000 * b.nights)) : 0;
    const finalTotal = baseFare - discountAmt + addonsEstimate;
    const advancePayable = Math.round(finalTotal * (advancePct / 100));
    const balanceDue = finalTotal - advancePayable;

    // Attach Offer
    b.status = 'OFFER_SENT';
    b.offer = {
        offeredRatePerNight: rate,
        discountPercent: discountPct,
        finalOfferTotal: finalTotal,
        advancePayable: advancePayable,
        balanceOnArrival: balanceDue,
        hostNotes: hostNotes,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 2).toISOString() // 48h
    };

    saveBookings(currentBookings);
    closeOfferModal();
    loadDashboard();

    // Show quick confirmation alert
    alert(`Offer successfully created for ${b.guestName}! Booking status updated to 'Offer Sent'. You can now dispatch the link on WhatsApp.`);
}

// ==========================================================================
// 6. CONFIRM PAYMENT RECEIVED MODAL
// ==========================================================================
function openConfirmPaymentModal(bookingId) {
    const b = currentBookings.find(x => x.id === bookingId);
    if (!b) return;

    activeBookingIdForPayment = bookingId;
    const dueAmount = b.offer ? b.offer.advancePayable : Math.round(b.estimatedTotal * 0.5);

    document.getElementById('payModalRef').innerText = b.id;
    document.getElementById('payModalGuest').innerText = b.guestName;
    document.getElementById('payModalAmount').value = dueAmount;
    document.getElementById('payModalMethod').value = 'UPI';
    document.getElementById('payModalUtr').value = 'UPI/' + Math.floor(100000 + Math.random() * 900000);

    document.getElementById('confirmPaymentModal').classList.add('active');
}

function closeConfirmPaymentModal() {
    document.getElementById('confirmPaymentModal').classList.remove('active');
    activeBookingIdForPayment = null;
}

function recordPaymentAndConfirm() {
    const b = currentBookings.find(x => x.id === activeBookingIdForPayment);
    if (!b) return;

    const amount = parseFloat(document.getElementById('payModalAmount').value) || 0;
    const method = document.getElementById('payModalMethod').value;
    const utr = (document.getElementById('payModalUtr').value || '').trim();

    b.status = 'CONFIRMED';
    b.payment = {
        method: method,
        reference: utr || 'OFFLINE_APPROVAL',
        amountPaid: amount,
        paidAt: new Date().toISOString()
    };

    saveBookings(currentBookings);
    closeConfirmPaymentModal();
    loadDashboard();

    alert(`Payment recorded! Reservation ${b.id} is now Confirmed & Paid.`);
}

// Decline / Reopen
function declineBooking(id) {
    if (!confirm('Are you sure you want to decline this booking request?')) return;
    const b = currentBookings.find(x => x.id === id);
    if (b) {
        b.status = 'DECLINED';
        saveBookings(currentBookings);
        loadDashboard();
    }
}

function reopenBooking(id) {
    const b = currentBookings.find(x => x.id === id);
    if (b) {
        b.status = 'PENDING_APPROVAL';
        saveBookings(currentBookings);
        loadDashboard();
    }
}

// Utility: Copy Link
function copyPaymentLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('Payment & Offer link copied to clipboard:\n' + url);
    }).catch(() => {
        prompt('Copy this Offer & Payment link:', url);
    });
}

// ==========================================================================
// 7. CREATE DIRECT MANUAL OFFER (OFFLINE / PHONE INQUIRY)
// ==========================================================================
function openManualOfferModal() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 3);

    const fmt = d => d.toISOString().split('T')[0];

    document.getElementById('manualCheckIn').value = fmt(tomorrow);
    document.getElementById('manualCheckOut').value = fmt(dayAfter);
    document.getElementById('manualOfferModal').classList.add('active');
}

function closeManualOfferModal() {
    document.getElementById('manualOfferModal').classList.remove('active');
}

function handleCreateManualOffer(event) {
    event.preventDefault();
    const name = document.getElementById('manualName').value.trim();
    const phone = document.getElementById('manualPhone').value.trim();
    const email = document.getElementById('manualEmail').value.trim();
    const checkIn = document.getElementById('manualCheckIn').value;
    const checkOut = document.getElementById('manualCheckOut').value;
    const adults = document.getElementById('manualAdults').value;
    const totalAmount = parseFloat(document.getElementById('manualTotal').value) || 56000;
    const advanceAmount = parseFloat(document.getElementById('manualAdvance').value) || Math.round(totalAmount * 0.5);
    const notes = document.getElementById('manualNotes').value.trim();

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const nights = Math.max(1, Math.ceil((outDate - inDate) / 86400000));

    const bookingId = `EH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
        id: bookingId,
        guestName: name,
        phone: phone,
        email: email,
        checkIn: checkIn,
        checkOut: checkOut,
        nights: nights,
        adults: adults,
        children: 0,
        villaType: 'Entire 4 BHK Hilltop Villa',
        addons: ['Direct Host Custom Package'],
        notes: notes,
        estimatedTotal: totalAmount,
        status: 'OFFER_SENT',
        createdAt: new Date().toISOString(),
        offer: {
            offeredRatePerNight: Math.round(totalAmount / nights),
            discountPercent: 0,
            finalOfferTotal: totalAmount,
            advancePayable: advanceAmount,
            balanceOnArrival: totalAmount - advanceAmount,
            hostNotes: notes || 'Direct custom offer created by host.',
            sentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * 2).toISOString()
        },
        payment: null
    };

    currentBookings.unshift(newBooking);
    saveBookings(currentBookings);
    closeManualOfferModal();
    loadDashboard();

    const paymentUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}payment.html?id=${bookingId}`;
    copyPaymentLink(paymentUrl);
}

// ==========================================================================
// 8. DATA BACKUP & RESTORE
// ==========================================================================
function exportBackupJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentBookings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `elysian_bookings_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
}

function importBackupJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                saveBookings(parsed);
                loadDashboard();
                alert(`Successfully restored ${parsed.length} bookings from backup.`);
            } else {
                alert('Invalid backup file format.');
            }
        } catch (err) {
            alert('Error parsing JSON backup file.');
        }
    };
    reader.readAsText(file);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
});
