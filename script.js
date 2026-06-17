// ===== COUNTER ANIMATION =====

// Grab every number that needs to count up
const counters = document.querySelectorAll('.card-number');

counters.forEach(counter => {

    // Where does this number need to land?
    const target = +counter.getAttribute('data-target');

    // Some numbers have a # before them or a + after — grab those too
    const prefix = counter.getAttribute('data-prefix') || '';
    const suffix = counter.getAttribute('data-suffix') || '';

    // We want the whole thing to finish in roughly 2 seconds.
    // 200 small steps × 10ms each = 2000ms. Simple enough.
    const increment = target / 200;

    let current = 0;

    const timer = setInterval(() => {

        current += increment;

        if (current >= target) {
            // We've hit the target — lock it in and stop
            counter.textContent = prefix + target + suffix;
            clearInterval(timer);
        } else {
            // Still counting — show a rounded whole number, no decimals
            counter.textContent = prefix + Math.floor(current) + suffix;
        }

    }, 10);
});


// ===== HALL OF FAME — STAT BARS =====

// IntersectionObserver fires whenever a watched element
// scrolls into (or out of) the viewport
const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        // Only care when the card becomes visible
        if (entry.isIntersecting) {

            const bars = entry.target.querySelectorAll('.stat-bar');

            bars.forEach(bar => {
                const value = +bar.getAttribute('data-stat-value');
                const max   = +bar.getAttribute('data-max');

                // e.g. 450 goals out of 500 max → 90%
                const percentage = (value / max) * 100;

                // Setting the width triggers the CSS transition — no extra JS needed
                bar.style.width = percentage + '%';
            });

            // Done with this card, no need to keep watching it
            observer.unobserve(entry.target);
        }
    });

// Fire when at least 30% of the card is on screen
}, { threshold: 0.3 });

document.querySelectorAll('.hof-card').forEach(card => {
    observer.observe(card);
});