const counters = document.querySelectorAll('.card-number');

counters.forEach(counter => {
    const target = +counter.dataset.target;
    const prefix = counter.dataset.prefix || '';
    const suffix = counter.dataset.suffix || '';

    const increment = target / 500;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;

        if (current >= target) {
            counter.textContent = prefix + target + suffix;
            clearInterval(timer);
        } else {
            counter.textContent =
                prefix + Math.floor(current) + suffix;
        }
    }, 12);
});

const observer = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const bars =
                entry.target.querySelectorAll('.stat-bar');

            bars.forEach(bar => {
                const value = +bar.dataset.statValue;
                const max = +bar.dataset.max;

                bar.style.width =
                    `${(value / max) * 100}%`;
            });

            observer.unobserve(entry.target);
        });
    },
    { threshold: 0.3 }
);

document
    .querySelectorAll('.hof-card')
    .forEach(card => observer.observe(card));