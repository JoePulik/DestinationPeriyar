/**
 * Elysian Heights - Version 2 (Dark Parallax Edition)
 * Frontend script handling private access gate, gallery filtering,
 * accessible lightbox, date calculations, and WhatsApp URL generation.
 */

document.addEventListener('DOMContentLoaded', () => {
    initPrivateGate();
    initHeader();
    initGalleryAndLightbox();
    initDatePickers();
    initBookingForm();
});

/* --------------------------------------------------------------------------
   0. Private Access Gate
   -------------------------------------------------------------------------- */
function initPrivateGate() {
    const gateModal = document.getElementById('privateGateModal');
    const gateForm = document.getElementById('gateForm');
    const gatePin = document.getElementById('gatePin');
    const gateError = document.getElementById('gateError');

    if (!gateModal || !gateForm) return;

    if (sessionStorage.getItem('er_authorized') === 'true') {
        document.documentElement.classList.remove('gate-locked');
        gateModal.remove();
        return;
    }

    let attempts = 0;
    gateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = (gatePin.value || '').trim().toLowerCase();
        if (entered === '2026' || entered === 'joe') {
            sessionStorage.setItem('er_authorized', 'true');
            document.documentElement.classList.remove('gate-locked');
            gateModal.remove();
        } else {
            attempts++;
            if (gateError) gateError.style.display = 'block';
            gatePin.value = '';
            gatePin.focus();
            if (attempts >= 3) {
                window.location.replace('../design1_single_parallax/index.html');
            }
        }
    });
}

/* --------------------------------------------------------------------------
   1. Sticky Header & Navigation Spy
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });

    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset + 120;
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            const id = sec.getAttribute('id');
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Gallery Filtering & Accessible Lightbox
   -------------------------------------------------------------------------- */
function initGalleryAndLightbox() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    if (!lightbox || !lightboxImg) return;

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.getAttribute('data-filter');

            items.forEach(item => {
                const itemCat = item.getAttribute('data-category');
                if (cat === 'all' || itemCat === cat) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Lightbox Logic
    const allItems = Array.from(items);
    let currentIndex = 0;

    function getVisibleItems() {
        return allItems.filter(item => item.style.display !== 'none');
    }

    function openLightbox(item) {
        const visible = getVisibleItems();
        currentIndex = visible.indexOf(item);
        if (currentIndex === -1) currentIndex = 0;

        updateLightbox(visible[currentIndex]);
        lightbox.hidden = false;
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.hidden = true;
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function updateLightbox(item) {
        if (!item) return;
        const img = item.querySelector('img');
        const text = item.querySelector('.overlay-text');
        if (img) lightboxImg.src = img.src;
        if (text) lightboxCaption.textContent = text.textContent;
    }

    function showNext() {
        const visible = getVisibleItems();
        if (visible.length === 0) return;
        currentIndex = (currentIndex + 1) % visible.length;
        updateLightbox(visible[currentIndex]);
    }

    function showPrev() {
        const visible = getVisibleItems();
        if (visible.length === 0) return;
        currentIndex = (currentIndex - 1 + visible.length) % visible.length;
        updateLightbox(visible[currentIndex]);
    }

    allItems.forEach(item => {
        item.addEventListener('click', () => openLightbox(item));
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNext);
    prevBtn.addEventListener('click', showPrev);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });
}

/* --------------------------------------------------------------------------
   3. Date Picker Logic
   -------------------------------------------------------------------------- */
function initDatePickers() {
    const cin = document.getElementById('checkin');
    const cout = document.getElementById('checkout');
    if (!cin || !cout) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    cin.min = `${yyyy}-${mm}-${dd}`;

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmY = tomorrow.getFullYear();
    const tmM = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tmD = String(tomorrow.getDate()).padStart(2, '0');
    cout.min = `${tmY}-${tmM}-${tmD}`;

    cin.addEventListener('change', () => {
        if (cin.value) {
            const next = new Date(cin.value);
            next.setDate(next.getDate() + 1);
            const nY = next.getFullYear();
            const nM = String(next.getMonth() + 1).padStart(2, '0');
            const nD = String(next.getDate()).padStart(2, '0');
            cout.min = `${nY}-${nM}-${nD}`;
            if (cout.value && cout.value <= cin.value) {
                cout.value = `${nY}-${nM}-${nD}`;
            }
        }
    });
}

/* --------------------------------------------------------------------------
   4. Booking Form, Validation, Night Calculation & WhatsApp Dispatch
   -------------------------------------------------------------------------- */
function initBookingForm() {
    const form = document.getElementById('bookingForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnWhatsApp = document.getElementById('btnWhatsApp');
    const successAlert = document.getElementById('formSuccess');
    const successRef = document.getElementById('successRef');
    const successDetails = document.getElementById('successDetails');
    const waSuccessBtn = document.getElementById('waSuccessBtn');
    const btnReset = document.getElementById('btnReset');

    if (!form) return;

    function getFormData() {
        return {
            name: (document.getElementById('name').value || '').trim(),
            phone: (document.getElementById('phone').value || '').trim(),
            email: (document.getElementById('email').value || '').trim(),
            checkin: document.getElementById('checkin').value,
            checkout: document.getElementById('checkout').value,
            guests: document.getElementById('guests').value,
            mealPlan: document.getElementById('mealPlan').value,
            message: (document.getElementById('message').value || '').trim()
        };
    }

    function validate(data) {
        if (!data.name) {
            alert('Please enter your full name.');
            document.getElementById('name').focus();
            return false;
        }
        if (!data.phone) {
            alert('Please enter your WhatsApp / phone number.');
            document.getElementById('phone').focus();
            return false;
        }
        if (!data.email || !data.email.includes('@')) {
            alert('Please enter a valid email address.');
            document.getElementById('email').focus();
            return false;
        }
        if (!data.checkin) {
            alert('Please select a check-in date.');
            document.getElementById('checkin').focus();
            return false;
        }
        if (!data.checkout) {
            alert('Please select a check-out date.');
            document.getElementById('checkout').focus();
            return false;
        }
        if (new Date(data.checkout) <= new Date(data.checkin)) {
            alert('Check-out date must be after check-in date.');
            document.getElementById('checkout').focus();
            return false;
        }
        return true;
    }

    function calculateNights(cin, cout) {
        const diff = new Date(cout).getTime() - new Date(cin).getTime();
        return Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
    }

    function generateRef() {
        return '#EH-2026-' + Math.floor(1000 + Math.random() * 9000);
    }

    function buildWhatsAppUrl(data, ref, nights) {
        const msg = 
`*Elysian Heights - Villa Reservation Enquiry*
━━━━━━━━━━━━━━━━━━━━
*Ref Code:* ${ref}
*Guest Name:* ${data.name}
*Phone:* ${data.phone}
*Email:* ${data.email}
*Dates:* ${data.checkin} to ${data.checkout} (${nights} night${nights > 1 ? 's' : ''})
*Party Size:* ${data.guests}
*Meal Preference:* ${data.mealPlan}
${data.message ? `*Notes:* ${data.message}` : ''}
━━━━━━━━━━━━━━━━━━━━
Looking forward to availability confirmation!`;

        return 'https://wa.me/919876543210?text=' + encodeURIComponent(msg);
    }

    function processSubmission(openDirect = false) {
        const data = getFormData();
        if (!validate(data)) return;

        const nights = calculateNights(data.checkin, data.checkout);
        const ref = generateRef();
        const waUrl = buildWhatsAppUrl(data, ref, nights);

        successRef.textContent = ref;
        successDetails.innerHTML = `
            <div><span>Guest:</span> <strong>${data.name}</strong></div>
            <div><span>Stay:</span> <strong>${data.checkin} &rarr; ${data.checkout} (${nights} night${nights > 1 ? 's' : ''})</strong></div>
            <div><span>Group:</span> <strong>${data.guests}</strong></div>
            <div><span>Meals:</span> <strong>${data.mealPlan}</strong></div>
            <div><span>Contact:</span> <strong>${data.phone} &bull; ${data.email}</strong></div>
        `;

        waSuccessBtn.setAttribute('href', waUrl);

        form.style.display = 'none';
        successAlert.hidden = false;
        successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (openDirect) {
            window.open(waUrl, '_blank');
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        processSubmission(false);
    });

    btnWhatsApp.addEventListener('click', () => {
        processSubmission(true);
    });

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            successAlert.hidden = true;
            form.style.display = '';
            form.reset();
            initDatePickers();
        });
    }
}
