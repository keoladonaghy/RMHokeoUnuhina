# Polynesian Translation Manager - Web Interface

A web-based interface for managing translations in your Supabase database.

## Features

✅ **Search translations** by key path or text content  
✅ **Live search** with instant results  
✅ **Project filtering** (All, Common, JEMT4, KimiKupu, PangaKupu)  
✅ **Triple language editing** - compare and edit three languages simultaneously  
✅ **Inline editing** - click any translation to edit it directly in place  
✅ **Element name editing** - click key paths to rename translation elements  
✅ **New string creation** - add new translation keys with all 8 languages  
✅ **Auto-save** - changes save when you click outside or press Enter  
✅ **Pagination** for large result sets  
✅ **Smart notifications** - success/error messages with 3-second auto-dismiss  
✅ **4-column layout** - element name, English, Hawaiian, Māori  
✅ **Duplicate validation** - real-time checking for existing element names  
✅ **Hover indicators** - visual feedback for editable fields  

## Quick Start

1. **Open `index.html`** in your web browser
2. **Search for translations** using the search field
3. **Click any translation text** to edit it inline
4. **Click element names** to rename translation keys
5. **Use "New String"** button to add new translation elements
6. **Changes auto-save** when you click outside or press Enter

## Configuration

Your Supabase credentials are already configured in `config.js`. If you need to change them:

1. Edit `config.js` with your Supabase URL and anon key
2. Or delete `config.js` and the app will prompt for credentials

## Interface Overview

### Main Interface
- **Hōkeo Unuhina Logo**: Beautiful 200px header with traditional imagery
- **Project Selector**: Filter by specific project or view all
- **Search Type**: Toggle between searching key paths vs. translation text
- **Live Search**: Results update as you type
- **Triple Language Selectors**: Choose three languages to display/edit (defaults: English, Hawaiian, Māori)

### Search Results - 4-Column Layout
- **Column 1**: Element key path (fixed 300px width)
- **Column 2**: English translation
- **Column 3**: Selected language 2 (Hawaiian)
- **Column 4**: Selected language 3 (Māori)
- **Pagination**: Sets larger than 15 results
- **Hover Effects**: Editable cells highlight on hover

### Inline Editing System
- **Click to Edit**: Click any translation text to edit in place
- **Element Editing**: Click element names (key paths) to rename translation keys
- **Auto-Save**: Changes save when clicking outside or pressing Enter
- **Escape to Cancel**: Abandon changes with Escape key
- **Full Text Editing**: See complete text, not truncated version
- **Smart Updates**: Only saves if value actually changed
- **Toast Notifications**: Success (green) and error (red) messages slide in from top-right
- **Real-time Updates**: Local data updates immediately without page refresh

### New String Creation
- **Green "New String" Button**: Located in header and pagination areas
- **All 8 Languages**: Create translations for English, Hawaiian, Māori, Tahitian, French, Spanish, Samoan, Tongan
- **Element Name Validation**: Real-time checking for duplicates and format validation
- **Dot Notation Format**: Use namespace.key format (e.g., buttons.help, game.messages.start)
- **Project Assignment**: Automatically assigns to current project filter
- **Flexible Input**: Leave any language fields empty if translations not available
- **Space-Optimized Modal**: Compact 2-column grid layout for efficient data entry

## Usage Examples

### Search for Button Translations
1. Set search type to "Key Paths"
2. Type "button" in search field
3. Results show all button-related translations in 4 columns

### Edit Hawaiian Music Terms
1. Set project to "JEMT4 Music Theory"
2. Languages default to English, Hawaiian, and Māori
3. Search for "instrument" or "chord"
4. Click any translation text to edit inline

### Quick Translation Fixes
1. Search for any term (e.g., "refresh")
2. Click on incorrect Hawaiian translation
3. Type correct term (e.g., "Kiʻi Hou")
4. Press Enter or click outside to save
5. Green success notification confirms save

### Add Missing Translations
1. Look for "(missing)" in any language column
2. Click the "(missing)" text
3. Type the new translation
4. Auto-saves when you finish editing

### Create New Translation Elements
1. Click the green "New String" button
2. Enter element name (e.g., "settings.darkMode")
3. Fill in translations for available languages
4. Leave empty fields for languages you don't have translations for
5. Click "Add Translation" to save

### Rename Translation Keys
1. Click on any element name (leftmost column)
2. Edit the key path (e.g., change "buttons.ok" to "buttons.confirm")
3. System validates format and checks for duplicates
4. Press Enter to save or Escape to cancel

## File Structure

```
admin/web-interface/
├── index.html          # Main interface with triple language support
├── styles.css          # Styling with inline editing and 4-column layout
├── app.js             # Core functionality with inline editing system
├── config.js          # Supabase configuration
├── debug.html         # Database connection testing tool
└── README.md          # This documentation
```

## Browser Compatibility

- **Chrome/Safari/Firefox**: Fully supported
- **Mobile**: Basic functionality (not optimized)
- **Internet Explorer**: Not supported

## Security Notes

- Uses your Supabase anon key (safe for client-side use)
- No authentication - suitable for personal/internal use
- All changes are logged in your Supabase database

## Troubleshooting

### "Search failed" Error
- Check your internet connection
- Verify Supabase credentials in `config.js`
- Check browser console for detailed errors

### No Results Found
- Try different search terms
- Check if the project filter is too restrictive
- Verify translations exist in your database

### Can't Save Changes
- Check for validation warnings
- Ensure you have write permissions in Supabase
- Check browser console for API errors

## Advanced Usage

### Custom SQL Functions
The interface uses these Supabase functions:
- `translation_export` view for load-then-filter searching
- Direct table access for inline editing
- Automatic insert/update operations for missing translations

### Technical Architecture
- **Load-then-filter approach**: Loads all translations for selected languages, then filters locally for instant search
- **Optimistic updates**: UI updates immediately, database saves in background
- **CSS Grid layouts**: Responsive 4-column design with fixed element column
- **Event delegation**: Efficient click handling for inline editing
- **Toast notification system**: Non-blocking success/error messages

### Extending Functionality
To add features:
1. **More languages**: Add options to language selectors in `index.html`
2. **Additional columns**: Modify CSS grid-template-columns and JavaScript display logic
3. **Bulk operations**: Extend the JavaScript in `app.js` with batch save functions
4. **Export features**: Add buttons and functions for downloading translations
5. **Approval workflow**: Enhance the approval status tracking system

## Integration with Other Tools

This web interface works alongside:
- **Import scripts** in `../supabase/` directory
- **Direct API access** for applications
- **Supabase dashboard** for advanced database operations

The web interface provides a user-friendly way to manage the translations imported by your command-line tools.

## Recent Updates

### Version 2.1 - Complete Translation Management
- **Triple Language Support**: Now displays and edits English, Hawaiian, and Māori simultaneously
- **Inline Editing**: Click any translation to edit directly without modal dialogs
- **Element Name Editing**: Click key paths to rename translation elements with validation
- **New String Creation**: Add complete translation sets with green "New String" button
- **8-Language Support**: Create translations for all Polynesian and European languages
- **4-Column Layout**: Clean table format with element name + 3 language columns  
- **Smart Auto-Save**: Only saves when values change, triggers on blur or Enter
- **Duplicate Validation**: Real-time checking prevents duplicate element names
- **Toast Notifications**: Professional slide-in messages for success/error feedback
- **Optimized Performance**: Load-then-filter approach for instant search results
- **Enhanced UX**: Hover indicators, keyboard shortcuts (Enter/Escape), and immediate visual feedback

### Design Improvements
- **Hōkeo Unuhina Branding**: Traditional imagery in header with space-optimized layout
- **Space-Conscious Design**: Reduced padding and optimized component spacing throughout
- **Visual Polish**: Hover effects, smooth animations, and professional styling
- **Responsive Grid**: CSS Grid layout that adapts to different screen sizes

This system is now optimized for rapid translation work, allowing efficient correction of Hawaiian technology terms and other specialized vocabulary that may not be available in standard translation resources.

## Key Features Implementation

### Complete Translation Workflow
The system now supports the full translation management lifecycle:

1. **Creation**: Add new translation keys with the "New String" button
2. **Organization**: Rename and reorganize element keys inline
3. **Translation**: Edit any language translation with single clicks
4. **Validation**: Real-time duplicate checking and format validation
5. **Persistence**: All changes auto-save with visual confirmation

### Technical Architecture Highlights
- **Optimistic UI Updates**: Changes appear instantly while saving in background
- **Intelligent Validation**: Format checking and duplicate prevention for element names
- **Flexible Data Model**: Supports partial translations (empty fields allowed)
- **Event-Driven Design**: Efficient DOM manipulation with delegation patterns
- **Progressive Enhancement**: Works without JavaScript for basic viewing