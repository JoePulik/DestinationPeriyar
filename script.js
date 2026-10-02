/**
 * Destination Periyar - Luxury Hilltop Homestay
 * Core Scripts: Parallax Video, Gallery Lightbox & Homestay Booking Engine
 */

// ==========================================================================
// 1. DATA STORAGE & INITIALIZATION
// ==========================================================================
const STORAGE_KEY = 'destination_periyar_bookings';

function getStoredBookings() {
    try {
        const data = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('elysian_homestay_bookings');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error reading bookings:', e);
        return [];
    }
}

function saveStoredBookings(bookings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
        console.error('Error saving bookings:', e);
    }
}

// Seed sample initial bookings if first time loading
(function seedInitialData() {
    const existing = getStoredBookings();
    if (!existing || existing.length === 0) {
        const seed = [
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
                addons: ['Personal Cook & Kerala Cuisine', 'Sunset Terrace Barbecue'],
                notes: 'Celebrating 25th wedding anniversary with family. Vegetarian & seafood preferences.',
                estimatedTotal: 95000,
                status: 'PENDING_APPROVAL',
                createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
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
                addons: ['Guided River & Plantation Trek', 'Cochin Airport Luxury Chauffeur'],
                notes: 'Executive leadership retreat. Need high-speed Wi-Fi in the main lounge.',
                estimatedTotal: 62000,
                status: 'OFFER_SENT',
                createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
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
                addons: ['Personal Cook & Kerala Cuisine', 'Sunset Terrace Barbecue', 'Guided River & Plantation Trek'],
                notes: 'Extended family vacation. Requesting baby cot for one suite.',
                estimatedTotal: 127000,
                status: 'CONFIRMED',
                createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
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
        saveStoredBookings(seed);
    }
})();

// ==========================================================================
// 2. HOMESTAY BOOKING ENGINE (CALCULATIONS & SUBMISSION)
// ==========================================================================
const BASE_RATE_PER_NIGHT = 28000;
const ADDON_PRICES = {
    cook: { rate: 2500, perNight: true, name: 'Personal Cook & Kerala Meals' },
    bbq: { rate: 3500, perNight: false, name: 'Sunset Terrace Barbecue Setup' },
    trek: { rate: 1500, perNight: false, name: 'Guided River & Plantation Trek' },
    transfer: { rate: 4500, perNight: false, name: 'Cochin Airport Chauffeur Transfer' }
};

function initBookingEngine() {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    if (!checkInInput || !checkOutInput) return;

    // Set default dates: tomorrow and +3 days
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultOut = new Date(today);
    defaultOut.setDate(defaultOut.getDate() + 4);

    const formatDate = (d) => d.toISOString().split('T')[0];

    checkInInput.min = formatDate(tomorrow);
    checkInInput.value = formatDate(tomorrow);

    checkOutInput.min = formatDate(new Date(tomorrow.getTime() + 86400000));
    checkOutInput.value = formatDate(defaultOut);

    // Event listeners
    checkInInput.addEventListener('change', () => {
        const inDate = new Date(checkInInput.value);
        const nextDay = new Date(inDate);
        nextDay.setDate(nextDay.getDate() + 1);
        checkOutInput.min = formatDate(nextDay);
        if (new Date(checkOutInput.value) <= inDate) {
            checkOutInput.value = formatDate(nextDay);
        }
        recalculateFare();
    });

    checkOutInput.addEventListener('change', recalculateFare);

    // Addon checkboxes
    document.querySelectorAll('.addon-card input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', recalculateFare);
    });

    // Initial calculation
    recalculateFare();
}

function calculateCurrentStay() {
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    if (!checkInInput || !checkOutInput) return null;

    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);
    const timeDiff = outDate - inDate;
    let nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    if (isNaN(nights) || nights < 1) nights = 1;

    let baseTotal = nights * BASE_RATE_PER_NIGHT;
    let addonsTotal = 0;
    const selectedAddons = [];

    document.querySelectorAll('.addon-card input[type="checkbox"]:checked').forEach(cb => {
        const key = cb.value;
        const addon = ADDON_PRICES[key];
        if (addon) {
            const cost = addon.perNight ? (addon.rate * nights) : addon.rate;
            addonsTotal += cost;
            selectedAddons.push({
                key: key,
                name: addon.name,
                cost: cost,
                perNight: addon.perNight
            });
        }
    });

    const total = baseTotal + addonsTotal;
    return {
        nights,
        inDateStr: checkInInput.value,
        outDateStr: checkOutInput.value,
        baseTotal,
        addonsTotal,
        selectedAddons,
        total
    };
}

function recalculateFare() {
    const stay = calculateCurrentStay();
    if (!stay) return;

    const nightsLabel = document.getElementById('summaryNights');
    const baseTotalLabel = document.getElementById('summaryBaseTotal');
    const addonsRow = document.getElementById('summaryAddonsRow');
    const addonsTotalLabel = document.getElementById('summaryAddonsTotal');
    const grandTotalLabel = document.getElementById('summaryGrandTotal');

    if (nightsLabel) nightsLabel.innerText = `${stay.nights} Night${stay.nights > 1 ? 's' : ''}`;
    if (baseTotalLabel) baseTotalLabel.innerText = `₹${stay.baseTotal.toLocaleString('en-IN')}`;

    if (addonsRow && addonsTotalLabel) {
        if (stay.addonsTotal > 0) {
            addonsRow.style.display = 'flex';
            addonsTotalLabel.innerText = `+₹${stay.addonsTotal.toLocaleString('en-IN')}`;
        } else {
            addonsRow.style.display = 'none';
        }
    }

    if (grandTotalLabel) {
        grandTotalLabel.innerText = `₹${stay.total.toLocaleString('en-IN')}`;
    }
}

// Handle Form Submission
function handleHomestayBooking(event) {
    event.preventDefault();
    const stay = calculateCurrentStay();
    if (!stay) return;

    const name = (document.getElementById('guestName').value || '').trim();
    const phone = (document.getElementById('guestPhone').value || '').trim();
    const email = (document.getElementById('guestEmail').value || '').trim();
    const adults = document.getElementById('guestAdults').value;
    const children = document.getElementById('guestChildren').value;
    const notes = (document.getElementById('guestNotes').value || '').trim();

    if (!name || !phone || !email) {
        alert('Please provide your name, phone number, and email.');
        return;
    }

    // Generate unique reference
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `DP-2026-${randNum}`;

    const newBooking = {
        id: bookingId,
        guestName: name,
        phone: phone,
        email: email,
        checkIn: stay.inDateStr,
        checkOut: stay.outDateStr,
        nights: stay.nights,
        adults: adults,
        children: children,
        villaType: 'Entire 4 BHK Hilltop Villa',
        addons: stay.selectedAddons.map(a => a.name),
        notes: notes,
        estimatedTotal: stay.total,
        status: 'PENDING_APPROVAL',
        createdAt: new Date().toISOString(),
        offer: null,
        payment: null
    };

    // Save to localStorage
    const bookings = getStoredBookings();
    bookings.unshift(newBooking);
    saveStoredBookings(bookings);

    // Populate Voucher Modal
    document.getElementById('modalBookingRef').innerText = bookingId;
    document.getElementById('modalGuestName').innerText = name;
    document.getElementById('modalDates').innerText = `${stay.inDateStr} to ${stay.outDateStr} (${stay.nights} Nights)`;
    document.getElementById('modalGuests').innerText = `${adults} Adults${children > 0 ? ', ' + children + ' Children' : ''}`;
    document.getElementById('modalEstTotal').innerText = `₹${stay.total.toLocaleString('en-IN')}`;

    // WhatsApp Direct Link
    const waText = `*Destination Periyar - Homestay Booking Request*\n` +
                   `Reference: ${bookingId}\n` +
                   `Guest: ${name}\n` +
                   `Dates: ${stay.inDateStr} to ${stay.outDateStr} (${stay.nights} Nights)\n` +
                   `Party: ${adults} Adults, ${children} Children\n` +
                   (stay.selectedAddons.length > 0 ? `Addons: ${stay.selectedAddons.map(a => a.name).join(', ')}\n` : '') +
                   `Estimated Total: ₹${stay.total.toLocaleString('en-IN')}\n\n` +
                   `Hello Host! I have submitted a booking request for Destination Periyar homestay. Awaiting your approval and offer details!`;

    const waBtn = document.getElementById('modalWhatsAppBtn');
    if (waBtn) {
        waBtn.onclick = () => {
            window.open('https://wa.me/919876543210?text=' + encodeURIComponent(waText), '_blank');
        };
    }

    const trackBtn = document.getElementById('modalTrackBtn');
    if (trackBtn) {
        trackBtn.href = `payment.html?id=${bookingId}`;
    }

    // Open Modal
    const modal = document.getElementById('bookingVoucherModal');
    if (modal) modal.classList.add('active');

    // Reset form
    document.getElementById('homestayBookingForm').reset();
    initBookingEngine();
}

function closeBookingModal() {
    const modal = document.getElementById('bookingVoucherModal');
    if (modal) modal.classList.remove('active');
}

function dispatchGeneralWhatsApp() {
    const name = (document.getElementById('guestName')?.value || '').trim() || 'Guest';
    const text = `*Destination Periyar - Stay Inquiry*\nHello Host, I am interested in booking Destination Periyar homestay in Idukki. Could you please share availability and rates?`;
    window.open('https://wa.me/919876543210?text=' + encodeURIComponent(text), '_blank');
}

// ==========================================================================
// 3. GALLERY LIGHTBOX MODAL
// ==========================================================================
const images = [
    './extracted_images/frame_01.jpg',
    './extracted_images/frame_04.jpg',
    './extracted_images/frame_05.jpg',
    './extracted_images/frame_06.jpg',
    './extracted_images/frame_08.jpg',
    './extracted_images/frame_10.jpg'
];
const captions = [
    'Lush Valley View with Winding River',
    'Aerial View of Both Hilltop Villas',
    'Riverfront Elevation of the Estate',
    'Modern Villa Front Facade',
    'Night Drone View of Illuminated Villas',
    'Warm Golden Facade Illumination at Night'
];

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');
    if (lightbox && img && caption) {
        img.src = images[index];
        caption.innerText = captions[index];
        lightbox.classList.add('active');
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) lightbox.classList.remove('active');
}

// ==========================================================================
// 4. PARALLAX HERO BACKGROUND VIDEO AUTOPLAY
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initBookingEngine();

    const heroVid = document.querySelector('.hero-bg-video');
    if (heroVid) {
        heroVid.muted = true;
        heroVid.defaultMuted = true;
        // Calm, tranquil playback pace
        heroVid.playbackRate = 0.85;

        const startVideo = () => {
            const playPromise = heroVid.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Autoplay prevented by browser policy; fallback poster is active
                });
            }
        };

        startVideo();
        ['click', 'touchstart', 'scroll'].forEach(evt => {
            window.addEventListener(evt, () => {
                if (heroVid.paused) {
                    heroVid.play().catch(() => {});
                }
            }, { once: true, passive: true });
        });
    }
});
