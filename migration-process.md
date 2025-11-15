# Migration Process: Current Formats to Standardized RMHTS System

## Overview

This document outlines the step-by-step process for migrating your existing translation files to the standardized RMHTS system using 3-letter language codes and the new namespace structure.

## Pre-Migration Assessment

### Current State Inventory
1. **JEMT4**: 4 JSON files (common, homepage, settings, development_log)
2. **KimiKupu**: 5 interface JSON files (eng, haw, mao, tah, smo)
3. **PangaKupu**: 1 interface JSON file (eng only)

### Target State Goals
- **5 RMHTS projects** with standardized namespaces
- **8 language support** (eng, haw, mao, tah, fra, spa, smo, ton)
- **Consolidated common elements** across all projects
- **Elimination of translation gaps**

## Migration Process Phases

### Phase 1: Content Consolidation (Week 1)

#### Step 1.1: Extract Common Elements
**Goal**: Identify and extract shared UI elements

**Actions**:
1. **Audit all existing JSON files** for overlapping keys
2. **Map to common namespace** using standardized template
3. **Create master common translation file**

**From JEMT4 common.json**:
```json
// Extract these to polynesian-common
"buttons": { "save": "Save", "cancel": "Cancel", "close": "Close" }
"states": { "loading": "Loading...", "error": "Error" }
"language": { "english": "English", "hawaiian": "'Ōlelo Hawaiʻi" }
```

**From KimiKupu interface files**:
```json
// Extract these to polynesian-common + polynesian-games
"languageDropdown": { "ok": "OK", "cancel": "Cancel" }
"game.messages": { "wordFound": "Congratulations!", "wordNotFound": "Word not found" }
```

#### Step 1.2: Standardize Language Codes
**Current** → **Target**:
- `en` → `eng`
- `haw` → `haw` (no change)
- `mao` → `mao` (no change)  
- `tah` → `tah` (no change)
- Add: `fra`, `spa`, `smo`, `ton`

#### Step 1.3: Create Project-Specific Content
**JEMT4 Music Theory**:
```json
"jemt4": {
  "branding": {
    "title": "Just Enough Music Theory For Hawaiian Musicians"
  },
  "navigation": {
    "chooseInstrument": "Choose Your Instrument"
  }
}
```

**KimiKupu Specific**:
```json
"kimiKupu": {
  "welcome": {
    "title": "Reo Moana Puzzle",
    "startButton": "New Game"
  }
}
```

### Phase 2: Template Application (Week 1-2)

#### Step 2.1: Apply Standard Format
**Input**: Existing scattered JSON files  
**Output**: 5 standardized template files

**Template Mapping Process**:
1. **Load provided templates**: `polynesian-common-template.json`, `polynesian-games-template.json`
2. **Map existing content** to template structure
3. **Fill gaps** using template translations
4. **Validate completeness** against requirements

#### Step 2.2: Quality Assurance
**Automated Checks**:
- ✅ No empty strings (`""`)
- ✅ All 8 languages have same key structure  
- ✅ Proper diacritical marks in Hawaiian/Māori/Tahitian
- ✅ Valid JSON syntax

**Manual Review**:
- Cultural appropriateness of translations
- Consistency within each language
- Context-appropriate language register

### Phase 3: RMHTS Setup (Week 2)

#### Step 3.1: Create RMHTS Projects
**In RMHTS Dashboard**:

1. **polynesian-common**
   - Base language: `eng`
   - Enabled languages: `eng`, `haw`, `mao`, `tah`, `fra`, `spa`, `smo`, `ton`
   - Auto-translation: Enabled for `fra`, `spa`, `smo`, `ton`

2. **polynesian-games**
   - Base language: `eng`
   - Enabled languages: `eng`, `haw`, `mao`, `tah`, `fra`, `spa`, `smo`, `ton`
   - Auto-translation: Enabled for `fra`, `spa`, `smo`, `ton`

3. **jemt4-music**
   - Base language: `eng`
   - Priority languages: `eng`, `haw`
   - Enabled languages: `eng`, `haw`, `mao`, `tah`, `fra`, `spa`

4. **kimiKupu-specific**
   - Base language: `eng`
   - Enabled languages: `eng`, `haw`, `mao`, `tah`, `smo`

5. **pangaKupu-specific**
   - Base language: `eng`
   - Enabled languages: `eng`, `haw`, `mao`, `tah`

#### Step 3.2: Import Translations
**For each project**:
1. **Import base language** (English) first
2. **Import existing translations** (Hawaiian, Māori, Tahitian)
3. **Generate machine translations** for French, Spanish
4. **Review and approve** all imported content

#### Step 3.3: Configure API Access
**Generate API keys** for each project:
- Read-only keys for production applications
- Read-write keys for translation management
- Configure CORS settings for web applications

### Phase 4: Application Integration (Week 3)

#### Step 4.1: Update JEMT4
**Replace existing i18n system**:

**Before**:
```javascript
import commonEn from './i18n/common.json';
import homepageEn from './i18n/homepage.json';
```

**After**:
```javascript
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/jemt4-music/export/haw.json')
]);
```

**Key Mapping Updates**:
- `common.buttons.save` → `buttons.save`
- `homepage.instruments.ukulele` → `instruments.ukulele`
- `common.language.switchLanguage` → `interface.language`

#### Step 4.2: Update KimiKupu
**API Integration**:
```javascript
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/polynesian-games/export/haw.json'), 
  fetch('/api/projects/kimiKupu-specific/export/haw.json')
]);
```

**Key Mapping Examples**:
- `languageDropdown.ok` → `buttons.ok` (from common)
- `game.messages.wordFound` → `messages.wordFound` (from games)
- `welcome.title` → `welcome.title` (from kimiKupu-specific)

#### Step 4.3: Update PangaKupu
**Complete translation implementation**:
```javascript
const translations = await Promise.all([
  fetch('/api/projects/polynesian-common/export/haw.json'),
  fetch('/api/projects/polynesian-games/export/haw.json'),
  fetch('/api/projects/pangaKupu-specific/export/haw.json')
]);
```

### Phase 5: Testing & Validation (Week 4)

#### Step 5.1: Functional Testing
**Per Application**:
- ✅ All UI elements display translated text
- ✅ Language switching works correctly
- ✅ No missing translation errors
- ✅ Fallback to English when needed

#### Step 5.2: Performance Testing
**API Response Times**:
- Target: < 500ms for translation loading
- Implement caching strategy if needed
- Monitor bandwidth usage

#### Step 5.3: Cross-Application Testing
**Consistency Verification**:
- "Cancel" button shows same translation across all apps
- Language names consistent everywhere
- Common game messages identical

## Detailed Migration Scripts

### Script 1: JEMT4 Conversion
```javascript
// migrate-jemt4.js
const fs = require('fs');

// Load existing files
const common = JSON.parse(fs.readFileSync('JEMT4/i18n/common.json'));
const homepage = JSON.parse(fs.readFileSync('JEMT4/i18n/homepage.json'));
const settings = JSON.parse(fs.readFileSync('JEMT4/i18n/settings.json'));

// Extract to common namespace
const commonOutput = {
  eng: {
    buttons: common.en.buttons,
    states: common.en.states,
    languages: {
      english: common.en.language.english,
      hawaiian: common.en.language.hawaiian
    }
  },
  haw: {
    buttons: common.haw.buttons,
    states: common.haw.states,
    languages: {
      english: common.haw.language.english,
      hawaiian: common.haw.language.hawaiian
    }
  }
};

// Extract to jemt4-music namespace  
const jemt4Output = {
  eng: {
    branding: {
      title: common.en.project.title
    },
    instruments: homepage.en.instruments,
    chords: homepage.en.chords,
    navigation: homepage.en.navigation
  },
  haw: {
    branding: {
      title: common.haw.project.title
    },
    instruments: homepage.haw.instruments,
    chords: homepage.haw.chords,
    navigation: homepage.haw.navigation
  }
};

// Write output files
fs.writeFileSync('output/polynesian-common.json', JSON.stringify(commonOutput, null, 2));
fs.writeFileSync('output/jemt4-music.json', JSON.stringify(jemt4Output, null, 2));
```

### Script 2: KimiKupu Conversion
```javascript
// migrate-kimiKupu.js
const fs = require('fs');

const languages = ['eng', 'haw', 'mao', 'tah', 'smo'];
const commonOutput = {};
const gamesOutput = {};
const kimiKupuOutput = {};

languages.forEach(lang => {
  // Map old 'en' to 'eng'
  const fileName = lang === 'eng' ? 'en' : lang;
  const input = JSON.parse(fs.readFileSync(`KimiKupu/src/languages/interface/data/${fileName}.json`));
  
  // Extract to common
  commonOutput[lang] = {
    buttons: {
      ok: input.languageDropdown?.ok || "OK",
      cancel: input.languageDropdown?.cancel || "Cancel",
      close: input.instructions?.close || "Close"
    },
    states: {
      loading: input.loading || "Loading..."
    },
    languages: {
      english: input.languageDropdown?.english || "English",
      hawaiian: input.languageDropdown?.hawaiian || "Hawaiian",
      maori: input.languageDropdown?.maori || "Māori",
      tahitian: input.languageDropdown?.tahitian || "Tahitian",
      samoan: input.languageDropdown?.samoan || "Samoan"
    }
  };
  
  // Extract to games
  gamesOutput[lang] = {
    messages: {
      wordFound: input.game?.messages?.wordFound || "Congratulations!",
      wordNotFound: input.game?.messages?.wordNotFound || "Word not found",
      notEnoughLetters: input.game?.messages?.notEnoughLetters || "Not enough letters"
    },
    actions: {
      newGame: input.welcome?.startButton || "New Game",
      refresh: input.game?.refresh || "Refresh"
    }
  };
  
  // Extract to kimiKupu-specific
  kimiKupuOutput[lang] = {
    welcome: {
      title: input.welcome?.title || "Reo Moana Puzzle",
      startButton: input.welcome?.startButton || "New Game",
      helpButton: input.welcome?.helpButton || "How to Play"
    },
    instructions: {
      title: input.instructions?.title || "How to Play",
      orthography: input.instructions?.tips?.diacriticals || "Use proper diacritics where required"
    }
  };
});

// Write output files
fs.writeFileSync('output/polynesian-common-kimiKupu.json', JSON.stringify(commonOutput, null, 2));
fs.writeFileSync('output/polynesian-games.json', JSON.stringify(gamesOutput, null, 2));
fs.writeFileSync('output/kimiKupu-specific.json', JSON.stringify(kimiKupuOutput, null, 2));
```

## Risk Mitigation

### Backup Strategy
**Before Migration**:
1. **Create complete backup** of all existing translation files
2. **Tag current version** in git repositories
3. **Document rollback procedure**

### Fallback Plan
**If Migration Issues**:
1. **Revert to backup files** temporarily
2. **Fix issues in staging environment**
3. **Re-deploy when ready**

### Testing Protocol
**Staged Rollout**:
1. **Test on localhost** first
2. **Deploy to staging** environment  
3. **Limited production** release
4. **Full production** deployment

## Success Metrics

### Quantitative Goals
- ✅ **100%** of existing translations preserved
- ✅ **0** broken UI elements
- ✅ **< 2 seconds** translation loading time
- ✅ **90%+** translation coverage for new languages

### Qualitative Goals
- ✅ **Consistent terminology** across all applications
- ✅ **Improved maintainability** for future updates
- ✅ **Scalable architecture** for new projects
- ✅ **Professional translation workflow**

## Post-Migration Tasks

### Week 5: Optimization
- **Performance tuning** based on usage metrics
- **Translation gap filling** for incomplete languages
- **Community feedback** incorporation
- **Documentation updates**

### Ongoing Maintenance
- **Monthly translation reviews**
- **Quarterly system health checks**  
- **Annual language coverage expansion**
- **Continuous quality improvement**

---

This migration process provides a systematic approach to transitioning from scattered translation files to a unified, scalable RMHTS-based system while preserving all existing translations and ensuring seamless user experience.