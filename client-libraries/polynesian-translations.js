/**
 * Polynesian Translation Service
 * Client library for accessing centralized translation system
 * 
 * Usage:
 * const translator = new PolynesianTranslations('jemt4-music', 'https://your-supabase-url.supabase.co')
 * await translator.initialize()
 * console.log(translator.t('buttons.ok')) // "OK" or "ʻOk"
 */

class PolynesianTranslations {
    constructor(projectSlug, apiBaseUrl) {
        this.projectSlug = projectSlug
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '') // Remove trailing slash
        this.currentLanguage = this.getStoredLanguage()
        this.translations = {}
        this.availableLanguages = []
        this.lastUpdate = null
        this.updateInterval = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds
        
        // Event listeners for language changes
        this.listeners = new Set()
        
        // Storage keys
        this.storageKeys = {
            language: 'polynesian_language',
            translations: `polynesian_translations_${projectSlug}`,
            lastUpdate: `polynesian_last_update_${projectSlug}`
        }
    }

    /**
     * Initialize the translation service
     * Loads translations and sets up periodic updates
     */
    async initialize() {
        try {
            // Load available languages
            await this.loadAvailableLanguages()
            
            // Load translations (from cache or API)
            await this.loadTranslations()
            
            // Set up periodic update check
            this.setupPeriodicUpdates()
            
            console.log(`Polynesian Translations initialized for ${this.projectSlug} in ${this.currentLanguage}`)
        } catch (error) {
            console.error('Failed to initialize Polynesian Translations:', error)
            // Load from localStorage as fallback
            this.loadFromCache()
        }
    }

    /**
     * Get stored language preference
     * Defaults to English if none set
     */
    getStoredLanguage() {
        const stored = localStorage.getItem(this.storageKeys.language)
        // Only allow enabled languages
        if (['eng', 'haw'].includes(stored)) {
            return stored
        }
        return 'eng' // Default to English
    }

    /**
     * Load available languages from API
     */
    async loadAvailableLanguages() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/functions/v1/translations/available-languages`)
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            this.availableLanguages = await response.json()
        } catch (error) {
            console.warn('Failed to load available languages:', error)
            // Fallback to hardcoded values
            this.availableLanguages = [
                { code: 'eng', name: 'English', nativeName: 'English', isActive: true },
                { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', isActive: true }
            ]
        }
    }

    /**
     * Load translations from API or cache
     */
    async loadTranslations(forceRefresh = false) {
        const lastUpdate = localStorage.getItem(this.storageKeys.lastUpdate)
        const cacheAge = lastUpdate ? Date.now() - parseInt(lastUpdate) : Infinity
        
        // Use cache if it's fresh and not forcing refresh
        if (!forceRefresh && cacheAge < this.updateInterval) {
            this.loadFromCache()
            return
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/functions/v1/translations/${this.projectSlug}/${this.currentLanguage}`
            )
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const data = await response.json()
            
            // Remove metadata from translations
            const { _metadata, ...translations } = data
            this.translations = translations
            this.lastUpdate = Date.now()
            
            // Cache the translations
            this.saveToCache()
            
            console.log(`Loaded ${Object.keys(translations).length} translations for ${this.projectSlug}`)
            
        } catch (error) {
            console.warn('Failed to load translations from API:', error)
            this.loadFromCache()
        }
    }

    /**
     * Load translations from localStorage cache
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem(this.storageKeys.translations)
            if (cached) {
                this.translations = JSON.parse(cached)
                console.log(`Loaded ${Object.keys(this.translations).length} translations from cache`)
            }
        } catch (error) {
            console.warn('Failed to load from cache:', error)
            this.translations = {}
        }
    }

    /**
     * Save translations to localStorage cache
     */
    saveToCache() {
        try {
            localStorage.setItem(this.storageKeys.translations, JSON.stringify(this.translations))
            localStorage.setItem(this.storageKeys.lastUpdate, this.lastUpdate.toString())
        } catch (error) {
            console.warn('Failed to save to cache:', error)
        }
    }

    /**
     * Set up periodic update checking
     */
    setupPeriodicUpdates() {
        // Check for updates every hour
        setInterval(async () => {
            const lastUpdate = localStorage.getItem(this.storageKeys.lastUpdate)
            const cacheAge = lastUpdate ? Date.now() - parseInt(lastUpdate) : Infinity
            
            if (cacheAge >= this.updateInterval) {
                console.log('Checking for translation updates...')
                await this.loadTranslations(true)
                this.notifyListeners('updated')
            }
        }, 60 * 60 * 1000) // Check every hour
    }

    /**
     * Translate a key path
     * @param {string} keyPath - The translation key (e.g., 'buttons.ok')
     * @param {Object} params - Optional parameters for string interpolation
     * @returns {string} The translated string or fallback
     */
    t(keyPath, params = {}) {
        let translation = this.translations[keyPath]
        
        // Fallback strategy: try English if current language translation missing
        if (!translation && this.currentLanguage !== 'eng') {
            // This would require loading English translations as fallback
            // For now, just return the key path
            translation = keyPath
        }
        
        // If still no translation, return the key path
        if (!translation) {
            console.warn(`Missing translation for key: ${keyPath}`)
            return keyPath
        }
        
        // Simple parameter interpolation
        // Use split/join instead of regex to prevent ReDoS attacks
        if (params && Object.keys(params).length > 0) {
            Object.keys(params).forEach(key => {
                const placeholder = `{{${key}}}`;
                translation = translation.split(placeholder).join(params[key]);
            })
        }

        return translation
    }

    /**
     * Change the current language
     * @param {string} languageCode - The new language code
     */
    async setLanguage(languageCode) {
        if (!['eng', 'haw'].includes(languageCode)) {
            console.warn(`Unsupported language: ${languageCode}`)
            return false
        }
        
        if (languageCode === this.currentLanguage) {
            return true // No change needed
        }
        
        const oldLanguage = this.currentLanguage
        this.currentLanguage = languageCode
        
        // Save to localStorage (shared across all apps)
        localStorage.setItem(this.storageKeys.language, languageCode)
        
        try {
            // Load new language translations
            await this.loadTranslations(true)
            this.notifyListeners('languageChanged', { from: oldLanguage, to: languageCode })
            return true
        } catch (error) {
            console.error('Failed to change language:', error)
            // Revert on error
            this.currentLanguage = oldLanguage
            localStorage.setItem(this.storageKeys.language, oldLanguage)
            return false
        }
    }

    /**
     * Get current language code
     */
    getCurrentLanguage() {
        return this.currentLanguage
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return this.availableLanguages
    }

    /**
     * Check if translations are loaded
     */
    isReady() {
        return Object.keys(this.translations).length > 0
    }

    /**
     * Force refresh translations from server
     */
    async refresh() {
        await this.loadTranslations(true)
        this.notifyListeners('refreshed')
    }

    /**
     * Add event listener for translation events
     * Events: 'languageChanged', 'updated', 'refreshed'
     */
    addEventListener(event, callback) {
        this.listeners.add({ event, callback })
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        this.listeners.forEach(listener => {
            if (listener.event === event && listener.callback === callback) {
                this.listeners.delete(listener)
            }
        })
    }

    /**
     * Notify event listeners
     */
    notifyListeners(event, data = {}) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                try {
                    listener.callback(data)
                } catch (error) {
                    console.error('Translation event listener error:', error)
                }
            }
        })
    }

    /**
     * Get translation statistics
     */
    getStats() {
        return {
            project: this.projectSlug,
            language: this.currentLanguage,
            translationCount: Object.keys(this.translations).length,
            lastUpdate: this.lastUpdate ? new Date(this.lastUpdate).toISOString() : null,
            cacheAge: this.lastUpdate ? Date.now() - this.lastUpdate : null
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolynesianTranslations
}
if (typeof window !== 'undefined') {
    window.PolynesianTranslations = PolynesianTranslations
}