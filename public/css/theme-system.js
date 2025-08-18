/* ===== ENGESENSE THEME SYSTEM ===== */

class ThemeManager {
  constructor() {
    this.storageKey = 'engesense-theme';
    this.currentTheme = this.getStoredTheme() || 'light';
    this.init();
  }

  init() {
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    // Create theme toggle if it doesn't exist
    this.createThemeToggle();
    
    // Listen for system theme changes
    this.watchSystemTheme();
  }

  getStoredTheme() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('localStorage not available, using default theme');
      return null;
    }
  }

  storeTheme(theme) {
    try {
      localStorage.setItem(this.storageKey, theme);
    } catch (e) {
      console.warn('Could not store theme preference');
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    this.updateToggleIcon(theme);
    this.storeTheme(theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createThemeToggle() {
    // Check if toggle already exists
    if (document.querySelector('.md-theme-toggle')) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.className = 'md-theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = `
      <svg class="md-theme-toggle-icon" viewBox="0 0 24 24" fill="currentColor">
        <path class="theme-icon-sun" d="M12,18C8.69,18 6,15.31 6,12C6,8.69 8.69,6 12,6C15.31,6 18,8.69 18,12C18,15.31 15.31,18 12,18M12,16C14.21,16 16,14.21 16,12C16,9.79 14.21,8 12,8C9.79,8 8,9.79 8,12C8,14.21 9.79,16 12,16M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M21.61,8.39L18.42,9.61C18.85,10.35 19,11.16 19,12C19,12.84 18.85,13.65 18.42,14.39L21.61,15.61L21.61,8.39M15.61,18.42L14.39,21.61L9.61,18.42C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.42M5.42,14.39L2.39,15.61V8.39L5.42,9.61C5.15,10.35 5,11.16 5,12C5,12.84 5.15,13.65 5.42,14.39Z"/>
        <path class="theme-icon-moon" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,11.07 21.87,10.16 21.64,9.29C20.89,10.15 19.72,10.66 18.43,10.66C15.93,10.66 13.9,8.63 13.9,6.13C13.9,4.84 14.41,3.67 15.27,2.92C14.4,2.69 13.49,2.56 12.56,2.56L12,2Z" style="display: none;"/>
      </svg>
    `;

    toggle.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggle);
    
    this.updateToggleIcon(this.currentTheme);
  }

  updateToggleIcon(theme) {
    const toggle = document.querySelector('.md-theme-toggle');
    if (!toggle) return;

    const sunIcon = toggle.querySelector('.theme-icon-sun');
    const moonIcon = toggle.querySelector('.theme-icon-moon');
    
    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      toggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      toggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  watchSystemTheme() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Only auto-apply if no theme is stored
      if (!this.getStoredTheme()) {
        this.applyTheme(mediaQuery.matches ? 'dark' : 'light');
      }
      
      mediaQuery.addEventListener('change', (e) => {
        // Only auto-apply if no theme is stored
        if (!this.getStoredTheme()) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }
}

// Material Design Icon Utilities
const MaterialIcons = {
  // Common icons as SVG strings
  sun: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,18C8.69,18 6,15.31 6,12C6,8.69 8.69,6 12,6C15.31,6 18,8.69 18,12C18,15.31 15.31,18 12,18M12,16C14.21,16 16,14.21 16,12C16,9.79 14.21,8 12,8C9.79,8 8,9.79 8,12C8,14.21 9.79,16 12,16M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M21.61,8.39L18.42,9.61C18.85,10.35 19,11.16 19,12C19,12.84 18.85,13.65 18.42,14.39L21.61,15.61L21.61,8.39M15.61,18.42L14.39,21.61L9.61,18.42C10.35,18.85 11.16,19 12,19C12.84,19 13.65,18.85 14.39,18.42M5.42,14.39L2.39,15.61V8.39L5.42,9.61C5.15,10.35 5,11.16 5,12C5,12.84 5.15,13.65 5.42,14.39Z"/></svg>`,
  
  moon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,11.07 21.87,10.16 21.64,9.29C20.89,10.15 19.72,10.66 18.43,10.66C15.93,10.66 13.9,8.63 13.9,6.13C13.9,4.84 14.41,3.67 15.27,2.92C14.4,2.69 13.49,2.56 12.56,2.56L12,2Z"/></svg>`,
  
  refresh: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/></svg>`,
  
  download: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`,
  
  logout: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/></svg>`,
  
  user: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/></svg>`,
  
  dashboard: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"/></svg>`,
  
  analytics: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22,21H2V3H4V19H6V10H10V19H12V6H16V19H18V14H22V21Z"/></svg>`,
  
  settings: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>`,
  
  chevronDown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/></svg>`
};

// Utility function to create Material Design icons
function createMaterialIcon(iconName, className = '') {
  const iconSvg = MaterialIcons[iconName];
  if (!iconSvg) {
    console.warn(`Icon '${iconName}' not found`);
    return '';
  }
  
  const wrapper = document.createElement('span');
  wrapper.className = `md-icon ${className}`;
  wrapper.innerHTML = iconSvg;
  
  return wrapper.outerHTML;
}

// Initialize theme system when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}

// Export for use in other scripts
window.MaterialIcons = MaterialIcons;
window.createMaterialIcon = createMaterialIcon;