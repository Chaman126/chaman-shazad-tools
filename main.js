/**
 * Chaman Shazad Tools - Universal Main Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNavigation = document.getElementById('mainNavigation');

    if (mobileMenuBtn && mainNavigation) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mainNavigation.classList.toggle('mobile-active');
            
            // Toggle hamburger animation state
            const spans = mobileMenuBtn.querySelectorAll('span');
            if (mainNavigation.classList.contains('mobile-active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mainNavigation.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                if (mainNavigation.classList.contains('mobile-active')) {
                    mainNavigation.classList.remove('mobile-active');
                    const spans = mobileMenuBtn.querySelectorAll('span');
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    }

    // 2. Header Scroll Effect
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 30) {
                siteHeader.style.padding = '0.75rem 2rem';
                siteHeader.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                siteHeader.style.background = 'rgba(7, 9, 14, 0.9)';
            } else {
                siteHeader.style.padding = '1rem 2rem';
                siteHeader.style.boxShadow = 'none';
                siteHeader.style.background = 'rgba(7, 9, 14, 0.7)';
            }
        });
    }

    // 3. Hover Card Lighting Coordinates (Glow Effect)
    const cards = document.querySelectorAll('.tool-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });

    // 4. Interactive Accordion (FAQ Section)
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (questionBtn && answer) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close other open FAQ items (optional, but clean)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    }
                });

                if (isActive) {
                    item.classList.remove('active');
                    answer.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });

    // 5. Update Year in Footer
    const footerYear = document.getElementById('footerYear');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }
});
