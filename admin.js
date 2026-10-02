/**
 * Destination Periyar - Host Administration Portal Logic
 * Designed for effortless travel booking management, quick approvals, and host operations
 */

const STORAGE_KEY = 'destination_periyar_bookings';
const LEGACY_STORAGE_KEY = 'elysian_homestay_bookings';

let currentBookings = [];
let activeFilter = 'ALL';
let searchQuery = '';
let activeSort = 'created_desc';
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

    if (sessionStorage.getItem('dp_admin_auth') === 'true' || sessionStorage.getItem('eh_admin_auth') === 'true') {
        if (lockOverlay) lockOverlay.style.display = 'none';
        loadDashboard();
        return;
    }

    if (pinForm) {
        pinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = (pinInput.value || '').trim().toLowerCase();
            // Accepts 2026, joe, or periyar
            if (val === '2026' || val === 'joe' || val === 'periyar') {
                sessionStorage.setItem('dp_admin_auth', 'true');
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
    sessionStorage.removeItem('dp_admin_auth');
    sessionStorage.removeItem('eh_admin_auth');
    window.location.reload();
}

// ==========================================================================
// 2. DATA MANAGEMENT (LOCALSTORAGE & SEED DATA)
// ==========================================================================
function fetchBookings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        let list = raw ? JSON.parse(raw) : [];

        // If no bookings stored yet, initialize with demo travel bookings
        if (!list || list.length === 0) {
            list = [
                {
                    id: 'DP-2026-7241',
                    guestName: 'David & Sarah Jenkins',
                    phone: '+44 7911 123456',
                    email: 'david.jenkins@uktravel.com',
                    checkIn: '2026-10-18',
                    checkOut: '2026-10-21',
                    nights: 3,
                    adults: 6,
                    children: 2,
                    villaType: 'Entire 4 BHK Hilltop Villa',
                    addons: ['Personal Cook & Kerala Meals', 'Sunset Terrace Barbecue Setup'],
                    notes: 'Celebrating 25th wedding anniversary with family. Vegetarian & coastal seafood preferences.',
                    estimatedTotal: 95000,
                    status: 'PENDING_APPROVAL',
                    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
                    offer: null,
                    payment: null
                },
                {
                    id: 'DP-2026-6184',
                    guestName: 'Dr. Rajesh Kumar',
                    phone: '+91 98401 23456',
                    email: 'rajesh.kumar@healthplus.org',
                    checkIn: '2026-10-24',
                    checkOut: '2026-10-26',
                    nights: 2,
                    adults: 8,
                    children: 0,
                    villaType: 'Entire 4 BHK Hilltop Villa',
                    addons: ['Guided River & Plantation Trek', 'Cochin Airport Chauffeur Transfer'],
                    notes: 'Executive leadership retreat. Need high-speed Wi-Fi in the main lounge.',
                    estimatedTotal: 62000,
                    status: 'OFFER_SENT',
                    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
                    offer: {
                        offeredRatePerNight: 26000,
                        discountPercent: 7,
                        finalOfferTotal: 58000,
                        advancePayable: 29000,
                        balanceOnArrival: 29000,
                        hostNotes: 'Delighted to host your executive leadership team! Arranged complimentary sunset coffee and fruit basket.',
                        expiresAt: new Date(Date.now() + 3600000 * 36).toISOString(),
                        sentAt: new Date(Date.now() - 3600000 * 18).toISOString()
                    },
                    payment: null
                },
                {
                    id: 'DP-2026-5092',
                    guestName: 'Ananya & Rohan Varma',
                    phone: '+91 98200 98765',
                    email: 'ananya.varma@designstudio.in',
                    checkIn: '2026-11-05',
                    checkOut: '2026-11-09',
                    nights: 4,
                    adults: 10,
                    children: 2,
                    villaType: 'Entire 4 BHK Hilltop Villa',
                    addons: ['Personal Cook & Kerala Meals', 'Sunset Terrace Barbecue Setup', 'Guided River & Plantation Trek'],
                    notes: 'Extended family vacation. Requesting baby cot for one suite.',
                    estimatedTotal: 127000,
                    status: 'CONFIRMED',
                    createdAt: new Date(Date.now() - 3600000 * 68).toISOString(),
                    offer: {
                        offeredRatePerNight: 27000,
                        discountPercent: 4,
                        finalOfferTotal: 122000,
                        advancePayable: 61000,
                        balanceOnArrival: 61000,
                        hostNotes: 'Confirmed 4 nights for family stay. Chef Thomas assigned for traditional Sadya & coastal seafood.',
                        expiresAt: new Date(Date.now() + 3600000 * 120).toISOString(),
                        sentAt: new Date(Date.now() - 3600000 * 60).toISOString()
                    },
                    payment: {
                        method: 'UPI',
                        reference: 'UPI/2026/894201',
                        amountPaid: 61000,
                        paidAt: new Date(Date.now() - 3600000 * 48).toISOString()
                    }
                }
            ];
            saveBookings(list);
        }
        return list;
    } catch (e) {
        console.error('Error fetching bookings:', e);
        return [];
    }
}

function saveBookings(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        // Keep backwards compatibility
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(list));
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
    const completed = currentBookings.filter(b => b.status === 'COMPLETED').length;

    let revenue = 0;
    currentBookings.forEach(b => {
        if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
            const amt = b.payment?.amountPaid || b.offer?.finalOfferTotal || b.estimatedTotal || 0;
            revenue += amt;
        }
    });

    const setEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setEl('metricTotal', total);
    setEl('metricPending', pending);
    setEl('metricOffers', offers);
    setEl('metricConfirmed', confirmed);
    setEl('metricRevenue', `₹${revenue.toLocaleString('en-IN')}`);

    // Tab badges
    setEl('badgeAll', total);
    setEl('badgePending', pending);
    setEl('badgeOffers', offers);
    setEl('badgeConfirmed', confirmed);
    setEl('badgeCompleted', completed);
}

// ==========================================================================
// 4. SORTING & FILTERING
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

function handleSortChange(sortKey) {
    activeSort = sortKey;
    renderBookingsList();
}

// Calculate Stay Urgency & Timeline Badge
function getStayTimelineBadge(b) {
    if (!b.checkIn) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInDate = new Date(b.checkIn);
    checkInDate.setHours(0, 0, 0, 0);

    const checkOutDate = new Date(b.checkOut || b.checkIn);
    checkOutDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((checkInDate - today) / (1000 * 60 * 60 * 24));

    if (b.status === 'COMPLETED' || today > checkOutDate) {
        return '<span class="timeline-badge past">Checked Out</span>';
    }

    if (today >= checkInDate && today <= checkOutDate) {
        return '<span class="timeline-badge in-house">🏡 Guest In-House</span>';
    }

    if (diffDays === 0) {
        return '<span class="timeline-badge today">🔥 Check-in TODAY</span>';
    } else if (diffDays === 1) {
        return '<span class="timeline-badge tomorrow">⚡ Check-in Tomorrow</span>';
    } else if (diffDays > 1 && diffDays <= 7) {
        return `<span class="timeline-badge soon">⏳ In ${diffDays} Days</span>`;
    } else if (diffDays > 7 && diffDays <= 30) {
        const weeks = Math.round(diffDays / 7);
        return `<span class="timeline-badge upcoming">📅 In ~${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}</span>`;
    } else if (diffDays > 30) {
        return `<span class="timeline-badge upcoming">📅 ${b.checkIn}</span>`;
    }

    return '';
}

// ==========================================================================
// 5. RENDERING BOOKINGS LIST
// ==========================================================================
function renderBookingsList() {
    const container = document.getElementById('bookingsListContainer');
    if (!container) return;

    let filtered = currentBookings.filter(b => {
        if (activeFilter === 'PENDING' && b.status !== 'PENDING_APPROVAL') return false;
        if (activeFilter === 'OFFERS' && b.status !== 'OFFER_SENT') return false;
        if (activeFilter === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
        if (activeFilter === 'COMPLETED' && b.status !== 'COMPLETED') return false;
        if (activeFilter === 'DECLINED' && b.status !== 'DECLINED') return false;

        if (searchQuery) {
            const matchName = (b.guestName || '').toLowerCase().includes(searchQuery);
            const matchPhone = (b.phone || '').toLowerCase().includes(searchQuery);
            const matchEmail = (b.email || '').toLowerCase().includes(searchQuery);
            const matchId = (b.id || '').toLowerCase().includes(searchQuery);
            const matchCheckIn = (b.checkIn || '').toLowerCase().includes(searchQuery);
            return matchName || matchPhone || matchEmail || matchId || matchCheckIn;
        }
        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (activeSort === 'checkin_asc') {
            return new Date(a.checkIn || 0) - new Date(b.checkIn || 0);
        } else if (activeSort === 'revenue_desc') {
            const revA = a.offer?.finalOfferTotal || a.estimatedTotal || 0;
            const revB = b.offer?.finalOfferTotal || b.estimatedTotal || 0;
            return revB - revA;
        } else {
            // created_desc default
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state-box">
                <div style="font-size:2.5rem;margin-bottom:0.75rem;">📋</div>
                <h4 style="color:#fff;margin-bottom:0.5rem;font-size:1.15rem;">No Reservations Found</h4>
                <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:1.25rem;">
                    ${searchQuery ? `No reservations matching "${searchQuery}".` : 'No bookings in this pipeline stage.'}
                </p>
                <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
                    <button class="btn-admin btn-admin-secondary" onclick="setPipelineFilter('ALL');document.querySelector('.search-box input').value='';searchQuery='';">Clear Filters</button>
                    <button class="btn-admin btn-admin-primary" onclick="openManualOfferModal()">+ Create Direct Offer</button>
                </div>
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
        'COMPLETED': 'status-completed',
        'DECLINED': 'status-declined'
    };

    const statusClass = statusClassMap[b.status] || 'status-pending';

    // Relative created time
    const createdDate = new Date(b.createdAt);
    const dateFormatted = createdDate.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Stay urgency tag
    const timelineBadge = getStayTimelineBadge(b);

    // Financial calculations
    const displayTotal = b.offer ? b.offer.finalOfferTotal : b.estimatedTotal;
    const advanceAmount = b.offer ? b.offer.advancePayable : Math.round(displayTotal * 0.5);

    // Clean phone number for WhatsApp and Tel
    const rawPhone = (b.phone || '').replace(/[^0-9]/g, '');
    const waPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const telPhone = b.phone || '';

    // Direct Payment / Voucher Link
    const paymentUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}payment.html?id=${b.id}`;

    // Addons tags
    const addonsHtml = (b.addons && b.addons.length > 0)
        ? b.addons.map(a => `<span class="addon-pill">${a}</span>`).join('')
        : '<span style="font-size:0.78rem;color:var(--text-muted);">Standard Inclusions Only</span>';

    // WhatsApp Message Templates for Destination Periyar
    const waOfferMsg = `*Destination Periyar - Homestay Booking Offer Approved!* 🌿\n\n` +
                       `Dear ${b.guestName},\n` +
                       `We are pleased to approve your stay request (Ref: *${b.id}*)!\n\n` +
                       `📅 *Dates:* ${b.checkIn} to ${b.checkOut} (${b.nights} Nights)\n` +
                       `👥 *Party:* ${b.adults} Adults${b.children > 0 ? ', ' + b.children + ' Children' : ''} (Entire 4 BHK Private Estate)\n` +
                       `💰 *Total Stay Tariff:* ₹${displayTotal.toLocaleString('en-IN')}\n` +
                       `🔒 *Advance to Secure (50%):* ₹${advanceAmount.toLocaleString('en-IN')}\n` +
                       (b.offer?.hostNotes ? `\n📝 *Host Note:* "${b.offer.hostNotes}"\n` : '') +
                       `\n👉 *Review your offer and complete advance payment here:*\n${paymentUrl}\n\n` +
                       `We look forward to hosting you at Destination Periyar!`;

    const waConfirmMsg = `*Destination Periyar - Booking Confirmed!* 🎉\n\n` +
                         `Dear ${b.guestName},\n` +
                         `We have received your payment of ₹${(b.payment?.amountPaid || advanceAmount).toLocaleString('en-IN')}.\n` +
                         `Your exclusive reservation (*${b.id}*) is officially confirmed!\n\n` +
                         `📅 *Check-In:* ${b.checkIn} (from 2:00 PM)\n` +
                         `📅 *Check-Out:* ${b.checkOut} (until 11:00 AM)\n` +
                         `📍 *Location:* Destination Periyar, Periyar River Bluff, Idukki Highlands, Kerala\n` +
                         `📞 *Caretaker Contact:* +91 98765 43210 (Mr. Thomas)\n\n` +
                         `📄 *View your official Stay Voucher & Pass here:*\n${paymentUrl}`;

    // Smart Action Buttons based on Status
    let actionButtons = '';

    if (b.status === 'PENDING_APPROVAL') {
        actionButtons = `
            <button class="btn-admin btn-admin-quick-approve" onclick="quickApproveBooking('${b.id}')" title="Approve immediately with standard 50% advance">
                ⚡ 1-Click Approve (50% Advance)
            </button>
            <button class="btn-admin btn-admin-primary" onclick="openOfferModal('${b.id}')" title="Customise tariff, give special discounts or custom notes">
                ✏️ Custom Offer
            </button>
            <a href="tel:${telPhone}" class="btn-admin btn-admin-outline" title="Call guest directly">
                📞 Call
            </a>
            <button class="btn-admin btn-admin-outline btn-decline" onclick="declineBooking('${b.id}')" title="Decline request">
                Decline
            </button>
        `;
    } else if (b.status === 'OFFER_SENT') {
        actionButtons = `
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waOfferMsg)}" target="_blank" class="btn-admin btn-admin-whatsapp" title="Send offer directly to guest WhatsApp">
                💬 Send Offer via WhatsApp
            </a>
            <button class="btn-admin btn-admin-primary btn-record-pay" onclick="openConfirmPaymentModal('${b.id}')" title="Mark advance payment as received">
                ✓ Record Payment
            </button>
            <button class="btn-admin btn-admin-outline" onclick="copyPaymentLink('${paymentUrl}', this)">
                🔗 Copy Link
            </button>
            <button class="btn-admin btn-admin-outline" onclick="openOfferModal('${b.id}')" title="Edit offer rates">
                ✏️ Edit Offer
            </button>
            <a href="tel:${telPhone}" class="btn-admin btn-admin-outline" title="Call guest">
                📞 Call
            </a>
        `;
    } else if (b.status === 'CONFIRMED') {
        actionButtons = `
            <a href="${paymentUrl}" target="_blank" class="btn-admin btn-admin-outline" title="Open guest voucher">
                📄 View Voucher
            </a>
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(waConfirmMsg)}" target="_blank" class="btn-admin btn-admin-whatsapp" title="Send official voucher on WhatsApp">
                💬 Send Voucher on WhatsApp
            </a>
            <button class="btn-admin btn-admin-secondary" onclick="quickUpdateStatus('${b.id}', 'COMPLETED')" title="Mark guest stay as completed">
                🏠 Mark Stay Completed
            </button>
            <a href="tel:${telPhone}" class="btn-admin btn-admin-outline" title="Call guest">
                📞 Call
            </a>
        `;
    } else if (b.status === 'COMPLETED') {
        actionButtons = `
            <a href="${paymentUrl}" target="_blank" class="btn-admin btn-admin-outline">
                📄 View Voucher
            </a>
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent('Hello ' + b.guestName + '! Thank you for staying with us at Destination Periyar. We hope you had a memorable retreat!')}" target="_blank" class="btn-admin btn-admin-outline" style="border-color:#25d366;color:#25d366;">
                ⭐ Request Review
            </a>
            <button class="btn-admin btn-admin-outline" onclick="quickUpdateStatus('${b.id}', 'CONFIRMED')">
                🔄 Reopen Stay
            </button>
            <button class="btn-admin btn-admin-outline" style="color:#ef4444;" onclick="deleteBooking('${b.id}')">
                🗑️ Archive
            </button>
        `;
    } else if (b.status === 'DECLINED') {
        actionButtons = `
            <button class="btn-admin btn-admin-outline" onclick="reopenBooking('${b.id}')">
                🔄 Reopen Request
            </button>
            <button class="btn-admin btn-admin-outline" style="color:#ef4444;" onclick="deleteBooking('${b.id}')">
                🗑️ Delete
            </button>
        `;
    }

    return `
        <div class="booking-item-card" id="card-${b.id}">
            <!-- Top Bar: Reference, Timeline, and Instant Status Switcher -->
            <div class="booking-card-top">
                <div class="booking-meta-left">
                    <span class="booking-id-tag">${b.id}</span>
                    ${timelineBadge}
                    <span class="booking-time-ago" title="Requested at ${b.createdAt}">🕒 ${dateFormatted}</span>
                </div>

                <div class="booking-meta-right">
                    <label class="status-quick-label" title="Change status instantly">Status:</label>
                    <select class="status-select-inline ${statusClass}" onchange="quickUpdateStatus('${b.id}', this.value)">
                        <option value="PENDING_APPROVAL" ${b.status === 'PENDING_APPROVAL' ? 'selected' : ''}>⏳ Pending Approval</option>
                        <option value="OFFER_SENT" ${b.status === 'OFFER_SENT' ? 'selected' : ''}>📨 Offer Sent</option>
                        <option value="CONFIRMED" ${b.status === 'CONFIRMED' ? 'selected' : ''}>✓ Confirmed &amp; Paid</option>
                        <option value="COMPLETED" ${b.status === 'COMPLETED' ? 'selected' : ''}>🏠 Completed</option>
                        <option value="DECLINED" ${b.status === 'DECLINED' ? 'selected' : ''}>✕ Declined</option>
                    </select>
                </div>
            </div>

            <!-- Main Information Grid (Responsive) -->
            <div class="booking-card-grid">
                <!-- Guest Column -->
                <div class="guest-info-block">
                    <div class="card-section-label">Guest Information</div>
                    <h4 class="guest-name">${b.guestName}</h4>
                    <div class="guest-contact-links">
                        <a href="https://wa.me/${waPhone}" target="_blank" class="contact-link whatsapp" title="Chat on WhatsApp">
                            <span class="contact-icon">📱</span> ${b.phone}
                        </a>
                        <a href="mailto:${b.email}" class="contact-link email" title="Send Email">
                            <span class="contact-icon">✉️</span> ${b.email}
                        </a>
                        ${b.notes ? `
                            <div class="guest-note-box">
                                <span class="note-quote">“</span>${b.notes}<span class="note-quote">”</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Stay Details Column -->
                <div class="stay-info-block">
                    <div class="card-section-label">Stay Details</div>
                    <div class="stay-dates-line">
                        <span class="stay-calendar-icon">📅</span>
                        <strong>${b.checkIn}</strong> &rarr; <strong>${b.checkOut}</strong>
                        <span class="nights-pill">${b.nights} ${b.nights === 1 ? 'Night' : 'Nights'}</span>
                    </div>
                    <div class="stay-badge-party">
                        👥 <strong>${b.adults} Adults</strong>${b.children > 0 ? `, <strong>${b.children} Children</strong>` : ''} &bull; Entire 4 BHK Villa
                    </div>
                    <div class="addons-tag-list">
                        ${addonsHtml}
                    </div>
                </div>

                <!-- Financial Column -->
                <div class="financial-block">
                    <div class="card-section-label">Tariff &amp; Payment</div>
                    <div class="financial-sub">${b.offer ? 'Approved Offer Total' : 'Estimated Stay Tariff'}</div>
                    <div class="financial-total">₹${displayTotal.toLocaleString('en-IN')}</div>
                    
                    <div class="financial-advance-row">
                        <span>Advance Required:</span>
                        <strong>₹${advanceAmount.toLocaleString('en-IN')}</strong>
                    </div>

                    ${b.payment ? `
                        <div class="payment-settled-badge">
                            <span class="pay-check">✓</span> Paid: ₹${b.payment.amountPaid.toLocaleString('en-IN')} via ${b.payment.method}
                            <div style="font-size:0.7rem;color:var(--text-muted);font-family:monospace;margin-top:0.2rem;">Ref: ${b.payment.reference}</div>
                        </div>
                    ` : (b.status === 'OFFER_SENT' ? `
                        <div class="payment-pending-badge">
                            ⏳ Waiting for Guest Advance
                        </div>
                    ` : '')}
                </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="booking-card-actions">
                ${actionButtons}
            </div>
        </div>
    `;
}

// ==========================================================================
// 6. QUICK 1-CLICK ACTIONS (EASY BOOKING MANAGEMENT)
// ==========================================================================

// 1-Click Instant Approve (Standard 50% Advance)
function quickApproveBooking(bookingId) {
    const b = currentBookings.find(x => x.id === bookingId);
    if (!b) return;

    const rate = Math.round(b.estimatedTotal / Math.max(1, b.nights));
    const finalTotal = b.estimatedTotal;
    const advancePayable = Math.round(finalTotal * 0.5);
    const balanceDue = finalTotal - advancePayable;

    b.status = 'OFFER_SENT';
    b.offer = {
        offeredRatePerNight: rate,
        discountPercent: 0,
        finalOfferTotal: finalTotal,
        advancePayable: advancePayable,
        balanceOnArrival: balanceDue,
        hostNotes: `Delighted to approve your stay at Destination Periyar! We have arranged a complimentary plantation walk and evening tea for your group.`,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 2).toISOString()
    };

    saveBookings(currentBookings);
    loadDashboard();

    const paymentUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}payment.html?id=${b.id}`;
    
    // Copy link automatically & show success toast
    if (navigator.clipboard) {
        navigator.clipboard.writeText(paymentUrl).catch(() => {});
    }

    showAdminToast(`⚡ Reservation ${b.id} Approved! Offer sent & link copied.`);
}

// Quick Inline Status Switcher
function quickUpdateStatus(bookingId, newStatus) {
    const b = currentBookings.find(x => x.id === bookingId);
    if (!b) return;

    b.status = newStatus;

    // If marked as confirmed without prior payment record, auto-generate standard receipt
    if (newStatus === 'CONFIRMED' && !b.payment) {
        const adv = b.offer ? b.offer.advancePayable : Math.round(b.estimatedTotal * 0.5);
        b.payment = {
            method: 'Host Direct Approval',
            reference: 'HOST_APPROVED_' + Math.floor(1000 + Math.random() * 9000),
            amountPaid: adv,
            paidAt: new Date().toISOString()
        };
    }

    saveBookings(currentBookings);
    loadDashboard();
    showAdminToast(`Status for ${b.id} updated to ${newStatus.replace('_', ' ')}.`);
}

// Decline & Reopen
function declineBooking(id) {
    if (!confirm('Are you sure you want to decline this booking inquiry?')) return;
    const b = currentBookings.find(x => x.id === id);
    if (b) {
        b.status = 'DECLINED';
        saveBookings(currentBookings);
        loadDashboard();
        showAdminToast(`Booking ${id} marked as Declined.`);
    }
}

function reopenBooking(id) {
    const b = currentBookings.find(x => x.id === id);
    if (b) {
        b.status = 'PENDING_APPROVAL';
        saveBookings(currentBookings);
        loadDashboard();
        showAdminToast(`Booking ${id} reopened.`);
    }
}

// Delete / Archive permanently
function deleteBooking(id) {
    if (!confirm(`Permanently delete booking ${id}? This cannot be undone.`)) return;
    currentBookings = currentBookings.filter(x => x.id !== id);
    saveBookings(currentBookings);
    loadDashboard();
    showAdminToast(`Booking ${id} deleted.`);
}

// Utility: Copy Link with button feedback
function copyPaymentLink(url, btnElement) {
    const copySuccess = () => {
        if (btnElement) {
            const originalText = btnElement.innerText;
            btnElement.innerText = '✓ Copied!';
            btnElement.style.color = '#10b981';
            btnElement.style.borderColor = '#10b981';
            setTimeout(() => {
                btnElement.innerText = originalText;
                btnElement.style.color = '';
                btnElement.style.borderColor = '';
            }, 2200);
        }
        showAdminToast('✓ Offer & Payment link copied to clipboard!');
    };

    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(copySuccess).catch(() => {
            prompt('Copy this Offer & Payment link:', url);
        });
    } else {
        prompt('Copy this Offer & Payment link:', url);
    }
}

// Toast notification helper
function showAdminToast(msg) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'admin-toast';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('visible');
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3200);
}

// ==========================================================================
// 7. APPROVE & CREATE CUSTOM OFFER MODAL
// ==========================================================================
function openOfferModal(bookingId) {
    const b = currentBookings.find(x => x.id === bookingId);
    if (!b) return;

    activeBookingIdForOffer = bookingId;
    document.getElementById('offerModalRef').innerText = b.id;
    document.getElementById('offerModalGuest').innerText = b.guestName;
    document.getElementById('offerModalDates').innerText = `${b.checkIn} to ${b.checkOut} (${b.nights} Nights)`;

    // Existing values or smart defaults
    const currentRate = b.offer ? b.offer.offeredRatePerNight : Math.round(b.estimatedTotal / Math.max(1, b.nights));
    const currentDisc = b.offer ? b.offer.discountPercent : 5;

    document.getElementById('offerRatePerNight').value = currentRate || 28000;
    document.getElementById('offerDiscountPercent').value = currentDisc;
    document.getElementById('offerAdvancePercent').value = 50;
    document.getElementById('offerCustomNotes').value = b.offer?.hostNotes || `Dear ${b.guestName.split(' ')[0]}, we are delighted to approve your reservation! We look forward to welcoming you to Destination Periyar.`;

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

    b.status = 'OFFER_SENT';
    b.offer = {
        offeredRatePerNight: rate,
        discountPercent: discountPct,
        finalOfferTotal: finalTotal,
        advancePayable: advancePayable,
        balanceOnArrival: balanceDue,
        hostNotes: hostNotes,
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 2).toISOString()
    };

    saveBookings(currentBookings);
    closeOfferModal();
    loadDashboard();

    const paymentUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', '')}payment.html?id=${b.id}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(paymentUrl).catch(() => {});
    }

    showAdminToast(`Offer saved for ${b.guestName}! Payment link copied.`);
}

// ==========================================================================
// 8. RECORD PAYMENT RECEIVED MODAL
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

    showAdminToast(`Payment recorded! Reservation ${b.id} is now Confirmed.`);
}

// ==========================================================================
// 9. CREATE DIRECT MANUAL OFFER (OFFLINE / PHONE INQUIRY)
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

    const bookingId = `DP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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
// 10. DATA BACKUP & RESTORE
// ==========================================================================
function exportBackupJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentBookings, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `destination_periyar_bookings_backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    showAdminToast('Backup JSON downloaded successfully.');
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
                showAdminToast(`Successfully imported ${parsed.length} reservations.`);
            } else {
                alert('Invalid backup file format. Must be an array of bookings.');
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
