# Standardized Translation Format Specification

## Overview

This document defines the standardized JSON format for UI translations across all Polynesian language projects, designed for RMHTS integration and future expansion.

## Language Code Standard

### Primary Languages (Implementation Order)
1. **eng** - English (base language)
2. **haw** - Hawaiian ('Ōlelo Hawaiʻi)  
3. **mao** - Māori (Reo Māori)
4. **tah** - Tahitian (Reo Tahiti)

### Future Expansion Languages
5. **fra** - French (Français)
6. **spa** - Spanish (Español)  
7. **smo** - Samoan (Gagana Samoa)
8. **ton** - Tongan (Lea Fakatonga)

## JSON Structure Standard

### Format: Nested Namespace Architecture

```json
{
  "eng": {
    "namespace": {
      "section": {
        "key": "English text"
      }
    }
  },
  "haw": {
    "namespace": {
      "section": {
        "key": "Hawaiian text"
      }
    }
  }
}
```

## Core Namespace Structure

### 1. Common UI Elements (`common`)

**Universal elements shared across all projects**

```json
{
  "eng": {
    "common": {
      "buttons": {
        "ok": "OK",
        "cancel": "Cancel",
        "close": "Close", 
        "save": "Save",
        "delete": "Delete",
        "yes": "Yes",
        "no": "No",
        "newGame": "New Game",
        "refresh": "Refresh",
        "submit": "Submit",
        "back": "Back",
        "next": "Next",
        "help": "Help"
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
        "instructions": "Instructions"
      },
      "time": {
        "today": "Today",
        "yesterday": "Yesterday", 
        "week": "Week",
        "month": "Month",
        "year": "Year"
      },
      "numbers": {
        "first": "First",
        "second": "Second",
        "third": "Third",
        "total": "Total",
        "count": "Count"
      }
    }
  }
}
```

### 2. Game Elements (`games`)

**Shared gaming terminology across word games**

```json
{
  "eng": {
    "games": {
      "actions": {
        "play": "Play",
        "pause": "Pause",
        "restart": "Restart",
        "hint": "Hint",
        "skip": "Skip",
        "undo": "Undo"
      },
      "messages": {
        "wordFound": "Congratulations!",
        "wordNotFound": "Word not found",
        "notEnoughLetters": "Not enough letters", 
        "invalidWord": "Invalid word",
        "alreadyFound": "Already found",
        "gameWon": "You won!",
        "gameLost": "Game over",
        "tryAgain": "Try again"
      },
      "stats": {
        "score": "Score",
        "level": "Level",
        "streak": "Streak",
        "best": "Best",
        "average": "Average",
        "total": "Total",
        "current": "Current"
      },
      "progress": {
        "wordsFound": "Words Found",
        "wordsRemaining": "Words Remaining", 
        "hintsUsed": "Hints Used",
        "attempts": "Attempts",
        "timeElapsed": "Time Elapsed"
      }
    }
  }
}
```

### 3. Music Theory (`music`)

**Music-specific terminology for JEMT4**

```json
{
  "eng": {
    "music": {
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
        "inversion": "Inversion"
      },
      "theory": {
        "scale": "Scale",
        "key": "Key", 
        "note": "Note",
        "interval": "Interval",
        "progression": "Progression",
        "rhythm": "Rhythm",
        "tempo": "Tempo"
      },
      "actions": {
        "playChord": "Play Chord",
        "selectRoot": "Select Root",
        "selectType": "Select Type",
        "listen": "Listen",
        "practice": "Practice"
      }
    }
  }
}
```

### 4. Project-Specific Content

#### JEMT4 Specific (`jemt4`)
```json
{
  "eng": {
    "jemt4": {
      "branding": {
        "title": "Just Enough Music Theory For Hawaiian Musicians",
        "shortTitle": "JEMT4HM",
        "tagline": "Essential music theory for Hawaiian music"
      },
      "navigation": {
        "chooseInstrument": "Choose Your Instrument",
        "introduction": "Greetings and welcome to \"Just Enough Music Theory for Hawaiian Musicians\"..."
      },
      "chordBuilder": {
        "guitarTitle": "Guitar Chord Builder",
        "ukuleleTitle": "'Ukulele Chord Builder"
      }
    }
  }
}
```

#### KimiKupu Specific (`kimiKupu`)
```json
{
  "eng": {
    "kimiKupu": {
      "branding": {
        "title": "Reo Moana Puzzle",
        "subtitle": "Polynesian Word Game"
      },
      "welcome": {
        "startButton": "New Game",
        "helpButton": "How to Play"
      },
      "gameplay": {
        "currentGuess": "Current Guess",
        "letterSelection": "Select letters to form your guess",
        "orthography": "Use proper diacritics where required"
      }
    }
  }
}
```

#### PangaKupu Specific (`pangaKupu`)
```json
{
  "eng": {
    "pangaKupu": {
      "branding": {
        "title": "Panga Kupu",
        "subtitle": "Pacific Language Crossword"
      },
      "crossword": {
        "across": "Across",
        "down": "Down", 
        "clue": "Clue",
        "solution": "Solution"
      }
    }
  }
}
```

## Translation Key Naming Conventions

### 1. Key Format Rules
- **camelCase** for all keys
- **Descriptive** but concise
- **Hierarchical** structure reflecting UI organization
- **Consistent** terminology across projects

### 2. Standard Key Patterns

**Buttons**: `[action]Button` or just `[action]`
```json
"saveButton": "Save"     // ❌ Redundant
"save": "Save"           // ✅ Preferred
```

**Messages**: `[context][Type]`
```json
"wordNotFound": "Word not found"        // ✅ Clear context
"errorWordNotFound": "Word not found"   // ❌ Redundant prefix
```

**Titles**: `[section]Title`
```json
"aboutTitle": "About This Game"
```

### 3. Prohibited Patterns
- **Avoid abbreviations**: `btn`, `msg`, `txt`
- **No underscores**: `word_not_found`
- **No numbers in keys**: `button1`, `message2`
- **No language codes in keys**: `titleEn`, `titleHaw`

## File Organization Standards

### Development Phase Format
**Single file per project with all languages**

```
project-translations.json
{
  "eng": { /* all namespaces */ },
  "haw": { /* all namespaces */ },
  "mao": { /* all namespaces */ }
}
```

### RMHTS Production Format
**Namespace-based organization**

```
RMHTS-projects/
├── polynesian-common/      # Shared UI elements
├── polynesian-games/       # Game terminology  
├── jemt4-music/           # Music theory terms
├── kimiKupu-specific/     # KimiKupu unique content
└── pangaKupu-specific/    # PangaKupu unique content
```

## Translation Completeness Standards

### 1. Priority Levels

**Level 1 (Critical)**: Must be translated for basic functionality
- `common.buttons.*`
- `common.states.loading`
- `common.languages.*`

**Level 2 (Important)**: Should be translated for good UX
- `games.messages.*`
- `common.interface.*`

**Level 3 (Enhancement)**: Nice to have for full localization
- `common.time.*`
- `common.numbers.*`

### 2. Quality Standards

**Required for all translations:**
- ✅ Accurate meaning preservation
- ✅ Cultural appropriateness  
- ✅ Consistent terminology within language
- ✅ Proper diacritics (macrons, ʻokina)

**Forbidden:**
- ❌ Empty strings (`""`)
- ❌ Placeholder text (`"TODO"`, `"[Translation needed]"`)
- ❌ Mixed language content
- ❌ Direct English copies in non-English sections

## Implementation Templates

### Template 1: New Project Setup
```json
{
  "eng": {
    "common": {
      "buttons": {
        "ok": "OK",
        "cancel": "Cancel",
        "close": "Close"
      },
      "states": {
        "loading": "Loading..."
      },
      "interface": {
        "language": "Language"
      }
    },
    "[projectName]": {
      "branding": {
        "title": "[Project Title]"
      }
    }
  },
  "haw": {
    "common": {
      "buttons": {
        "ok": "'Oia",
        "cancel": "Ho'ōki", 
        "close": "Pani"
      },
      "states": {
        "loading": "Ke ho'ouka 'ia nei..."
      },
      "interface": {
        "language": "'Ōlelo"
      }
    },
    "[projectName]": {
      "branding": {
        "title": "[Hawaiian Project Title]"
      }
    }
  }
}
```

### Template 2: Adding New Language
```json
{
  "[newLanguageCode]": {
    "common": {
      "buttons": {
        "ok": "[Translation]",
        "cancel": "[Translation]",
        "close": "[Translation]"
      }
    }
  }
}
```

## Migration Process

### Phase 1: Standardization
1. **Create master template** with all current content
2. **Map existing keys** to new namespace structure
3. **Identify common elements** across projects
4. **Consolidate duplicate translations**

### Phase 2: Gap Analysis  
1. **Audit completeness** for each language
2. **Identify missing translations**
3. **Prioritize by usage frequency**
4. **Create translation tasks**

### Phase 3: Implementation
1. **Convert existing files** to standard format
2. **Set up RMHTS projects** with namespace structure
3. **Import standardized content**
4. **Update application code** to use new keys

## Validation Rules

### Automated Checks
- ✅ No empty string values
- ✅ Consistent key structure across languages
- ✅ Required keys present in all languages
- ✅ Valid JSON syntax

### Manual Review Required
- Cultural appropriateness of translations
- Consistency of terminology within each language
- Proper diacritical mark usage
- Context-appropriate language register

## Version Control Strategy

### File Naming Convention
```
translations-v[major].[minor]-[date].json
Example: translations-v1.2-20251012.json
```

### Change Documentation
- Track all key additions/removals
- Document translation updates
- Version compatibility notes
- Migration instructions for each version

---

This standardized format provides the foundation for a scalable, maintainable translation system that can grow with your Polynesian language project ecosystem.