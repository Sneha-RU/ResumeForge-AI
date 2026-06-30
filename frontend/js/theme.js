/**
 * theme.js
 * Handles applying and toggling light/dark themes.
 * Uses hand-drawn SVGs instead of standard emojis.
 * Dynamically swaps theme-sensitive images.
 */

const moonDoodle = `
<svg class="doodle-sun-moon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  <path d="M20.3 13.5A8.5 8.5 0 1 1 11.7 3.7a7.5 7.5 0 0 0 8.6 9.8z" style="opacity: 0.5; stroke-width: 1.2;" />
</svg>`;

const sunDoodle = `
<svg class="doodle-sun-moon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5" />
  <circle cx="12" cy="12" r="5.2" style="opacity: 0.5; stroke-width: 1.2;" />
  <line x1="12" y1="1" x2="12" y2="3" />
  <line x1="12" y1="21" x2="12" y2="23" />
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
  <line x1="1" y1="12" x2="3" y2="12" />
  <line x1="21" y1="12" x2="23" y2="12" />
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
</svg>`;

// Initialize theme on load
(function() {
    const savedTheme = localStorage.getItem('rf_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

function updateThemeImages(theme) {
    const heroImg = document.getElementById('dashboard-hero-img');
    if (heroImg) {
        heroImg.src = theme === 'dark' ? '../img/dashboard_hero_dark.png' : '../img/dashboard_hero_light.png';
    }
}

window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('rf_theme', newTheme);
    
    // Update toggle button icon if it exists
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = newTheme === 'dark' ? sunDoodle : moonDoodle;
    }

    updateThemeImages(newTheme);
};

window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (btn) {
        btn.innerHTML = currentTheme === 'dark' ? sunDoodle : moonDoodle;
        btn.addEventListener('click', window.toggleTheme);
    }
    updateThemeImages(currentTheme);
});
