/**
 * Elysian Heights - Version 2 (Dark Parallax Script)
 * Exact V1 functionality + Private Access Gate + WhatsApp integration
 */

// Form Submission
function handleFormSubmit(event) {
    event.preventDefault();
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('formSuccess').classList.add('active');
}

function dispatchWhatsApp() {
    var name = (document.getElementById('name').value || '').trim() || 'Guest';
    var phone = (document.getElementById('phone').value || '').trim();
    var email = (document.getElementById('email').value || '').trim();
    var type = document.getElementById('type').value;
    var msg = (document.getElementById('message').value || '').trim();

    var text = "*Elysian Heights - Stay Inquiry*\n" +
               "Name: " + name + "\n" +
               (phone ? "Phone: " + phone + "\n" : "") +
               (email ? "Email: " + email + "\n" : "") +
               "Type: " + type + "\n" +
               (msg ? "Notes: " + msg : "");

    window.open('https://wa.me/919876543210?text=' + encodeURIComponent(text), '_blank');
}

// Lightbox Functionality
const images = [
    '../extracted_images/frame_01.jpg',
    '../extracted_images/frame_04.jpg',
    '../extracted_images/frame_05.jpg',
    '../extracted_images/frame_06.jpg',
    '../extracted_images/frame_08.jpg',
    '../extracted_images/frame_10.jpg'
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
    
    img.src = images[index];
    caption.innerText = captions[index];
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

// Private Access Gate
document.addEventListener('DOMContentLoaded', () => {
    const gateModal = document.getElementById('privateGateModal');
    const gateForm = document.getElementById('gateForm');
    const gatePin = document.getElementById('gatePin');
    const gateError = document.getElementById('gateError');

    if (gateModal && gateForm) {
        if (sessionStorage.getItem('er_authorized') === 'true') {
            document.documentElement.classList.remove('gate-locked');
            gateModal.remove();
        } else {
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
    }

    // Ensure Hero Background Video Autoplays smoothly at serene retreat tempo
    const heroVid = document.querySelector('.hero-bg-video');
    if (heroVid) {
        heroVid.muted = true;
        heroVid.defaultMuted = true;
        // Serene, calm playback pace
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
        // Also ensure playback begins on first user interaction if browser blocked autoplay
        ['click', 'touchstart', 'scroll'].forEach(evt => {
            window.addEventListener(evt, () => {
                if (heroVid.paused) {
                    heroVid.play().catch(() => {});
                }
            }, { once: true, passive: true });
        });
    }
});
