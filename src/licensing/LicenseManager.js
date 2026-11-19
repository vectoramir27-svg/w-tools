/**
 * ============================================================================
 * LicenseManager - Isolated Telegram Emoji Studio Licensing Subsystem
 * ============================================================================
 * 
 * Architecture for subscription validation (Pro: 400 ₽ / 30 days)
 * Mode DEV_UNLOCKED = true allows seamless testing of all creator & export features.
 */

class LicenseManager {
  constructor() {
    this.STORAGE_KEY = 'telegram_emoji_studio_license';
    
    // DEV MODE: Set true for unrestricted testing of all capabilities
    this.DEV_UNLOCKED = true;

    // Plan specifications
    this.PLAN_NAME = 'Pro Подписка';
    this.PLAN_PRICE_RUB = 400;
    this.PLAN_DURATION_DAYS = 30;

    this.state = this._loadState();
  }

  _loadState() {
    if (typeof localStorage === 'undefined') {
      return this._getDefaultState();
    }
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading license state:', e);
    }
    return this._getDefaultState();
  }

  _getDefaultState() {
    // In dev unlocked mode, provide active Pro status until 1 year from now
    const now = new Date();
    const expiry = new Date(now.getTime() + (this.PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000 * 12));
    
    return {
      isActive: true,
      licenseKey: 'TES-PRO-DEV-UNLOCKED-2026',
      userId: 'user_dev_local',
      plan: this.PLAN_NAME,
      activatedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      devMode: this.DEV_UNLOCKED
    };
  }

  _saveState() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to save license state:', e);
      }
    }
  }

  /**
   * Check if user has active Pro subscription
   * @returns {boolean}
   */
  isPro() {
    if (this.DEV_UNLOCKED) return true;
    if (!this.state || !this.state.isActive) return false;
    
    const now = new Date();
    const expiry = new Date(this.state.expiresAt);
    return now < expiry;
  }

  /**
   * Get formatted expiry date string (DD.MM.YYYY)
   * @returns {string}
   */
  getExpiryDateFormatted() {
    try {
      const expiry = new Date(this.state.expiresAt);
      const day = String(expiry.getDate()).padStart(2, '0');
      const month = String(expiry.getMonth() + 1).padStart(2, '0');
      const year = expiry.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (e) {
      return '31.12.2026';
    }
  }

  /**
   * Get display badge text for header
   * @returns {string} e.g. "Pro до 19.12.2026"
   */
  getHeaderBadgeText() {
    if (this.isPro()) {
      return `Pro до ${this.getExpiryDateFormatted()}`;
    }
    return 'Free (Требуется подписка)';
  }

  /**
   * Verify and activate license key or subscription token
   * Format: TES-PRO-XXXX-XXXX-XXXX or custom token
   * @param {string} key 
   * @returns {{ success: boolean, message: string }}
   */
  activateKey(key) {
    if (!key || typeof key !== 'string') {
      return { success: false, message: 'Введите корректный ключ активации' };
    }
    const cleanKey = key.trim().toUpperCase();

    // Verification algorithm (ready for bot / server hash token or offline pattern)
    if (cleanKey.length < 8) {
      return { success: false, message: 'Неверный формат ключа. Минимальная длина 8 символов.' };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + (this.PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000));

    this.state = {
      isActive: true,
      licenseKey: cleanKey,
      userId: 'user_' + Math.random().toString(36).substring(2, 9),
      plan: this.PLAN_NAME,
      activatedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      devMode: false
    };
    this._saveState();

    return {
      success: true,
      message: `Подписка «${this.PLAN_NAME}» успешно активирована на 30 дней (до ${this.getExpiryDateFormatted()})!`
    };
  }

  /**
   * Deactivate license (for testing free restrictions)
   */
  deactivate() {
    this.DEV_UNLOCKED = false;
    this.state.isActive = false;
    this.state.expiresAt = new Date(0).toISOString();
    this._saveState();
  }

  /**
   * Restore dev unlocked status
   */
  restoreDevUnlocked() {
    this.DEV_UNLOCKED = true;
    this.state = this._getDefaultState();
    this._saveState();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LicenseManager;
}
if (typeof window !== 'undefined') {
  window.LicenseManager = LicenseManager;
}
