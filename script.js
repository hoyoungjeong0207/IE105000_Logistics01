// ===== Navigation Scroll Effect =====
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Show home button when about section is visible
    const aboutSection = document.querySelector('#about');
    const homeButton = document.querySelector('.home-button');
    if (aboutSection && homeButton) {
        const aboutTop = aboutSection.offsetTop;
        const aboutBottom = aboutTop + aboutSection.offsetHeight;
        const scrollPos = window.scrollY + window.innerHeight / 2;
        
        if (scrollPos >= aboutTop && scrollPos <= aboutBottom) {
            homeButton.style.opacity = '0.7';
            homeButton.style.pointerEvents = 'auto';
        } else {
            homeButton.style.opacity = '0';
            homeButton.style.pointerEvents = 'none';
        }
    }
});

// ===== Mobile Navigation Toggle =====
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// ===== Smooth Scroll for Navigation Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Counter Animation =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

// Fade in elements on scroll
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Add fade-in class to elements
document.querySelectorAll('.section-header, .research-card, .pub-item, .team-card, .timeline-item, .feature').forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
});

// Counter animation trigger
const statsSection = document.querySelector('.hero-stats');
let counterAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !counterAnimated) {
            counterAnimated = true;
            animateCounters();
        }
    });
}, { threshold: 0.5 });

if (statsSection) {
    statsObserver.observe(statsSection);
}

// ===== Publications Filter =====
const filterBtns = document.querySelectorAll('.filter-btn');
const pubItems = document.querySelectorAll('.pub-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        
        pubItems.forEach(item => {
            const year = item.getAttribute('data-year');
            
            if (filter === 'all' || year === filter) {
                item.style.display = 'grid';
                item.style.animation = 'fadeInUp 0.5s ease forwards';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

// ===== Contact Form Handling =====
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;
        
        // Create mailto link
        const mailtoLink = `mailto:ghy27@korea.ac.kr?subject=${encodeURIComponent(subject + ' - ' + name)}&body=${encodeURIComponent('From: ' + name + '\nEmail: ' + email + '\n\n' + message)}`;
        
        // Open email client
        window.location.href = mailtoLink;
        
        // Show success message
        showNotification('Opening your email client...');
    });
}

// ===== Notification System =====
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(135deg, #00D4AA, #7B68EE);
        color: #0a0a0f;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.5s ease;
        box-shadow: 0 10px 40px rgba(0, 212, 170, 0.3);
    `;
    
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    const svg = notification.querySelector('svg');
    svg.style.cssText = `
        width: 20px;
        height: 20px;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease forwards';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Parallax Effect for Hero Orbs =====
document.addEventListener('mousemove', (e) => {
    const orbs = document.querySelectorAll('.gradient-orb');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;
        orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    });
});

// ===== Network Animation Enhancement =====
const networkNodes = document.querySelectorAll('.network-node');
const networkLines = document.querySelectorAll('.network-line');

function pulseNetwork() {
    networkNodes.forEach((node, index) => {
        setTimeout(() => {
            node.style.transform = 'scale(1.3)';
            setTimeout(() => {
                node.style.transform = 'scale(1)';
            }, 300);
        }, index * 200);
    });
}

setInterval(pulseNetwork, 4000);

// ===== Typing Effect for Hero (Optional Enhancement) =====
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// ===== Active Navigation Link Highlight =====
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        
        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        }
    });
});

// Add active link style
const activeStyle = document.createElement('style');
activeStyle.textContent = `
    .nav-link.active {
        color: var(--accent-primary);
    }
    .nav-link.active::after {
        width: 100%;
    }
`;
document.head.appendChild(activeStyle);

// ===== Preloader (Optional) =====
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Trigger hero animations
    const heroElements = document.querySelectorAll('.hero-badge, .title-line, .hero-subtitle, .hero-cta, .hero-stats');
    heroElements.forEach(el => {
        el.style.animationPlayState = 'running';
    });
});

// ===== Handle Missing Images =====
function handleMissingImages() {
    // Handle journal covers
    const journalCovers = document.querySelectorAll('.journal-cover, .journal-cover-full');
    journalCovers.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const cover = this.closest('.pub-cover, .pub-cover-full');
            if (cover) {
                cover.style.display = 'none';
                // Adjust grid layout
                const pubItem = cover.closest('.pub-item, .pub-item-full');
                if (pubItem) {
                    if (pubItem.classList.contains('pub-item')) {
                        pubItem.style.gridTemplateColumns = '80px 1fr';
                    } else {
                        pubItem.style.gridTemplateColumns = '1fr';
                    }
                }
            }
        });
        
        // Check if src is empty or invalid on load
        if (!img.src || img.src.includes('undefined') || img.src === window.location.href || !img.complete) {
            // Check after a short delay to allow image to load
            setTimeout(() => {
                if (!img.complete || img.naturalWidth === 0) {
                    img.style.display = 'none';
                    const cover = img.closest('.pub-cover, .pub-cover-full');
                    if (cover) {
                        cover.style.display = 'none';
                        const pubItem = cover.closest('.pub-item, .pub-item-full');
                        if (pubItem) {
                            if (pubItem.classList.contains('pub-item')) {
                                pubItem.style.gridTemplateColumns = '80px 1fr';
                            } else {
                                pubItem.style.gridTemplateColumns = '1fr';
                            }
                        }
                    }
                }
            }, 100);
        }
    });
    
    // Handle organization logos
    const orgLogos = document.querySelectorAll('.org-logo');
    orgLogos.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const logo = this.closest('.timeline-logo');
            if (logo) {
                logo.style.display = 'none';
            }
        });
        
        // Check if src is empty or invalid on load
        if (!img.src || img.src.includes('undefined') || img.src === window.location.href || !img.complete) {
            setTimeout(() => {
                if (!img.complete || img.naturalWidth === 0) {
                    img.style.display = 'none';
                    const logo = img.closest('.timeline-logo');
                    if (logo) {
                        logo.style.display = 'none';
                    }
                }
            }, 100);
        }
    });
}

// Initialize image handling
window.addEventListener('load', () => {
    handleMissingImages();
});

// ===== Console Easter Egg =====
console.log('%c🔬 ORLAB - Operations Research Laboratory', 'font-size: 20px; font-weight: bold; color: #00D4AA;');
console.log('%cInterested in our research? Contact us at ghy27@korea.ac.kr', 'font-size: 12px; color: #7B68EE;');

