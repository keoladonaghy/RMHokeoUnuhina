/**
 * Polynesian Translation Manager
 * Web interface for managing translations in Supabase
 */

class TranslationManager {
    constructor() {
        this.supabase = null;
        this.allTranslations = []; // Store all loaded translations
        this.filteredResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 15;
        this.searchTimeout = null;
        this.currentEdit = null;
        this.currentProject = 'all';
        this.editingCell = null; // Track currently editing cell to prevent concurrent edits

        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        this.updateLanguageLabels();
        // Load initial translations
        await this.loadProjectTranslations();
        console.log('Translation Manager initialized');
    }

    async loadConfig() {
        let config;
        
        // Try to use config from config.js first
        if (window.SUPABASE_CONFIG) {
            config = window.SUPABASE_CONFIG;
        } else {
            // Fall back to local storage or prompt
            let stored = localStorage.getItem('supabase-config');
            
            if (!stored) {
                const url = prompt('Enter your Supabase URL (e.g., https://xxx.supabase.co):');
                const key = prompt('Enter your Supabase anon key:');
                
                if (!url || !key) {
                    alert('Supabase configuration required. Please refresh and try again.');
                    return;
                }
                
                config = { url, key };
                localStorage.setItem('supabase-config', JSON.stringify(config));
            } else {
                config = JSON.parse(stored);
            }
        }

        // Initialize Supabase client
        if (typeof window.supabase !== 'undefined') {
            this.supabase = window.supabase.createClient(config.url, config.key);
        } else {
            console.error('Supabase client not loaded. Please include the Supabase JS library.');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchField = document.getElementById('search-field');
        const searchType = document.querySelectorAll('input[name="search-type"]');

        if (searchField) {
            searchField.addEventListener('input', () => this.debounceFilter());
        } else {
            console.warn('Element not found: search-field');
        }

        if (searchType.length > 0) {
            searchType.forEach(radio => {
                radio.addEventListener('change', () => this.filterTranslations());
            });
        } else {
            console.warn('Elements not found: input[name="search-type"]');
        }

        // Project selector
        const projectSelect = document.getElementById('project-select');
        if (projectSelect) {
            projectSelect.addEventListener('change', (e) => {
                this.currentProject = e.target.value;
                this.loadProjectTranslations();
            });
        } else {
            console.warn('Element not found: project-select');
        }

        // Language selectors
        const lang1Select = document.getElementById('lang1-select');
        if (lang1Select) {
            lang1Select.addEventListener('change', () => {
                this.updateLanguageLabels();
                this.filterTranslations();
            });
        } else {
            console.warn('Element not found: lang1-select');
        }

        const lang2Select = document.getElementById('lang2-select');
        if (lang2Select) {
            lang2Select.addEventListener('change', () => {
                this.updateLanguageLabels();
                this.filterTranslations();
            });
        } else {
            console.warn('Element not found: lang2-select');
        }

        const lang3Select = document.getElementById('lang3-select');
        if (lang3Select) {
            lang3Select.addEventListener('change', () => {
                this.updateLanguageLabels();
                this.filterTranslations();
            });
        } else {
            console.warn('Element not found: lang3-select');
        }

        // Modal controls
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        const cancelEdit = document.getElementById('cancel-edit');
        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => this.closeModal());
        }

        const saveEdit = document.getElementById('save-edit');
        if (saveEdit) {
            saveEdit.addEventListener('click', () => this.saveEdit());
        }

        // Close modal on overlay click
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'modal-overlay') {
                    this.closeModal();
                }
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeNewStringModal();
            }
        });

        // New String Modal controls
        const newStringModalClose = document.getElementById('new-string-modal-close');
        if (newStringModalClose) {
            newStringModalClose.addEventListener('click', () => this.closeNewStringModal());
        }

        const cancelNewString = document.getElementById('cancel-new-string');
        if (cancelNewString) {
            cancelNewString.addEventListener('click', () => this.closeNewStringModal());
        }

        const newStringForm = document.getElementById('new-string-form');
        if (newStringForm) {
            newStringForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNewString();
            });
        }

        // Close new string modal on overlay click
        const newStringModalOverlay = document.getElementById('new-string-modal-overlay');
        if (newStringModalOverlay) {
            newStringModalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'new-string-modal-overlay') {
                    this.closeNewStringModal();
                }
            });
        }

        // Element name validation on input
        const elementName = document.getElementById('element-name');
        if (elementName) {
            elementName.addEventListener('input', () => this.validateElementName());
        }

        // Header New String button
        const newStringBtnHeader = document.getElementById('new-string-btn-header');
        if (newStringBtnHeader) {
            newStringBtnHeader.addEventListener('click', () => this.openNewStringModal());
        }

        // Event delegation for results list (prevents memory leaks, handles inline editing)
        const resultsList = document.getElementById('results-list');
        if (resultsList) {
            resultsList.addEventListener('click', (e) => {
                // Handle editable translation cells
                if (e.target.classList.contains('editable')) {
                    e.stopPropagation();
                    this.startInlineEdit(e.target);
                }
                // Handle editable key cells
                else if (e.target.classList.contains('editable-key')) {
                    e.stopPropagation();
                    this.startInlineKeyEdit(e.target);
                }
            });
        } else {
            console.warn('Element not found: results-list');
        }
    }

    updateLanguageLabels() {
        const lang1 = document.getElementById('lang1-select').value;
        const lang2 = document.getElementById('lang2-select').value;
        const lang3 = document.getElementById('lang3-select').value;
        
        const languageNames = {
            'eng': 'English',
            'haw': 'Hawaiian (ʻŌlelo Hawaiʻi)',
            'mao': 'Māori (Te Reo Māori)',
            'tah': 'Tahitian (Reo Tahiti)',
            'fra': 'French (Français)',
            'spa': 'Spanish (Español)',
            'smo': 'Samoan (Gagana Sāmoa)',
            'ton': 'Tongan (Lea Fakatonga)'
        };

        document.getElementById('lang1-label').textContent = languageNames[lang1];
        document.getElementById('lang2-label').textContent = languageNames[lang2];
        document.getElementById('lang3-label').textContent = languageNames[lang3];
    }

    debounceFilter() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.filterTranslations();
        }, 150); // Faster since we're filtering locally
    }

    async loadProjectTranslations() {
        console.log('Loading translations for project:', this.currentProject);
        this.showLoading(true);

        try {
            const lang1 = document.getElementById('lang1-select').value;
            const lang2 = document.getElementById('lang2-select').value;
            const lang3 = document.getElementById('lang3-select').value;

            let query = this.supabase
                .from('translation_export')
                .select('*')
                .in('language_code', [lang1, lang2, lang3]);

            // Project filter
            if (this.currentProject !== 'all') {
                query = query.eq('project_slug', this.currentProject);
            }

            const { data, error } = await query.order('key_path');

            if (error) throw error;

            console.log(`Loaded ${data.length} translations for project ${this.currentProject}`);
            this.allTranslations = data;
            this.filterTranslations();

        } catch (error) {
            console.error('Load error:', error);
            alert(`Failed to load translations: ${error.message}`);
            this.displayResults([]);
        } finally {
            this.showLoading(false);
        }
    }

    filterTranslations() {
        const searchTerm = document.getElementById('search-field').value.trim().toLowerCase();
        const searchType = document.querySelector('input[name="search-type"]:checked').value;
        const lang1 = document.getElementById('lang1-select').value;
        const lang2 = document.getElementById('lang2-select').value;
        const lang3 = document.getElementById('lang3-select').value;

        // console.log('Filtering with:', { searchTerm, searchType, totalTranslations: this.allTranslations.length });

        if (this.allTranslations.length === 0) {
            this.displayResults([]);
            return;
        }

        let filtered = this.allTranslations;

        // Apply search filter if there's a search term
        if (searchTerm) {
            filtered = this.allTranslations.filter(item => {
                if (searchType === 'keys') {
                    return item.key_path.toLowerCase().includes(searchTerm);
                } else {
                    return item.value.toLowerCase().includes(searchTerm);
                }
            });
        }

        console.log(`Filtered to ${filtered.length} translations`);

        // Group results
        const groupedResults = this.groupTranslations(filtered, lang1, lang2, lang3);
        
        this.filteredResults = groupedResults;
        this.currentPage = 1;
        this.displayResults(groupedResults);
    }

    groupTranslations(data, lang1, lang2, lang3) {
        const grouped = {};

        // Group the search results
        data.forEach(item => {
            const key = `${item.project_slug}:${item.key_path}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    project_slug: item.project_slug,
                    key_path: item.key_path,
                    namespace: item.namespace,
                    translations: {}
                };
            }

            grouped[key].translations[item.language_code] = {
                value: item.value,
                is_approved: item.is_approved
            };
        });

        return Object.values(grouped);
    }

    displayResults(results) {
        const resultsList = document.getElementById('results-list');
        const resultsCount = document.getElementById('results-count');
        const noResults = document.getElementById('no-results');

        if (!results.length) {
            // Use DOM methods to prevent XSS
            resultsList.innerHTML = '';
            const noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            const p = document.createElement('p');
            p.textContent = 'No translations found';
            noResultsDiv.appendChild(p);
            resultsList.appendChild(noResultsDiv);
            resultsCount.textContent = '';
            this.updatePagination(0);
            return;
        }

        // Hide any existing no-results message
        if (noResults) {
            noResults.style.display = 'none';
        }
        resultsCount.textContent = `${results.length} results`;

        // Pagination
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const pageResults = results.slice(startIndex, endIndex);

        const lang1 = document.getElementById('lang1-select').value;
        const lang2 = document.getElementById('lang2-select').value;
        const lang3 = document.getElementById('lang3-select').value;

        // Clear previous results
        resultsList.innerHTML = '';

        // Build results using DOM methods to prevent XSS
        pageResults.forEach(item => {
            const lang1Value = item.translations[lang1]?.value || '(missing)';
            const lang2Value = item.translations[lang2]?.value || '(missing)';
            const lang3Value = item.translations[lang3]?.value || '(missing)';

            // Create result item container
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            resultItem.dataset.key = item.key_path;
            resultItem.dataset.project = item.project_slug;

            // Create key path cell (editable)
            const keyCell = document.createElement('div');
            keyCell.className = 'result-key editable-key';
            keyCell.dataset.key = item.key_path;
            keyCell.dataset.project = item.project_slug;
            keyCell.title = 'Click to edit element name';
            keyCell.textContent = item.key_path;  // Safe - uses textContent

            // Create language cells (editable)
            const lang1Cell = document.createElement('div');
            lang1Cell.className = 'result-lang editable';
            lang1Cell.dataset.lang = lang1;
            lang1Cell.dataset.key = item.key_path;
            lang1Cell.dataset.project = item.project_slug;
            lang1Cell.title = 'Click to edit';
            lang1Cell.textContent = this.truncateText(lang1Value, 60);  // Safe - uses textContent

            const lang2Cell = document.createElement('div');
            lang2Cell.className = 'result-lang editable';
            lang2Cell.dataset.lang = lang2;
            lang2Cell.dataset.key = item.key_path;
            lang2Cell.dataset.project = item.project_slug;
            lang2Cell.title = 'Click to edit';
            lang2Cell.textContent = this.truncateText(lang2Value, 60);  // Safe - uses textContent

            const lang3Cell = document.createElement('div');
            lang3Cell.className = 'result-lang editable';
            lang3Cell.dataset.lang = lang3;
            lang3Cell.dataset.key = item.key_path;
            lang3Cell.dataset.project = item.project_slug;
            lang3Cell.title = 'Click to edit';
            lang3Cell.textContent = this.truncateText(lang3Value, 60);  // Safe - uses textContent

            // Assemble the result item
            resultItem.appendChild(keyCell);
            resultItem.appendChild(lang1Cell);
            resultItem.appendChild(lang2Cell);
            resultItem.appendChild(lang3Cell);

            resultsList.appendChild(resultItem);
        });

        // Event delegation now handles click events (no memory leaks)
        this.updatePagination(results.length);
    }

    updatePagination(totalResults) {
        const totalPages = Math.ceil(totalResults / this.resultsPerPage);
        const pagination = document.getElementById('pagination');
        const paginationBottom = document.getElementById('pagination-bottom');

        // Always show the New String button, even with no pagination
        const newStringButton = '<button class="new-string-button" data-action="new-string">New String</button>';
        
        if (totalPages <= 1) {
            pagination.innerHTML = newStringButton;
            paginationBottom.innerHTML = newStringButton;
            
            // Add event listeners for the New String button
            [pagination, paginationBottom].forEach(container => {
                const btn = container.querySelector('button[data-action="new-string"]');
                if (btn) {
                    btn.addEventListener('click', () => this.openNewStringModal());
                }
            });
            return;
        }

        const paginationHTML = this.generatePaginationHTML(totalPages);
        
        pagination.innerHTML = newStringButton + paginationHTML;
        paginationBottom.innerHTML = newStringButton + paginationHTML;

        // Add event listeners
        [pagination, paginationBottom].forEach(container => {
            container.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    
                    if (action === 'new-string') {
                        this.openNewStringModal();
                    } else if (action === 'prev' && this.currentPage > 1) {
                        this.currentPage--;
                        this.displayResults(this.filteredResults);
                    } else if (action === 'next' && this.currentPage < totalPages) {
                        this.currentPage++;
                        this.displayResults(this.filteredResults);
                    } else if (action === 'page') {
                        this.currentPage = parseInt(e.target.dataset.page);
                        this.displayResults(this.filteredResults);
                    }
                });
            });
        });
    }


    generatePaginationHTML(totalPages) {
        let html = `
            <button data-action="prev" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
        `;

        // Show page numbers (simplified - could be enhanced for many pages)
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            html += `
                <button data-action="page" data-page="${i}" 
                        class="${i === this.currentPage ? 'current-page' : ''}">${i}</button>
            `;
        }

        if (totalPages > 5) {
            html += `<span class="pagination-info">... ${totalPages}</span>`;
        }

        html += `
            <button data-action="next" ${this.currentPage === totalPages ? 'disabled' : ''}>Next</button>
            <span class="pagination-info">Page ${this.currentPage} of ${totalPages}</span>
        `;

        return html;
    }

    async openEditModal(keyPath, project) {
        this.showLoading(true);

        try {
            // Get the translation key details
            const { data: keyData, error: keyError } = await this.supabase
                .from('translation_keys')
                .select('*')
                .eq('key_path', keyPath)
                .eq('project_id', (await this.getProjectId(project)))
                .single();

            if (keyError) throw keyError;

            // Get translations for the selected languages
            const lang1 = document.getElementById('lang1-select').value;
            const lang2 = document.getElementById('lang2-select').value;
            const lang3 = document.getElementById('lang3-select').value;

            const { data: translations, error: transError } = await this.supabase
                .from('translations')
                .select(`
                    *,
                    languages(code, name)
                `)
                .eq('key_id', keyData.id)
                .in('language_id', await this.getLanguageIds([lang1, lang2, lang3]));

            if (transError) throw transError;

            this.currentEdit = {
                keyData,
                translations: translations.reduce((acc, t) => {
                    acc[t.languages.code] = t;
                    return acc;
                }, {}),
                lang1,
                lang2,
                lang3
            };

            this.populateEditModal();
            this.showModal();

        } catch (error) {
            console.error('Error opening edit modal:', error);
            alert('Failed to load translation details. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    populateEditModal() {
        const { keyData, translations, lang1, lang2, lang3 } = this.currentEdit;

        // Set basic info
        document.getElementById('edit-key-path').textContent = keyData.key_path;
        document.getElementById('edit-project').textContent = keyData.project_id; // Would need project name lookup
        document.getElementById('edit-namespace').textContent = keyData.namespace;

        // Set translation values
        const lang1Translation = translations[lang1];
        const lang2Translation = translations[lang2];
        const lang3Translation = translations[lang3];

        document.getElementById('lang1-input').value = lang1Translation?.value || '';
        document.getElementById('lang2-input').value = lang2Translation?.value || '';
        document.getElementById('lang3-input').value = lang3Translation?.value || '';

        // Set approval status
        this.updateApprovalStatus('lang1-approval', lang1Translation?.is_approved);
        this.updateApprovalStatus('lang2-approval', lang2Translation?.is_approved);
        this.updateApprovalStatus('lang3-approval', lang3Translation?.is_approved);

        // Clear warnings
        document.getElementById('lang1-warning').textContent = '';
        document.getElementById('lang2-warning').textContent = '';
        document.getElementById('lang3-warning').textContent = '';
    }

    updateApprovalStatus(elementId, isApproved) {
        const element = document.getElementById(elementId);
        element.className = `approval-status ${isApproved ? 'approved' : 'pending'}`;
        element.textContent = isApproved ? 'Approved' : 'Pending';
    }

    async saveEdit() {
        const lang1Value = document.getElementById('lang1-input').value;
        const lang2Value = document.getElementById('lang2-input').value;
        const lang3Value = document.getElementById('lang3-input').value;
        
        // Validation
        let hasWarnings = false;
        
        if (!lang1Value.trim()) {
            document.getElementById('lang1-warning').textContent = 'Empty translation';
            hasWarnings = true;
        } else {
            document.getElementById('lang1-warning').textContent = '';
        }
        
        if (!lang2Value.trim()) {
            document.getElementById('lang2-warning').textContent = 'Empty translation';
            hasWarnings = true;
        } else {
            document.getElementById('lang2-warning').textContent = '';
        }
        
        if (!lang3Value.trim()) {
            document.getElementById('lang3-warning').textContent = 'Empty translation';
            hasWarnings = true;
        } else {
            document.getElementById('lang3-warning').textContent = '';
        }

        if (hasWarnings) {
            const proceed = confirm('There are validation warnings. Save anyway?');
            if (!proceed) return;
        }

        this.showLoading(true);

        try {
            const { keyData, translations, lang1, lang2, lang3 } = this.currentEdit;
            const lang1Id = await this.getLanguageId(lang1);
            const lang2Id = await this.getLanguageId(lang2);
            const lang3Id = await this.getLanguageId(lang3);

            // Update or create translations
            const updates = [];

            if (translations[lang1]) {
                updates.push(this.supabase
                    .from('translations')
                    .update({ value: lang1Value, is_approved: false })
                    .eq('id', translations[lang1].id)
                );
            } else {
                updates.push(this.supabase
                    .from('translations')
                    .insert({
                        key_id: keyData.id,
                        language_id: lang1Id,
                        value: lang1Value,
                        is_approved: false
                    })
                );
            }

            if (translations[lang2]) {
                updates.push(this.supabase
                    .from('translations')
                    .update({ value: lang2Value, is_approved: false })
                    .eq('id', translations[lang2].id)
                );
            } else {
                updates.push(this.supabase
                    .from('translations')
                    .insert({
                        key_id: keyData.id,
                        language_id: lang2Id,
                        value: lang2Value,
                        is_approved: false
                    })
                );
            }

            if (translations[lang3]) {
                updates.push(this.supabase
                    .from('translations')
                    .update({ value: lang3Value, is_approved: false })
                    .eq('id', translations[lang3].id)
                );
            } else {
                updates.push(this.supabase
                    .from('translations')
                    .insert({
                        key_id: keyData.id,
                        language_id: lang3Id,
                        value: lang3Value,
                        is_approved: false
                    })
                );
            }

            // Use Promise.allSettled to handle partial failures gracefully
            const results = await Promise.allSettled(updates);

            // Check for any failures
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.error('Some translations failed to save:', failures);
                const errorMessages = failures.map(f => f.reason.message).join(', ');
                throw new Error(`Failed to save ${failures.length} translation(s): ${errorMessages}`);
            }

            this.showSuccessMessage('Translation saved successfully!');
            this.closeModal();
            this.loadProjectTranslations(); // Refresh results

        } catch (error) {
            console.error('Save error:', error);
            alert(`Failed to save translation: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    startInlineEdit(cell) {
        // Don't start editing if already editing
        if (cell.classList.contains('editing')) return;

        // Prevent concurrent edits - save any existing edit first
        if (this.editingCell && this.editingCell !== cell) {
            // Find and blur any existing edit input to trigger save
            const existingInput = this.editingCell.querySelector('input');
            if (existingInput) {
                existingInput.blur();
            }
        }

        // Mark this cell as the currently editing cell
        this.editingCell = cell;

        // Get the full text (not truncated)
        const keyPath = cell.dataset.key;
        const project = cell.dataset.project;
        const langCode = cell.dataset.lang;
        
        // Find the full translation value
        const item = this.filteredResults.find(r => r.key_path === keyPath && r.project_slug === project);
        const fullValue = item?.translations[langCode]?.value || '';
        
        // Store original value and create input
        const originalValue = fullValue;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = fullValue === '(missing)' ? '' : fullValue;
        input.className = 'result-lang editing';
        
        // Replace cell content with input
        cell.style.padding = '0';
        cell.innerHTML = '';
        cell.appendChild(input);
        cell.classList.add('editing');
        
        // Focus and select all text
        input.focus();
        input.select();
        
        // Save on blur or Enter
        const saveEdit = async () => {
            const newValue = input.value.trim();

            // Only save if value changed
            if (newValue !== originalValue) {
                try {
                    await this.saveInlineEdit(keyPath, project, langCode, newValue);
                    this.showSuccessMessage('Translation updated!');
                    // Update the display
                    cell.textContent = this.truncateText(newValue || '(missing)', 60);
                } catch (error) {
                    console.error('Save error:', error);
                    this.showErrorMessage('Failed to save translation');
                    // Restore original value
                    cell.textContent = this.truncateText(originalValue || '(missing)', 60);
                }
            } else {
                // No change, just restore display
                cell.textContent = this.truncateText(originalValue || '(missing)', 60);
            }

            // Clean up
            cell.style.padding = '';
            cell.classList.remove('editing');
            // Clear editing cell flag
            if (this.editingCell === cell) {
                this.editingCell = null;
            }
        };

        // Save on blur
        input.addEventListener('blur', saveEdit);

        // Save on Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger save
            } else if (e.key === 'Escape') {
                // Cancel edit
                cell.textContent = this.truncateText(originalValue || '(missing)', 60);
                cell.style.padding = '';
                cell.classList.remove('editing');
                // Clear editing cell flag
                if (this.editingCell === cell) {
                    this.editingCell = null;
                }
            }
        });
    }

    async saveInlineEdit(keyPath, project, langCode, newValue) {
        // Get key data
        const { data: keyData, error: keyError } = await this.supabase
            .from('translation_keys')
            .select('id')
            .eq('key_path', keyPath)
            .eq('project_id', (await this.getProjectId(project)))
            .single();

        if (keyError) throw keyError;

        // Get language ID
        const langId = await this.getLanguageId(langCode);

        // Check if translation exists
        const { data: existing, error: existingError } = await this.supabase
            .from('translations')
            .select('id')
            .eq('key_id', keyData.id)
            .eq('language_id', langId)
            .single();

        if (existingError && existingError.code !== 'PGRST116') throw existingError;

        // Update or create translation
        if (existing) {
            const { error } = await this.supabase
                .from('translations')
                .update({ value: newValue, is_approved: false })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await this.supabase
                .from('translations')
                .insert({
                    key_id: keyData.id,
                    language_id: langId,
                    value: newValue,
                    is_approved: false
                });
            if (error) throw error;
        }

        // Update local data
        const item = this.filteredResults.find(r => r.key_path === keyPath && r.project_slug === project);
        if (item) {
            if (!item.translations[langCode]) {
                item.translations[langCode] = {};
            }
            item.translations[langCode].value = newValue;
        }
    }

    startInlineKeyEdit(cell) {
        // Don't start editing if already editing
        if (cell.classList.contains('editing')) return;
        
        const originalKeyPath = cell.dataset.key;
        const project = cell.dataset.project;
        
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalKeyPath;
        input.className = 'result-key editing';
        
        // Replace cell content with input
        cell.style.padding = '0';
        cell.innerHTML = '';
        cell.appendChild(input);
        cell.classList.add('editing');
        
        // Focus and select all text
        input.focus();
        input.select();
        
        // Save on blur or Enter
        const saveEdit = async () => {
            const newKeyPath = input.value.trim();
            
            // Validate key path format
            if (!newKeyPath) {
                this.showErrorMessage('Element name cannot be empty');
                cell.textContent = originalKeyPath;
                cell.style.padding = '';
                cell.classList.remove('editing');
                return;
            }

            if (!/^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/.test(newKeyPath)) {
                this.showErrorMessage('Invalid format. Use dot notation like: buttons.help');
                cell.textContent = originalKeyPath;
                cell.style.padding = '';
                cell.classList.remove('editing');
                return;
            }
            
            // Only save if value changed
            if (newKeyPath !== originalKeyPath) {
                try {
                    await this.saveKeyPathEdit(originalKeyPath, newKeyPath, project);
                    this.showSuccessMessage('Element name updated!');
                    // Refresh the results to show updated data
                    this.loadProjectTranslations();
                } catch (error) {
                    console.error('Save error:', error);
                    this.showErrorMessage('Failed to update element name');
                    // Restore original value
                    cell.textContent = originalKeyPath;
                }
            } else {
                // No change, just restore display
                cell.textContent = originalKeyPath;
            }
            
            // Clean up
            cell.style.padding = '';
            cell.classList.remove('editing');
        };
        
        // Save on blur
        input.addEventListener('blur', saveEdit);
        
        // Save on Enter, cancel on Escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger save
            } else if (e.key === 'Escape') {
                // Cancel edit
                cell.textContent = originalKeyPath;
                cell.style.padding = '';
                cell.classList.remove('editing');
            }
        });
    }

    async saveKeyPathEdit(oldKeyPath, newKeyPath, project) {
        // Check if new key path already exists
        const projectId = await this.getProjectId(project);
        
        const { data: existing, error: checkError } = await this.supabase
            .from('translation_keys')
            .select('id')
            .eq('key_path', newKeyPath)
            .eq('project_id', projectId);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            throw new Error('Element name already exists');
        }

        // Update the key path in the database
        const { error: updateError } = await this.supabase
            .from('translation_keys')
            .update({ 
                key_path: newKeyPath,
                namespace: newKeyPath.split('.')[0] || 'misc'
            })
            .eq('key_path', oldKeyPath)
            .eq('project_id', projectId);

        if (updateError) throw updateError;
    }

    showErrorMessage(message) {
        // Create error message element if it doesn't exist
        let errorMessage = document.getElementById('error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'error-message';
            errorMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 2001;
                font-size: 14px;
                font-weight: 500;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            document.body.appendChild(errorMessage);
        }

        // Set message and show
        errorMessage.textContent = message;
        errorMessage.style.transform = 'translateX(0)';

        // Hide after 3 seconds
        setTimeout(() => {
            errorMessage.style.transform = 'translateX(100%)';
        }, 3000);
    }

    showSuccessMessage(message) {
        // Create success message element if it doesn't exist
        let successMessage = document.getElementById('success-message');
        if (!successMessage) {
            successMessage = document.createElement('div');
            successMessage.id = 'success-message';
            successMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 2001;
                font-size: 14px;
                font-weight: 500;
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            document.body.appendChild(successMessage);
        }

        // Set message and show
        successMessage.textContent = message;
        successMessage.style.transform = 'translateX(0)';

        // Hide after 3 seconds
        setTimeout(() => {
            successMessage.style.transform = 'translateX(100%)';
        }, 3000);
    }

    async getProjectId(projectSlug) {
        const { data, error } = await this.supabase
            .from('projects')
            .select('id')
            .eq('slug', projectSlug)
            .single();
        
        if (error) throw error;
        return data.id;
    }

    async getLanguageId(languageCode) {
        const { data, error } = await this.supabase
            .from('languages')
            .select('id')
            .eq('code', languageCode)
            .single();
        
        if (error) throw error;
        return data.id;
    }

    async getLanguageIds(languageCodes) {
        const { data, error } = await this.supabase
            .from('languages')
            .select('id')
            .in('code', languageCodes);
        
        if (error) throw error;
        return data.map(l => l.id);
    }

    showModal() {
        document.getElementById('modal-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.remove('show');
        document.body.style.overflow = '';
        this.currentEdit = null;
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('show');
        } else {
            loading.classList.remove('show');
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // New String Modal Methods
    openNewStringModal() {
        // Show the current project
        const currentProject = this.currentProject === 'all' ? 'polynesian-common' : this.currentProject;
        document.getElementById('new-string-project').textContent = currentProject;
        
        // Clear the form
        document.getElementById('new-string-form').reset();
        document.getElementById('element-name-validation').textContent = '';
        
        // Show modal
        document.getElementById('new-string-modal-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on element name field
        setTimeout(() => {
            document.getElementById('element-name').focus();
        }, 100);
    }

    closeNewStringModal() {
        document.getElementById('new-string-modal-overlay').classList.remove('show');
        document.body.style.overflow = '';
    }

    async validateElementName() {
        const elementName = document.getElementById('element-name').value.trim();
        const validationMessage = document.getElementById('element-name-validation');
        
        if (!elementName) {
            validationMessage.textContent = '';
            return true;
        }

        // Basic format validation
        if (!/^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/.test(elementName)) {
            validationMessage.textContent = 'Invalid format. Use dot notation like: buttons.help or game.messages.start';
            return false;
        }

        // Check for duplicate
        try {
            const currentProject = this.currentProject === 'all' ? 'polynesian-common' : this.currentProject;
            const projectId = await this.getProjectId(currentProject);
            
            const { data, error } = await this.supabase
                .from('translation_keys')
                .select('id')
                .eq('key_path', elementName)
                .eq('project_id', projectId);

            if (error) {
                console.error('Validation error:', error);
                validationMessage.textContent = 'Error checking for duplicates';
                return false;
            }

            if (data && data.length > 0) {
                validationMessage.textContent = 'This element name already exists in the selected project';
                return false;
            }

            validationMessage.textContent = '';
            return true;
        } catch (error) {
            console.error('Validation error:', error);
            validationMessage.textContent = 'Error checking for duplicates';
            return false;
        }
    }

    async saveNewString() {
        // Validate element name first
        const isValid = await this.validateElementName();
        if (!isValid) {
            return;
        }

        const elementName = document.getElementById('element-name').value.trim();
        if (!elementName) {
            document.getElementById('element-name-validation').textContent = 'Element name is required';
            return;
        }

        // Get all language values
        const translations = {
            eng: document.getElementById('new-eng').value.trim(),
            haw: document.getElementById('new-haw').value.trim(),
            mao: document.getElementById('new-mao').value.trim(),
            tah: document.getElementById('new-tah').value.trim(),
            fra: document.getElementById('new-fra').value.trim(),
            spa: document.getElementById('new-spa').value.trim(),
            smo: document.getElementById('new-smo').value.trim(),
            ton: document.getElementById('new-ton').value.trim()
        };

        // Check if at least one translation is provided
        const hasTranslation = Object.values(translations).some(value => value.length > 0);
        if (!hasTranslation) {
            this.showErrorMessage('Please provide at least one translation');
            return;
        }

        this.showLoading(true);

        try {
            const currentProject = this.currentProject === 'all' ? 'polynesian-common' : this.currentProject;
            const projectId = await this.getProjectId(currentProject);
            
            // Extract namespace from element name
            const parts = elementName.split('.');
            const namespace = parts.length > 1 ? parts[0] : 'misc';

            // Create translation key
            const { data: keyData, error: keyError } = await this.supabase
                .from('translation_keys')
                .insert({
                    project_id: projectId,
                    key_path: elementName,
                    namespace: namespace,
                    description: `Added via web interface`
                })
                .select()
                .single();

            if (keyError) throw keyError;

            // Create translations for all non-empty values
            const translationInserts = [];
            for (const [langCode, value] of Object.entries(translations)) {
                if (value) {
                    const langId = await this.getLanguageId(langCode);
                    translationInserts.push({
                        key_id: keyData.id,
                        language_id: langId,
                        value: value,
                        is_approved: false
                    });
                }
            }

            if (translationInserts.length > 0) {
                const { error: transError } = await this.supabase
                    .from('translations')
                    .insert(translationInserts);

                if (transError) throw transError;
            }

            this.showSuccessMessage(`Translation "${elementName}" added successfully!`);
            this.closeNewStringModal();
            this.loadProjectTranslations(); // Refresh results

        } catch (error) {
            console.error('Save error:', error);
            this.showErrorMessage(`Failed to save translation: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // Inline editing methods for UI translations  
    startInlineEdit(element) {
        // Prevent multiple edits at once
        if (this.editingCell) {
            this.cancelInlineEdit();
        }

        this.editingCell = element;
        const lang = element.dataset.lang;
        const keyPath = element.dataset.key;
        const project = element.dataset.project;
        const currentValue = element.textContent.trim();
        const actualValue = currentValue === '(missing)' ? '' : currentValue;

        // Store original data
        element.dataset.originalValue = actualValue;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = actualValue;

        // Replace content with input
        element.innerHTML = '';
        element.appendChild(input);
        element.classList.add('editing');

        // Focus and select
        input.focus();
        input.select();

        // Save on Enter or blur
        const saveEdit = () => {
            this.saveInlineEdit(element, input.value, keyPath, project, lang);
        };

        const cancelEdit = () => {
            this.cancelInlineEdit();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    startInlineKeyEdit(element) {
        // Similar to startInlineEdit but for key editing
        if (this.editingCell) {
            this.cancelInlineEdit();
        }

        this.editingCell = element;
        const keyPath = element.dataset.key;
        const project = element.dataset.project;
        const currentValue = element.textContent.trim();

        // Store original data
        element.dataset.originalValue = currentValue;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue;

        // Replace content with input
        element.innerHTML = '';
        element.appendChild(input);
        element.classList.add('editing');

        // Focus and select
        input.focus();
        input.select();

        // Save on Enter or blur
        const saveEdit = () => {
            this.saveInlineKeyEdit(element, input.value, keyPath, project);
        };

        const cancelEdit = () => {
            this.cancelInlineEdit();
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }

    async saveInlineEdit(element, newValue, keyPath, project, lang) {
        const originalValue = element.dataset.originalValue;

        // No change, just cancel
        if (newValue === originalValue) {
            this.cancelInlineEdit();
            return;
        }

        try {
            // Show saving state
            element.innerHTML = '<span style="color: #6c757d;">Saving...</span>';

            // Get the necessary IDs
            const projectId = await this.getProjectId(project);
            const languageId = await this.getLanguageId(lang);

            // Find the key
            const { data: keyData } = await this.supabase
                .from('translation_keys')
                .select('id')
                .eq('key_path', keyPath)
                .eq('project_id', projectId)
                .single();

            if (keyData) {
                // Update or insert translation
                const { data: existing } = await this.supabase
                    .from('translations')
                    .select('id')
                    .eq('key_id', keyData.id)
                    .eq('language_id', languageId)
                    .single();

                if (existing) {
                    // Update existing
                    const { error } = await this.supabase
                        .from('translations')
                        .update({ value: newValue, is_approved: false })
                        .eq('id', existing.id);
                    if (error) throw error;
                } else {
                    // Insert new
                    const { error } = await this.supabase
                        .from('translations')
                        .insert({
                            key_id: keyData.id,
                            language_id: languageId,
                            value: newValue,
                            is_approved: false
                        });
                    if (error) throw error;
                }

                // Update local data and refresh view
                await this.loadProjectTranslations();
            }

        } catch (error) {
            console.error('Error saving inline edit:', error);
            // Restore original value on error
            element.classList.remove('editing');
            element.textContent = originalValue || '(missing)';
            alert('Error saving: ' + error.message);
        }

        this.editingCell = null;
        delete element.dataset.originalValue;
    }

    async saveInlineKeyEdit(element, newValue, oldKeyPath, project) {
        const originalValue = element.dataset.originalValue;

        // No change or invalid key name
        if (newValue === originalValue || !newValue.trim()) {
            this.cancelInlineEdit();
            return;
        }

        try {
            element.innerHTML = '<span style="color: #6c757d;">Saving...</span>';

            const projectId = await this.getProjectId(project);

            // Update key path in database
            const { error } = await this.supabase
                .from('translation_keys')
                .update({ key_path: newValue.trim() })
                .eq('key_path', oldKeyPath)
                .eq('project_id', projectId);

            if (error) throw error;

            // Refresh the view
            await this.loadProjectTranslations();

        } catch (error) {
            console.error('Error saving key edit:', error);
            element.classList.remove('editing');
            element.textContent = originalValue;
            alert('Error saving: ' + error.message);
        }

        this.editingCell = null;
        delete element.dataset.originalValue;
    }

    cancelInlineEdit() {
        if (this.editingCell) {
            const originalValue = this.editingCell.dataset.originalValue;
            this.editingCell.classList.remove('editing');
            this.editingCell.textContent = originalValue || '(missing)';
            delete this.editingCell.dataset.originalValue;
            this.editingCell = null;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is available
    if (typeof window.supabase === 'undefined') {
        // Load Supabase from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            new TranslationManager();
        };
        script.onerror = () => {
            alert('Failed to load Supabase library. Please check your internet connection.');
        };
        document.head.appendChild(script);
    } else {
        new TranslationManager();
    }
});