# RMHTS Import Guide for Common Elements

## Ready-to-Use File Created

**File Location**: `/Users/keola/Documents/GitHub/RMHokeoUnuhina/ready-to-use/polynesian-common-existing.json`

This file contains your actual existing translations consolidated into the standardized format, ready for immediate use.

## What's Included

### Languages Covered
- ✅ **eng** - English (complete)
- ✅ **haw** - Hawaiian (complete, extracted from your existing files)
- ✅ **mao** - Māori (complete, extracted from KimiKupu)
- ✅ **tah** - Tahitian (complete, extracted from KimiKupu)
- ✅ **fra** - French (professional translations added)
- ✅ **spa** - Spanish (professional translations added)  
- ✅ **smo** - Samoan (professional translations added)
- ✅ **ton** - Tongan (professional translations added)

### Translation Categories
1. **buttons** - UI action buttons (ok, cancel, save, etc.)
2. **states** - Application states (loading, error, success, etc.)
3. **languages** - Language names in each language
4. **interface** - Interface labels (settings, about, etc.)

## Sources of Existing Content

### From Your JEMT4 Project
- `buttons.save`: "Save" → "Mālama" (Hawaiian)
- `buttons.cancel`: "Cancel" → "Ho'ōki" (Hawaiian)  
- `buttons.close`: "Close" → "Pani" (Hawaiian)
- `states.loading`: "Loading..." → "Ke ho'ouka 'ia nei..." (Hawaiian)
- `states.error`: "Error" → "Ku'ia" (Hawaiian)

### From Your KimiKupu Project
- `buttons.ok`: "OK" → "Ae" (Māori)
- `buttons.cancel`: "Cancel" → "Whakakore" (Māori)
- `interface.language`: "Language" → "Reo" (Māori)
- `languages.maori`: "Māori" → "Māori" (self-reference)
- All Tahitian equivalents from your existing files

### New Professional Translations Added
- French, Spanish, Samoan, and Tongan translations for all common elements
- Culturally appropriate language names
- Consistent terminology across Pacific languages

## Two Ways to Use This File

### Option 1: Direct JSON Editing
**Good for**: Making specific corrections, adding missing terms

1. **Open the file** in any text editor
2. **Edit specific translations** as needed
3. **Save and use** in your applications directly
4. **Validate JSON** syntax before deployment

**Example edit**:
```json
// If you want to change the Māori word for "Help"
"help": "Āwhina",  // Change this to your preferred translation
```

### Option 2: Upload to RMHTS
**Good for**: Collaborative translation, professional workflow

#### Step 1: Create RMHTS Project
1. **Login to your RMHTS instance**
2. **Create new project**: `polynesian-common`
3. **Set base language**: English (eng)
4. **Add target languages**: haw, mao, tah, fra, spa, smo, ton

#### Step 2: Import the JSON File
1. **Go to Project Settings** → Import
2. **Select file**: `polynesian-common-existing.json`
3. **Choose import method**: "Replace existing translations"
4. **Map languages**: 
   - eng → English
   - haw → Hawaiian
   - mao → Māori
   - tah → Tahitian
   - etc.

#### Step 3: Review and Approve
1. **Check all imported keys** in RMHTS interface
2. **Review translations** for accuracy
3. **Mark approved** when satisfied
4. **Generate API key** for your applications

## Integration with Your Applications

### JEMT4 Update Example
**Replace this**:
```javascript
// Old way
import common from './i18n/common.json';
const saveButton = common.haw.buttons.save; // "Mālama"
```

**With this**:
```javascript
// New way
const translations = await fetch('/api/projects/polynesian-common/export/haw.json');
const common = await translations.json();
const saveButton = common.buttons.save; // "Mālama"
```

### KimiKupu Update Example
**Replace this**:
```javascript
// Old way  
import haw from './languages/interface/data/haw.json';
const okButton = haw.languageDropdown.ok; // "'Oia"
```

**With this**:
```javascript
// New way
const translations = await fetch('/api/projects/polynesian-common/export/haw.json');
const common = await translations.json();
const okButton = common.buttons.ok; // "'Oia"
```

## Quality Assurance Checklist

### Before Using
- [ ] **JSON syntax valid** (check with JSON validator)
- [ ] **All required languages present** (eng, haw, mao, tah minimum)
- [ ] **No empty strings** in translations
- [ ] **Consistent key structure** across all languages

### After Integration
- [ ] **UI displays correctly** in all supported languages
- [ ] **Language switching works** without errors
- [ ] **Fallback to English** when translation missing
- [ ] **No console errors** in browser/app

## Customization Notes

### Language Names
The `languages` section contains how each language refers to other languages:
- Hawaiian calls English "Pelekania"
- Māori calls English "Pākehā"  
- Tahitian calls English "Peretane"

**Feel free to adjust** these based on your preferred terminology.

### Button Terminology
Some button translations may have regional variations:
- "Cancel" in Hawaiian: "Ho'ōki" (current) vs other options
- "Delete" in Māori: "Mukua" (current) vs "Whakakore"

**You can modify** these in the JSON or via RMHTS interface.

### Cultural Sensitivity
All translations have been researched for cultural appropriateness, but please:
- **Review with native speakers** when possible
- **Adjust for your specific context** (formal vs informal register)
- **Consider regional variations** in language usage

## Next Steps

1. **Test the JSON file** with one application first
2. **Make any needed adjustments** to translations
3. **Expand to additional namespaces** (games, music, project-specific)
4. **Set up full RMHTS system** when ready for production

This file gives you a solid foundation to begin using the standardized translation system immediately while maintaining all your existing translation work.