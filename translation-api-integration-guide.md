# Polynesian Translation API Integration Guide

## Overview

This guide shows how to integrate the centralized Polynesian translation system into your apps (JEMT4, KimiKupu, PangaKupu, Huapala). The system provides:

- **Centralized translations** managed through the web interface
- **Automatic caching** with weekly updates
- **Cross-app language persistence** 
- **Offline support** for games
- **English/Hawaiian support** (Māori coming soon)

## Quick Start

### 1. Deploy the API Endpoint

First, deploy the Supabase Edge Function:

```bash
# In your supabase directory
supabase functions deploy translations
```

### 2. Include the Client Library

Add to your HTML:

```html
<script src="path/to/polynesian-translations.js"></script>
<script src="path/to/language-selector.js"></script>
```

Or import in your JavaScript:

```javascript
import PolynesianTranslations from './polynesian-translations.js'
import LanguageSelector from './language-selector.js'
```

### 3. Initialize Translation Service

```javascript
// Initialize for your specific project
const translator = new PolynesianTranslations(
    'jemt4-music',  // Your project slug
    'https://okzmnblaaeupbktoujcf.supabase.co'  // Your Supabase URL
)

// Initialize and load translations
await translator.initialize()

// Use translations
document.getElementById('ok-button').textContent = translator.t('buttons.ok')
document.getElementById('title').textContent = translator.t('interface.title')
```

## API Endpoints

### Base URL
```
https://your-supabase-url.supabase.co/functions/v1/translations
```

### Available Endpoints

#### Get Translations
```
GET /api/translations/:project/:language
```

**Parameters:**
- `project`: Project slug (`jemt4-music`, `kimiKupu-specific`, `pangaKupu-specific`, `polynesian-common`)
- `language`: Language code (`eng`, `haw`, `mao`)

**Response:**
```json
{
  "buttons.ok": "OK",
  "buttons.cancel": "Cancel",
  "interface.title": "Music Theory",
  "_metadata": {
    "project": "jemt4-music",
    "language": "eng",
    "count": 45,
    "timestamp": "2025-10-14T12:00:00Z",
    "version": "1.0.0"
  }
}
```

#### Get Available Languages
```
GET /api/translations/available-languages
```

**Response:**
```json
[
  {
    "code": "eng",
    "name": "English", 
    "nativeName": "English",
    "isActive": true
  },
  {
    "code": "haw",
    "name": "Hawaiian",
    "nativeName": "ʻŌlelo Hawaiʻi", 
    "isActive": true
  }
]
```

#### Get Available Projects
```
GET /api/translations/projects
```

**Response:**
```json
[
  {
    "slug": "polynesian-common",
    "name": "Common UI Elements",
    "description": "Shared translations across all apps"
  },
  {
    "slug": "jemt4-music", 
    "name": "JEMT4 Music Theory",
    "description": "Music theory specific translations"
  }
]
```

## Project-Specific Integration

### JEMT4 (Music Theory App)

```javascript
// Initialize
const translator = new PolynesianTranslations('jemt4-music', SUPABASE_URL)
await translator.initialize()

// Create language selector
const languageSelector = new LanguageSelector(
    translator,
    document.getElementById('language-selector-container'),
    {
        style: 'dropdown',
        onChange: (language) => {
            updateUI() // Refresh your UI with new translations
        }
    }
)
languageSelector.render()

// Use in UI
function updateUI() {
    document.querySelector('.ok-button').textContent = translator.t('buttons.ok')
    document.querySelector('.title').textContent = translator.t('music.title')
    document.querySelector('.chord-label').textContent = translator.t('music.chords.major')
}

// Listen for language changes
translator.addEventListener('languageChanged', () => {
    updateUI()
})
```

### KimiKupu & PangaKupu (Games - Offline Support)

```javascript
class GameTranslations {
    constructor(projectSlug) {
        this.translator = new PolynesianTranslations(projectSlug, SUPABASE_URL)
        this.isOffline = false
    }

    async initialize() {
        try {
            await this.translator.initialize()
            this.isOffline = false
        } catch (error) {
            console.log('Running in offline mode')
            this.isOffline = true
            // Translations will load from cache
        }
    }

    t(key) {
        return this.translator.t(key)
    }

    // Game-specific helper methods
    getGameMessages() {
        return {
            start: this.t('game.messages.start'),
            gameOver: this.t('game.messages.gameOver'),
            newGame: this.t('buttons.newGame'),
            wordFound: this.t('game.messages.wordFound')
        }
    }
}

// Usage in game
const gameTranslations = new GameTranslations('kimiKupu-specific')
await gameTranslations.initialize()

const messages = gameTranslations.getGameMessages()
showMessage(messages.wordFound) // "Word found!" or "Loa'a ka hua'ōlelo!"
```

### Huapala (Online App)

```javascript
// Simple integration for online-only app
const translator = new PolynesianTranslations('huapala-specific', SUPABASE_URL)

// Initialize with error handling
try {
    await translator.initialize()
    console.log('Translations loaded successfully')
} catch (error) {
    console.error('Failed to load translations, falling back to English')
    // Handle graceful degradation
}

// Update UI function
function translatePage() {
    // Translate all elements with data-translate attribute
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate')
        element.textContent = translator.t(key)
    })
}

// HTML usage
// <button data-translate="buttons.save">Save</button>
// <h1 data-translate="interface.title">Title</h1>
```

## Language Selector Styles

### Dropdown Style (Default)
```javascript
const selector = new LanguageSelector(translator, container, {
    style: 'dropdown',
    showNativeNames: true
})
```

### Button Style
```javascript
const selector = new LanguageSelector(translator, container, {
    style: 'buttons',
    showNativeNames: true,
    onChange: (language) => console.log('Language changed to:', language)
})
```

### Minimal Style
```javascript
const selector = new LanguageSelector(translator, container, {
    style: 'minimal',  // Shows "ENG | HAW"
    showNativeNames: false
})
```

## Translation Key Structure

### Common Keys (Available to All Apps)
```
buttons.ok
buttons.cancel
buttons.save
buttons.delete
buttons.close
buttons.help
buttons.newGame
buttons.refresh

interface.title
interface.settings
interface.about
interface.instructions
interface.language
interface.interfaceLanguage
interface.gameLanguage

states.loading
states.error
states.success
states.notFound
states.comingSoon

languages.english
languages.hawaiian
languages.maori
languages.tahitian
languages.french
languages.spanish
languages.samoan
languages.tongan
```

### Project-Specific Keys

**JEMT4 Music Theory:**
```
music.instruments.ukulele
music.instruments.guitar
music.chords.major
music.chords.minor
music.theory.root
music.theory.progression
```

**KimiKupu Game:**
```
game.messages.start
game.messages.wordFound
game.messages.gameOver
game.scoring.points
game.timer.timeLeft
```

**PangaKupu Crossword:**
```
crossword.clues.across
crossword.clues.down
crossword.grid.clear
crossword.hints.available
```

## Advanced Usage

### String Interpolation
```javascript
// Translation: "Hello {{name}}, you have {{count}} messages"
const message = translator.t('messages.welcome', {
    name: 'Keola',
    count: 5
})
// Result: "Hello Keola, you have 5 messages"
```

### Event Handling
```javascript
// Listen for translation updates
translator.addEventListener('updated', () => {
    console.log('Translations were updated from server')
    updateUI()
})

translator.addEventListener('languageChanged', (data) => {
    console.log(`Language changed from ${data.from} to ${data.to}`)
    updateUI()
})
```

### Manual Refresh
```javascript
// Force refresh from server (ignores cache)
await translator.refresh()

// Check if translations are ready
if (translator.isReady()) {
    updateUI()
}

// Get statistics
console.log(translator.getStats())
// {
//   project: "jemt4-music",
//   language: "haw", 
//   translationCount: 45,
//   lastUpdate: "2025-10-14T12:00:00Z",
//   cacheAge: 3600000
// }
```

### Custom CSS for Language Selector
```css
/* Customize dropdown style */
.polynesian-language-selector--dropdown select {
    background: #f5f5f7;
    border: 2px solid #007aff;
    border-radius: 8px;
    padding: 12px;
    font-size: 16px;
}

/* Customize button style */
.polynesian-language-selector__button {
    background: linear-gradient(45deg, #007aff, #5ac8fa);
    color: white;
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
}

.polynesian-language-selector__button--active {
    background: linear-gradient(45deg, #ff3b30, #ff9500);
}
```

## Error Handling

### Network Errors
```javascript
translator.addEventListener('error', (error) => {
    console.error('Translation service error:', error)
    
    // Show user-friendly message
    showNotification(translator.t('states.error'))
    
    // Fallback to cached translations
    translator.loadFromCache()
})
```

### Missing Translations
```javascript
// The t() method automatically falls back to the key path
const text = translator.t('missing.key') // Returns "missing.key" if not found

// Check if translation exists
if (translator.translations['buttons.ok']) {
    // Translation exists
}
```

## Deployment Checklist

### 1. Supabase Setup
- [ ] Edge function deployed: `supabase functions deploy translations`
- [ ] Database tables populated with translations
- [ ] API keys configured correctly

### 2. Client Integration
- [ ] Client libraries included in each app
- [ ] Project slugs configured correctly
- [ ] Language selectors added to UI
- [ ] Translation keys updated in code

### 3. Testing
- [ ] Language switching works across apps
- [ ] Offline mode works for games
- [ ] Translations update after 1 week
- [ ] Error handling graceful

### 4. Performance
- [ ] Translations cached in localStorage
- [ ] API responses cached by browser (1 hour)
- [ ] UI updates efficiently after language change

## Support & Troubleshooting

### Common Issues

**Translations not loading:**
- Check browser console for errors
- Verify Supabase URL and function deployment
- Check network connectivity

**Language not persisting:**
- Verify localStorage is working
- Check if language code is supported ('eng', 'haw')

**UI not updating:**
- Ensure you're listening for `languageChanged` event
- Call your `updateUI()` function after language change

**Cache not updating:**
- Default update interval is 1 week
- Use `translator.refresh()` to force update
- Check `translator.getStats()` for cache age

### Debug Information
```javascript
// Enable debug logging
translator.debug = true

// Check current state
console.log('Translation service stats:', translator.getStats())
console.log('Available languages:', translator.getAvailableLanguages())
console.log('Current language:', translator.getCurrentLanguage())
console.log('Translation count:', Object.keys(translator.translations).length)
```

---

**Last Updated:** October 14, 2025  
**API Version:** 1.0.0  
**Client Library Version:** 1.0.0