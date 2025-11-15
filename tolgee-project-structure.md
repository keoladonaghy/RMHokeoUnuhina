# Tolgee Project Structure & Implementation Plan

## Recommended Tolgee Project Organization

### Project Hierarchy

```
Polynesian Translation System/
├── 1. polynesian-common          # Shared UI elements
├── 2. polynesian-games           # Game terminology
├── 3. jemt4-music               # Music theory (JEMT4)
├── 4. kimiKupu-specific         # Word game unique content
└── 5. pangaKupu-specific        # Crossword unique content
```

## Project 1: polynesian-common

**Purpose**: Universal UI elements shared across all applications

**Languages**: eng, haw, mao, tah, fra, spa, smo, ton

**Namespaces**:
```json
{
  "buttons": {
    "ok": "OK",
    "cancel": "Cancel", 
    "close": "Close",
    "save": "Save",
    "delete": "Delete",
    "yes": "Yes",
    "no": "No",
    "help": "Help",
    "back": "Back",
    "next": "Next"
  },
  "states": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "failed": "Failed",
    "complete": "Complete",
    "pending": "Pending",
    "comingSoon": "Coming soon..."
  },
  "languages": {
    "english": "English",
    "hawaiian": "Hawaiian",
    "maori": "Māori",
    "tahitian": "Tahitian", 
    "french": "French",
    "spanish": "Spanish",
    "samoan": "Samoan",
    "tongan": "Tongan"
  },
  "interface": {
    "interfaceLanguage": "Interface Language",
    "gameLanguage": "Game Language",
    "language": "Language",
    "settings": "Settings",
    "about": "About",
    "instructions": "Instructions",
    "statistics": "Statistics"
  }
}
```

**Tolgee Export Format**: 
- API Endpoint: `/api/projects/polynesian-common/export/{language}.json`
- Usage: All applications load this first

## Project 2: polynesian-games

**Purpose**: Gaming terminology shared between KimiKupu and PangaKupu

**Languages**: eng, haw, mao, tah, fra, spa, smo, ton

**Namespaces**:
```json
{
  "actions": {
    "play": "Play",
    "pause": "Pause", 
    "restart": "Restart",
    "hint": "Hint",
    "skip": "Skip",
    "undo": "Undo",
    "submit": "Submit",
    "newGame": "New Game",
    "refresh": "Refresh"
  },
  "messages": {
    "wordFound": "Congratulations!",
    "wordNotFound": "Word not found",
    "notEnoughLetters": "Not enough letters",
    "invalidWord": "Invalid word", 
    "alreadyFound": "Already found",
    "gameWon": "You won!",
    "gameLost": "Game over",
    "tryAgain": "Try again",
    "wellDone": "Well done!"
  },
  "stats": {
    "score": "Score",
    "level": "Level",
    "streak": "Streak",
    "best": "Best",
    "current": "Current",
    "total": "Total",
    "average": "Average"
  },
  "progress": {
    "wordsFound": "Words Found",
    "wordsRemaining": "Words Remaining",
    "hintsUsed": "Hints Used", 
    "attempts": "Attempts",
    "timeElapsed": "Time Elapsed",
    "gamesPlayed": "Games Played",
    "successRate": "Success Rate"
  }
}
```

## Project 3: jemt4-music

**Purpose**: Music theory terminology specific to JEMT4

**Languages**: eng, haw (primary), mao, tah, fra, spa

**Namespaces**:
```json
{
  "instruments": {
    "ukulele": "'Ukulele",
    "guitar": "Guitar", 
    "acousticBass": "Acoustic Bass",
    "electricBass": "Electric Bass",
    "piano": "Piano",
    "voice": "Voice"
  },
  "chords": {
    "major": "Major",
    "minor": "Minor",
    "seventh": "7th",
    "diminished": "Diminished",
    "augmented": "Augmented",
    "root": "Root",
    "type": "Type",
    "inversion": "Inversion",
    "selectRoot": "Select Root",
    "selectType": "Select Type"
  },
  "theory": {
    "scale": "Scale",
    "key": "Key",
    "note": "Note", 
    "interval": "Interval",
    "progression": "Progression",
    "rhythm": "Rhythm",
    "tempo": "Tempo",
    "harmony": "Harmony"
  },
  "actions": {
    "playChord": "Play Chord",
    "listen": "Listen",
    "practice": "Practice",
    "learn": "Learn",
    "chooseInstrument": "Choose Your Instrument"
  },
  "content": {
    "introduction": "Greetings and welcome to \"Just Enough Music Theory for Hawaiian Musicians\". You will find resources and lessons for the most essential elements of music theory that are found in Hawaiian music. This project is in a developmental stage at the moment, so please bear with us!",
    "contentComingSoon": "Content coming soon..."
  }
}
```

## Project 4: kimiKupu-specific

**Purpose**: Unique content for the word guessing game

**Languages**: eng, haw, mao, tah, smo

**Namespaces**:
```json
{
  "welcome": {
    "title": "Reo Moana Puzzle",
    "startButton": "New Game",
    "helpButton": "How to Play"
  },
  "instructions": {
    "title": "How to Play",
    "orthography": "Use proper diacritics (kahakō and ʻokina) where required",
    "letterSelection": "Tap letters to form your guess. Each guess must be a valid word.",
    "autoSubmit": "Press Enter when your word is complete."
  },
  "gameplay": {
    "currentGuess": "Current Guess",
    "selectLetters": "Select Letters",
    "formingWords": "Forming Words", 
    "submitGuess": "Submit Your Guess",
    "diacriticals": "Use proper diacritics where required"
  },
  "about": {
    "title": "About This Game",
    "description": "This is an open source adaptation of the word guessing game Wordle, designed for Polynesian languages.",
    "adaptedBy": "Adapted by",
    "originalCode": "Original code",
    "customizeText": "and customize it for another language!"
  }
}
```

## Project 5: pangaKupu-specific

**Purpose**: Crossword-specific terminology

**Languages**: eng, haw, mao, tah

**Namespaces**:
```json
{
  "branding": {
    "title": "Panga Kupu", 
    "subtitle": "Pacific Language Crossword"
  },
  "crossword": {
    "across": "Across",
    "down": "Down",
    "clue": "Clue", 
    "solution": "Solution",
    "grid": "Grid",
    "puzzle": "Puzzle"
  },
  "gameplay": {
    "findWords": "Find words in the crossword by tapping letters",
    "longPress": "Long-press vowels for macrons",
    "examples": "Examples"
  }
}
```

## API Integration Strategy

### Loading Sequence for Applications

**JEMT4 Application**:
```javascript
// Load translations in priority order
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/jemt4-music/export/haw.json')
]);
```

**KimiKupu Application**:
```javascript
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/polynesian-games/export/haw.json'),
  fetch('/api/projects/kimiKupu-specific/export/haw.json')
]);
```

**PangaKupu Application**:
```javascript
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/polynesian-games/export/haw.json'), 
  fetch('/api/projects/pangaKupu-specific/export/haw.json')
]);
```

## Tolgee Project Settings

### polynesian-common
```yaml
Project Name: polynesian-common
Description: Shared UI elements for Polynesian language applications
Base Language: eng
Auto-translation: Enabled for initial drafts
Review Required: Yes for haw, mao, tah
Machine Translation: Google Translate for fra, spa
```

### polynesian-games
```yaml
Project Name: polynesian-games  
Description: Gaming terminology shared across word games
Base Language: eng
Auto-translation: Enabled for fra, spa, smo, ton
Review Required: Yes for haw, mao, tah
```

### jemt4-music
```yaml
Project Name: jemt4-music
Description: Music theory terminology for Hawaiian music education
Base Language: eng
Priority Languages: eng, haw
Auto-translation: Disabled (specialized terminology)
Review Required: Yes for all languages
```

## Implementation Timeline

### Week 1: Foundation Setup
- **Day 1-2**: Set up Tolgee instance with 5 projects
- **Day 3-4**: Import existing translations into standard format
- **Day 5**: Configure API keys and access permissions

### Week 2: Common Elements
- **Day 1-2**: Complete polynesian-common translations
- **Day 3-4**: Complete polynesian-games translations  
- **Day 5**: Test API integration with common elements

### Week 3: Project-Specific Content
- **Day 1-2**: Complete jemt4-music translations
- **Day 3**: Complete kimiKupu-specific translations
- **Day 4**: Complete pangaKupu-specific translations
- **Day 5**: Full system testing

### Week 4: Integration & Testing
- **Day 1-2**: Update JEMT4 to use new API structure
- **Day 3**: Update KimiKupu to use new API structure
- **Day 4**: Update PangaKupu to use new API structure
- **Day 5**: Performance testing and optimization

## Quality Assurance Process

### Translation Review Workflow
1. **Import existing content** → Draft status
2. **Community review** → Pending status  
3. **Expert validation** → Approved status
4. **Production release** → Published status

### Testing Requirements
- ✅ All keys load correctly from API
- ✅ Fallback to English if translation missing
- ✅ Language switching works across all apps
- ✅ Performance acceptable (< 2s load time)
- ✅ Offline fallback functional

## Maintenance Strategy

### Regular Tasks
- **Weekly**: Review translation completeness
- **Monthly**: Update shared terminology consistency  
- **Quarterly**: Add new language support
- **Annually**: Full system audit and optimization

### Scaling Considerations
- Monitor API response times as content grows
- Implement CDN for static translation assets
- Consider regional Tolgee instances for global users
- Plan for automated translation memory systems

---

This structure provides a scalable foundation that can grow from 3 projects to dozens while maintaining consistency and reducing duplication across your Polynesian language ecosystem.