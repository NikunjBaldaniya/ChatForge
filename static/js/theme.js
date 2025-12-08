// ==================== THEME INITIALIZATION ====================
// Used by privacy.html, upgrade.html, and other pages

const theme = localStorage.getItem('theme') || 'light';
document.body.className = theme + '-theme';
