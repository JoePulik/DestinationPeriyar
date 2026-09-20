/**
 * Elysian Heights - Hospitality Edition
 * Frontend script handling navigation, accessible lightbox,
 * FAQ accordion, form validation, date calculation, and WhatsApp dispatch.
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initDatePickers();
    initFaqAccordion();
    initGalleryAndLightbox();
    initBookingForm();
});

/* --------------------------------------------------------------------------
   1. Sticky Header & Active Navigation Highlighting
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

    // Active Section Spy
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset + 140;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Date Picker Restrictions & Logic
   -------------------------------------------------------------------------- */
function initDatePickers() {
    const checkin = document.getElementById('checkinDate');
    const checkout = document.getElementById('checkoutDate');
    if (!checkin || !checkout) return;

    // Set minimum check-in to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDateStr = `${yyyy}-${mm}-${dd}`;
    checkin.min = minDateStr;

    // Tomorrow for checkout minimum
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tmYyyy = tomorrow.getFullYear();
    const tmMm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const tmDd = String(tomorrow.getDate()).padStart(2, '0');
    checkout.min = `${tmYyyy}-${tmMm}-${tmDd}`;

    checkin.addEventListener('change', () => {
        if (checkin.value) {
            const chosen = new Date(checkin.value);
            chosen.setDate(chosen.getDate() + 1);
            const nextY = chosen.getFullYear();
            const nextM = String(chosen.getMonth() + 1).padStart(2, '0');
            const nextD = String(chosen.getDate()).padStart(2, '0');
            checkout.min = `${nextY}-${nextM}-${nextD}`;

            if (checkout.value && checkout.value <= checkin.value) {
                checkout.value = `${nextY}-${nextM}-${nextD}`;
            }
        }
    });
}

/* --------------------------------------------------------------------------
   3. Accessible FAQs Accordion
   -------------------------------------------------------------------------- */
function initFaqAccordion() {
    const accordion = document.getElementById('faqAccordion');
    if (!accordion) return;

    const items = accordion.querySelectorAll('.faq-item');

    items.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (!questionBtn || !answer) return;

        questionBtn.addEventListener('click', () => {
            const isExpanded = questionBtn.getAttribute('aria-expanded') === 'true';

            // Close all items
            items.forEach(otherItem => {
                const otherBtn = otherItem.querySelector('.faq-question');
                const otherAns = otherItem.querySelector('.faq-answer');
                if (otherBtn && otherAns) {
                    otherBtn.setAttribute('aria-expanded', 'false');
                    otherAns.hidden = true;
                    otherItem.classList.remove('open');
                }
            });

            // If it was not open, open it now
            if (!isExpanded) {
                questionBtn.setAttribute('aria-expanded', 'true');
                answer.hidden = false;
                item.classList.add('open');
            }
        });
    });
}

/* --------------------------------------------------------------------------
   4. Gallery Filtering & Accessible Lightbox
   -------------------------------------------------------------------------- */
function initGalleryAndLightbox() {
    // Gallery Filtering
    const filterButtons = document.querySelectorAll('.gallery-filters .filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    let currentFilter = 'all';

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            currentFilter = btn.getAttribute('data-filter');

            galleryCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (currentFilter === 'all' || category === currentFilter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Lightbox Setup
    const modal = document.getElementById('lightboxModal');
    const overlay = document.getElementById('lightboxOverlay');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');

    if (!modal || !lightboxImg) return;

    // Collect all gallery items
    const triggers = Array.from(document.querySelectorAll('.gallery-trigger'));
    let currentIndex = 0;
    let lastFocusedElement = null;

    function getVisibleTriggers() {
        return triggers.filter(trig => {
            const card = trig.closest('.gallery-card');
            return card && card.style.display !== 'none';
        });
    }

    function openLightbox(triggerEl) {
        lastFocusedElement = triggerEl;
        const visibleTriggers = getVisibleTriggers();
        currentIndex = visibleTriggers.indexOf(triggerEl);
        if (currentIndex === -1) currentIndex = 0;

        updateLightboxContent(visibleTriggers[currentIndex]);
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeBtn.focus();
    }

    function closeLightbox() {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    function updateLightboxContent(triggerEl) {
        if (!triggerEl) return;
        const img = triggerEl.querySelector('img');
        const title = triggerEl.querySelector('.caption-title');
        const desc = triggerEl.querySelector('.caption-desc');

        if (img) {
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt || 'Gallery photo';
        }
        if (lightboxCaption) {
            lightboxCaption.innerHTML = `<strong>${title ? title.textContent : ''}</strong>${desc ? ' — ' + desc.textContent : ''}`;
        }
    }

    function showNext() {
        const visibleTriggers = getVisibleTriggers();
        if (visibleTriggers.length === 0) return;
        currentIndex = (currentIndex + 1) % visibleTriggers.length;
        updateLightboxContent(visibleTriggers[currentIndex]);
    }

    function showPrev() {
        const visibleTriggers = getVisibleTriggers();
        if (visibleTriggers.length === 0) return;
        currentIndex = (currentIndex - 1 + visibleTriggers.length) % visibleTriggers.length;
        updateLightboxContent(visibleTriggers[currentIndex]);
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => openLightbox(trigger));
    });

    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', showNext);
    prevBtn.addEventListener('click', showPrev);

    // Keyboard navigation (Esc, Left, Right)
    document.addEventListener('keydown', (e) => {
        if (modal.hidden) return;

        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            showNext();
        } else if (e.key === 'ArrowLeft') {
            showPrev();
        }
    });
}

/* --------------------------------------------------------------------------
   5. Booking Form Calculation, Confirmation & WhatsApp Dispatch
   -------------------------------------------------------------------------- */
function initBookingForm() {
    const form = document.getElementById('enquiryForm');
    const submitBtn = document.getElementById('submitBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    const confirmationPanel = document.getElementById('confirmationPanel');
    const displayRef = document.getElementById('displayRef');
    const confirmDetails = document.getElementById('confirmDetails');
    const sendWhatsAppInstant = document.getElementById('sendWhatsAppInstant');
    const resetFormBtn = document.getElementById('resetFormBtn');

    if (!form) return;

    function getFormData() {
        const name = document.getElementById('guestName').value.trim();
        const phone = document.getElementById('guestPhone').value.trim();
        const email = document.getElementById('guestEmail').value.trim();
        const checkin = document.getElementById('checkinDate').value;
        const checkout = document.getElementById('checkoutDate').value;
        const adults = document.getElementById('adultsCount').value;
        const children = document.getElementById('childrenCount').value;
        const mealSelect = document.getElementById('mealPref');
        const meal = mealSelect.options[mealSelect.selectedIndex].text;
        const notes = document.getElementById('guestNotes').value.trim();

        return { name, phone, email, checkin, checkout, adults, children, meal, notes };
    }

    function validateForm(data) {
        if (!data.name) {
            alert('Please enter your full name.');
            document.getElementById('guestName').focus();
            return false;
        }
        if (!data.phone) {
            alert('Please provide your WhatsApp / phone number.');
            document.getElementById('guestPhone').focus();
            return false;
        }
        if (!data.email || !data.email.includes('@')) {
            alert('Please provide a valid email address.');
            document.getElementById('guestEmail').focus();
            return false;
        }
        if (!data.checkin) {
            alert('Please select a check-in date.');
            document.getElementById('checkinDate').focus();
            return false;
        }
        if (!data.checkout) {
            alert('Please select a check-out date.');
            document.getElementById('checkoutDate').focus();
            return false;
        }

        const cin = new Date(data.checkin);
        const cout = new Date(data.checkout);
        if (cout <= cin) {
            alert('Check-out date must be after check-in date.');
            document.getElementById('checkoutDate').focus();
            return false;
        }

        return true;
    }

    function calculateNights(cinStr, coutStr) {
        const cin = new Date(cinStr);
        const cout = new Date(coutStr);
        const diff = cout.getTime() - cin.getTime();
        return Math.max(1, Math.round(diff / (1000 * 3600 * 24)));
    }

    function generateReference() {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        return `#EH-2026-${randomNum}`;
    }

    function createWhatsAppUrl(data, ref, nights) {
        const text = 
`*Elysian Heights - Villa Reservation Enquiry*
━━━━━━━━━━━━━━━━━━━━
*Ref Code:* ${ref}
*Guest Name:* ${data.name}
*Phone:* ${data.phone}
*Email:* ${data.email}
*Dates:* ${data.checkin} to ${data.checkout} (${nights} night${nights > 1 ? 's' : ''})
*Capacity:* ${data.adults} Adults, ${data.children} Children
*Meal Plan:* ${data.meal}
${data.notes ? `*Special Notes:* ${data.notes}` : ''}
━━━━━━━━━━━━━━━━━━━━
Looking forward to availability confirmation!`;

        const encoded = encodeURIComponent(text);
        return `https://wa.me/919876543210?text=${encoded}`;
    }

    function handleSubmission(openDirectWhatsApp = false) {
        const data = getFormData();
        if (!validateForm(data)) return;

        const nights = calculateNights(data.checkin, data.checkout);
        const ref = generateReference();
        const waUrl = createWhatsAppUrl(data, ref, nights);

        // Populate Confirmation Panel
        displayRef.textContent = ref;
        confirmDetails.innerHTML = `
            <div><span>Guest Name:</span> <strong>${data.name}</strong></div>
            <div><span>Dates:</span> <strong>${data.checkin} &rarr; ${data.checkout} (${nights} night${nights > 1 ? 's' : ''})</strong></div>
            <div><span>Group Size:</span> <strong>${data.adults} Adults, ${data.children} Children</strong></div>
            <div><span>Meal Arrangement:</span> <strong>${data.meal}</strong></div>
            <div><span>Contact:</span> <strong>${data.phone} &bull; ${data.email}</strong></div>
        `;

        sendWhatsAppInstant.setAttribute('href', waUrl);

        // Switch to confirmation view
        form.hidden = true;
        confirmationPanel.hidden = false;

        // Smooth scroll to confirmation panel
        confirmationPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // If clicked direct WhatsApp, launch in new tab
        if (openDirectWhatsApp) {
            window.open(waUrl, '_blank');
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSubmission(false);
    });

    whatsappBtn.addEventListener('click', () => {
        handleSubmission(true);
    });

    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', () => {
            confirmationPanel.hidden = true;
            form.hidden = false;
            form.reset();
            initDatePickers();
        });
    }
}
