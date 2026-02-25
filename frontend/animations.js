// Intersection Observer for scroll animations
document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate once
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.animate-fade-up, .animate-fade-in, .animate-scale');
    animatedElements.forEach(el => observer.observe(el));

    // Navbar scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Water Drop Mouse Trail Effect ---
    let lastTime = 0;
    const dropThrottle = 30; // ms between drops

    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTime < dropThrottle) return;
        lastTime = now;

        createDrop(e.clientX, e.clientY);
    });

    function createDrop(x, y) {
        const drop = document.createElement('div');
        drop.classList.add('cursor-drop');
        drop.style.left = `${x}px`;
        drop.style.top = `${y}px`;

        // Random slight size variation
        const size = Math.random() * 10 + 10; // 10px to 20px
        drop.style.width = `${size}px`;
        drop.style.height = `${size}px`;

        document.body.appendChild(drop);

        // Remove after animation
        setTimeout(() => {
            drop.remove();
        }, 1000);
    }
});
