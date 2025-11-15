/**
 * Language Selector Component
 * Reusable UI component for language switching across Polynesian apps
 * 
 * Usage:
 * const selector = new LanguageSelector(translationService, document.getElementById('language-container'))
 * selector.render()
 */

class LanguageSelector {
    constructor(translationService, container, options = {}) {
        this.translationService = translationService
        this.container = container
        this.options = {
            showNativeNames: true,
            style: 'dropdown', // 'dropdown', 'buttons', 'minimal'
            className: 'polynesian-language-selector',
            onChange: null, // Callback function
            ...options
        }
        
        this.currentLanguage = translationService.getCurrentLanguage()
        
        // Listen for language changes from other sources
        translationService.addEventListener('languageChanged', (data) => {
            this.currentLanguage = data.to
            this.updateUI()
        })
    }

    /**
     * Render the language selector
     */
    render() {
        if (!this.container) {
            console.error('Language selector container not found')
            return
        }

        const languages = this.translationService.getAvailableLanguages()
        
        switch (this.options.style) {
            case 'buttons':
                this.renderButtons(languages)
                break
            case 'minimal':
                this.renderMinimal(languages)
                break
            case 'dropdown':
            default:
                this.renderDropdown(languages)
                break
        }
    }

    /**
     * Render dropdown style selector
     */
    renderDropdown(languages) {
        const select = document.createElement('select')
        select.className = `${this.options.className} ${this.options.className}--dropdown`
        select.setAttribute('aria-label', 'Select Language')
        
        languages.forEach(lang => {
            const option = document.createElement('option')
            option.value = lang.code
            option.textContent = this.options.showNativeNames 
                ? `${lang.name} (${lang.nativeName})`
                : lang.name
            option.selected = lang.code === this.currentLanguage
            select.appendChild(option)
        })
        
        select.addEventListener('change', (e) => {
            this.handleLanguageChange(e.target.value)
        })
        
        this.container.innerHTML = ''
        this.container.appendChild(select)
        this.selectElement = select
    }

    /**
     * Render button style selector
     */
    renderButtons(languages) {
        const buttonGroup = document.createElement('div')
        buttonGroup.className = `${this.options.className} ${this.options.className}--buttons`
        buttonGroup.setAttribute('role', 'group')
        buttonGroup.setAttribute('aria-label', 'Language Selection')
        
        languages.forEach(lang => {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = `${this.options.className}__button`
            button.textContent = this.options.showNativeNames ? lang.nativeName : lang.name
            button.setAttribute('aria-label', `Switch to ${lang.name}`)
            button.dataset.language = lang.code
            
            if (lang.code === this.currentLanguage) {
                button.classList.add(`${this.options.className}__button--active`)
                button.setAttribute('aria-pressed', 'true')
            } else {
                button.setAttribute('aria-pressed', 'false')
            }
            
            button.addEventListener('click', () => {
                this.handleLanguageChange(lang.code)
            })
            
            buttonGroup.appendChild(button)
        })
        
        this.container.innerHTML = ''
        this.container.appendChild(buttonGroup)
        this.buttonGroup = buttonGroup
    }

    /**
     * Render minimal style selector (just language codes)
     */
    renderMinimal(languages) {
        const minimal = document.createElement('div')
        minimal.className = `${this.options.className} ${this.options.className}--minimal`
        minimal.setAttribute('role', 'group')
        minimal.setAttribute('aria-label', 'Language Selection')
        
        languages.forEach((lang, index) => {
            const link = document.createElement('button')
            link.type = 'button'
            link.className = `${this.options.className}__link`
            link.textContent = lang.code.toUpperCase()
            link.setAttribute('aria-label', `Switch to ${lang.name}`)
            link.dataset.language = lang.code
            
            if (lang.code === this.currentLanguage) {
                link.classList.add(`${this.options.className}__link--active`)
                link.setAttribute('aria-current', 'true')
            }
            
            link.addEventListener('click', () => {
                this.handleLanguageChange(lang.code)
            })
            
            minimal.appendChild(link)
            
            // Add separator between languages (except last)
            if (index < languages.length - 1) {
                const separator = document.createElement('span')
                separator.className = `${this.options.className}__separator`
                separator.textContent = ' | '
                separator.setAttribute('aria-hidden', 'true')
                minimal.appendChild(separator)
            }
        })
        
        this.container.innerHTML = ''
        this.container.appendChild(minimal)
        this.minimalElement = minimal
    }

    /**
     * Handle language change
     */
    async handleLanguageChange(languageCode) {
        if (languageCode === this.currentLanguage) {
            return // No change
        }

        // Show loading state
        this.setLoadingState(true)
        
        try {
            const success = await this.translationService.setLanguage(languageCode)
            
            if (success) {
                this.currentLanguage = languageCode
                this.updateUI()
                
                // Call custom onChange callback
                if (this.options.onChange) {
                    this.options.onChange(languageCode)
                }
                
                // Dispatch custom event
                this.container.dispatchEvent(new CustomEvent('languagechange', {
                    detail: { language: languageCode },
                    bubbles: true
                }))
            }
        } catch (error) {
            console.error('Language change failed:', error)
        } finally {
            this.setLoadingState(false)
        }
    }

    /**
     * Update UI to reflect current language
     */
    updateUI() {
        switch (this.options.style) {
            case 'buttons':
                this.updateButtonsUI()
                break
            case 'minimal':
                this.updateMinimalUI()
                break
            case 'dropdown':
            default:
                this.updateDropdownUI()
                break
        }
    }

    /**
     * Update dropdown UI
     */
    updateDropdownUI() {
        if (this.selectElement) {
            this.selectElement.value = this.currentLanguage
        }
    }

    /**
     * Update buttons UI
     */
    updateButtonsUI() {
        if (this.buttonGroup) {
            const buttons = this.buttonGroup.querySelectorAll('button')
            buttons.forEach(button => {
                const isActive = button.dataset.language === this.currentLanguage
                button.classList.toggle(`${this.options.className}__button--active`, isActive)
                button.setAttribute('aria-pressed', isActive.toString())
            })
        }
    }

    /**
     * Update minimal UI
     */
    updateMinimalUI() {
        if (this.minimalElement) {
            const links = this.minimalElement.querySelectorAll('button')
            links.forEach(link => {
                const isActive = link.dataset.language === this.currentLanguage
                link.classList.toggle(`${this.options.className}__link--active`, isActive)
                if (isActive) {
                    link.setAttribute('aria-current', 'true')
                } else {
                    link.removeAttribute('aria-current')
                }
            })
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(loading) {
        const element = this.selectElement || this.buttonGroup || this.minimalElement
        if (element) {
            element.classList.toggle(`${this.options.className}--loading`, loading)
            
            // Disable interactions during loading
            const interactiveElements = element.querySelectorAll('button, select')
            interactiveElements.forEach(el => {
                el.disabled = loading
            })
        }
    }

    /**
     * Destroy the language selector
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = ''
        }
    }
}

// Default CSS (can be customized)
const defaultCSS = `
.polynesian-language-selector {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Dropdown Style */
.polynesian-language-selector--dropdown select {
    padding: 8px 12px;
    border: 1px solid #d2d2d7;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
}

.polynesian-language-selector--dropdown select:focus {
    outline: none;
    border-color: #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

/* Button Style */
.polynesian-language-selector--buttons {
    display: flex;
    gap: 8px;
}

.polynesian-language-selector__button {
    padding: 8px 16px;
    border: 1px solid #d2d2d7;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.polynesian-language-selector__button:hover {
    background: #f9f9fb;
}

.polynesian-language-selector__button--active {
    background: #007aff;
    color: white;
    border-color: #007aff;
}

/* Minimal Style */
.polynesian-language-selector--minimal {
    font-size: 14px;
}

.polynesian-language-selector__link {
    background: none;
    border: none;
    cursor: pointer;
    color: #007aff;
    text-decoration: none;
    font-size: inherit;
}

.polynesian-language-selector__link:hover {
    text-decoration: underline;
}

.polynesian-language-selector__link--active {
    font-weight: bold;
    color: #1d1d1f;
}

.polynesian-language-selector__separator {
    color: #8e8e93;
}

/* Loading State */
.polynesian-language-selector--loading {
    opacity: 0.6;
    pointer-events: none;
}
`

// Inject default CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('polynesian-language-selector-css')) {
    const style = document.createElement('style')
    style.id = 'polynesian-language-selector-css'
    style.textContent = defaultCSS
    document.head.appendChild(style)
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LanguageSelector
}
if (typeof window !== 'undefined') {
    window.LanguageSelector = LanguageSelector
}