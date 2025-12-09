/**
 * Technical Terms Manager
 * Web interface for managing technical terminology in multiple Polynesian languages
 */

class TechTermsManager {
    constructor() {
        this.supabase = null;
        this.allTerms = [];
        this.filteredTerms = [];
        this.currentPage = 1;
        this.resultsPerPage = 20;
        this.searchTimeout = null;
        this.currentTerm = null;

        this.init();
    }

    async init() {
        await this.loadConfig();
        this.setupEventListeners();
        await this.loadTerms();
        console.log('Technical Terms Manager initialized');
    }

    async loadConfig() {
        let config;

        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key) {
            config = window.SUPABASE_CONFIG;
        } else {
            let stored = localStorage.getItem('supabase-config');

            if (!stored) {
                const url = prompt('Enter your Supabase URL:');
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

        if (typeof window.supabase !== 'undefined') {
            this.supabase = window.supabase.createClient(config.url, config.key);
        } else {
            console.error('Supabase client not loaded.');
        }
    }

    setupEventListeners() {
        // Search
        const searchField = document.getElementById('search-field');
        if (searchField) {
            searchField.addEventListener('input', () => this.debounceFilter());
        }

        // Filters
        const domainSelect = document.getElementById('domain-select');
        if (domainSelect) {
            domainSelect.addEventListener('change', () => this.filterTerms());
        }

        const statusSelect = document.getElementById('status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', () => this.filterTerms());
        }

        const languageFilter = document.getElementById('language-filter');
        if (languageFilter) {
            languageFilter.addEventListener('change', () => this.filterTerms());
        }

        // New term button
        const newTermBtn = document.getElementById('new-term-btn');
        if (newTermBtn) {
            newTermBtn.addEventListener('click', () => this.showNewTermModal());
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

        const saveTerm = document.getElementById('save-term');
        if (saveTerm) {
            saveTerm.addEventListener('click', () => this.saveTerm());
        }

        const deleteTerm = document.getElementById('delete-term');
        if (deleteTerm) {
            deleteTerm.addEventListener('click', () => this.deleteTerm());
        }

        // Close modal on overlay click
        const modalOverlay = document.getElementById('term-detail-modal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'term-detail-modal') {
                    this.closeModal();
                }
            });
        }
    }

    debounceFilter() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.filterTerms(), 300);
    }

    async loadTerms() {
        try {
            const { data, error } = await this.supabase
                .from('tech_terms')
                .select('*')
                .order('eng_term', { ascending: true });

            if (error) throw error;

            this.allTerms = data || [];
            this.filterTerms();
            this.updateStats();
        } catch (error) {
            console.error('Error loading terms:', error);
            alert('Error loading terms: ' + error.message);
        }
    }

    filterTerms() {
        const searchText = document.getElementById('search-field')?.value.toLowerCase() || '';
        const domainFilter = document.getElementById('domain-select')?.value || 'all';
        const statusFilter = document.getElementById('status-select')?.value || 'all';
        const languageFilter = document.getElementById('language-filter')?.value || 'all';

        this.filteredTerms = this.allTerms.filter(term => {
            // Search filter
            if (searchText) {
                const searchMatch =
                    term.eng_term?.toLowerCase().includes(searchText) ||
                    term.haw_term?.toLowerCase().includes(searchText) ||
                    term.mao_term?.toLowerCase().includes(searchText) ||
                    term.eng_definition?.toLowerCase().includes(searchText);

                if (!searchMatch) return false;
            }

            // Domain filter
            if (domainFilter !== 'all') {
                if (domainFilter === 'unclassified') {
                    if (term.primary_domain) return false;
                } else {
                    if (term.primary_domain !== domainFilter) return false;
                }
            }

            // Status filter
            if (statusFilter !== 'all') {
                if (term.haw_status !== statusFilter && term.mao_status !== statusFilter) {
                    return false;
                }
            }

            // Language filter
            if (languageFilter !== 'all') {
                if (languageFilter === 'has-hawaiian' && (!term.haw_term || term.haw_term === '')) return false;
                if (languageFilter === 'needs-hawaiian' && term.haw_term && term.haw_term !== '') return false;
                if (languageFilter === 'has-maori' && (!term.mao_term || term.mao_term === '')) return false;
                if (languageFilter === 'needs-maori' && term.mao_term && term.mao_term !== '') return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.renderResults();
        this.updateResultsCount();
    }

    renderResults() {
        const tbody = document.getElementById('results-list');
        if (!tbody) return;

        const startIdx = (this.currentPage - 1) * this.resultsPerPage;
        const endIdx = startIdx + this.resultsPerPage;
        const pageTerms = this.filteredTerms.slice(startIdx, endIdx);

        if (pageTerms.length === 0) {
            tbody.innerHTML = `
                <tr class="no-results">
                    <td colspan="6"><p>No terms found</p></td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageTerms.map(term => `
            <tr data-term-id="${term.id}">
                <td class="col-eng">
                    <strong>${this.escapeHtml(term.eng_term || '')}</strong>
                    ${term.eng_definition ? `<br><small class="text-muted">${this.escapeHtml(this.truncate(term.eng_definition, 60))}</small>` : ''}
                </td>
                <td class="col-haw">
                    ${term.haw_term ? this.escapeHtml(term.haw_term) : '<span class="text-muted">—</span>'}
                    ${term.haw_status ? `<br><span class="status-badge status-${term.haw_status}">${this.formatStatus(term.haw_status)}</span>` : ''}
                </td>
                <td class="col-mao">
                    ${term.mao_term ? this.escapeHtml(term.mao_term) : '<span class="text-muted">—</span>'}
                    ${term.mao_status ? `<br><span class="status-badge status-${term.mao_status}">${this.formatStatus(term.mao_status)}</span>` : ''}
                </td>
                <td class="col-domain">
                    ${term.primary_domain ? `
                        <span class="domain-badge domain-${term.primary_domain}">${term.primary_domain}</span>
                        ${term.subdomain ? `<br><small>${this.escapeHtml(term.subdomain)}</small>` : ''}
                    ` : '<span class="text-muted">—</span>'}
                </td>
                <td class="col-status">
                    <span class="status-badge status-${term.review_status || 'needs_check'}">${this.formatStatus(term.review_status || 'needs_check')}</span>
                </td>
                <td class="col-actions">
                    <button class="btn-small btn-edit" onclick="manager.editTerm('${term.id}')">Edit</button>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredTerms.length / this.resultsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';

        if (this.currentPage > 1) {
            html += `<button class="btn-small" onclick="manager.goToPage(${this.currentPage - 1})">Previous</button>`;
        }

        html += `<span class="page-info">Page ${this.currentPage} of ${totalPages}</span>`;

        if (this.currentPage < totalPages) {
            html += `<button class="btn-small" onclick="manager.goToPage(${this.currentPage + 1})">Next</button>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderResults();
        window.scrollTo(0, 0);
    }

    updateResultsCount() {
        const counter = document.getElementById('results-count');
        if (counter) {
            counter.textContent = `${this.filteredTerms.length} results`;
        }
    }

    updateStats() {
        const statsElement = document.getElementById('total-count');
        if (statsElement) {
            statsElement.textContent = `${this.allTerms.length} terms`;
        }
    }

    showNewTermModal() {
        this.currentTerm = null;
        document.getElementById('modal-title').textContent = 'New Technical Term';
        document.getElementById('term-form').reset();
        document.getElementById('term-id').value = '';
        document.getElementById('delete-term').style.display = 'none';
        document.getElementById('term-detail-modal').classList.add('active');
    }

    async editTerm(termId) {
        const term = this.allTerms.find(t => t.id === termId);
        if (!term) {
            alert('Term not found');
            return;
        }

        this.currentTerm = term;
        document.getElementById('modal-title').textContent = 'Edit Technical Term';
        document.getElementById('delete-term').style.display = 'block';

        // Populate form
        document.getElementById('term-id').value = term.id || '';

        // English
        document.getElementById('eng-term').value = term.eng_term || '';
        document.getElementById('eng-pos').value = term.eng_pos || '';
        document.getElementById('eng-definition').value = term.eng_definition || '';
        document.getElementById('eng-examples').value = term.eng_examples || '';
        document.getElementById('eng-notes').value = term.eng_notes || '';

        // Hawaiian
        document.getElementById('haw-term').value = term.haw_term || '';
        document.getElementById('haw-pos').value = term.haw_pos || '';
        document.getElementById('haw-definition').value = term.haw_definition || '';
        document.getElementById('haw-examples').value = term.haw_examples || '';
        document.getElementById('haw-source').value = term.haw_source || '';
        document.getElementById('haw-status').value = term.haw_status || 'pending_approval';
        document.getElementById('haw-notes').value = term.haw_notes || '';

        // Māori
        document.getElementById('mao-term').value = term.mao_term || '';
        document.getElementById('mao-pos').value = term.mao_pos || '';
        document.getElementById('mao-definition').value = term.mao_definition || '';
        document.getElementById('mao-examples').value = term.mao_examples || '';
        document.getElementById('mao-source').value = term.mao_source || '';
        document.getElementById('mao-status').value = term.mao_status || 'pending_approval';
        document.getElementById('mao-notes').value = term.mao_notes || '';

        // Metadata
        document.getElementById('primary-domain').value = term.primary_domain || '';
        document.getElementById('subdomain').value = term.subdomain || '';
        document.getElementById('primary-source').value = term.primary_source || '';
        document.getElementById('review-status').value = term.review_status || 'needs_check';

        document.getElementById('term-detail-modal').classList.add('active');
    }

    async saveTerm() {
        const termId = document.getElementById('term-id').value;

        // Gather form data
        const termData = {
            eng_term: document.getElementById('eng-term').value.trim(),
            eng_pos: document.getElementById('eng-pos').value.trim() || null,
            eng_definition: document.getElementById('eng-definition').value.trim() || null,
            eng_examples: document.getElementById('eng-examples').value.trim() || null,
            eng_notes: document.getElementById('eng-notes').value.trim() || null,

            haw_term: document.getElementById('haw-term').value.trim() || null,
            haw_pos: document.getElementById('haw-pos').value.trim() || null,
            haw_definition: document.getElementById('haw-definition').value.trim() || null,
            haw_examples: document.getElementById('haw-examples').value.trim() || null,
            haw_source: document.getElementById('haw-source').value.trim() || null,
            haw_status: document.getElementById('haw-status').value,
            haw_notes: document.getElementById('haw-notes').value.trim() || null,

            mao_term: document.getElementById('mao-term').value.trim() || null,
            mao_pos: document.getElementById('mao-pos').value.trim() || null,
            mao_definition: document.getElementById('mao-definition').value.trim() || null,
            mao_examples: document.getElementById('mao-examples').value.trim() || null,
            mao_source: document.getElementById('mao-source').value.trim() || null,
            mao_status: document.getElementById('mao-status').value,
            mao_notes: document.getElementById('mao-notes').value.trim() || null,

            primary_domain: document.getElementById('primary-domain').value || null,
            subdomain: document.getElementById('subdomain').value.trim() || null,
            primary_source: document.getElementById('primary-source').value.trim() || null,
            review_status: document.getElementById('review-status').value
        };

        // Validate
        if (!termData.eng_term) {
            alert('English term is required');
            return;
        }

        try {
            if (termId) {
                // Update existing term
                const { error } = await this.supabase
                    .from('tech_terms')
                    .update(termData)
                    .eq('id', termId);

                if (error) throw error;
            } else {
                // Insert new term
                const { error } = await this.supabase
                    .from('tech_terms')
                    .insert([termData]);

                if (error) throw error;
            }

            this.closeModal();
            await this.loadTerms();
            alert(termId ? 'Term updated successfully' : 'Term created successfully');
        } catch (error) {
            console.error('Error saving term:', error);
            alert('Error saving term: ' + error.message);
        }
    }

    async deleteTerm() {
        if (!this.currentTerm) return;

        const confirmed = confirm(`Are you sure you want to delete "${this.currentTerm.eng_term}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        try {
            const { error } = await this.supabase
                .from('tech_terms')
                .delete()
                .eq('id', this.currentTerm.id);

            if (error) throw error;

            this.closeModal();
            await this.loadTerms();
            alert('Term deleted successfully');
        } catch (error) {
            console.error('Error deleting term:', error);
            alert('Error deleting term: ' + error.message);
        }
    }

    closeModal() {
        document.getElementById('term-detail-modal').classList.remove('active');
        this.currentTerm = null;
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatStatus(status) {
        const statusMap = {
            'approved': 'Approved',
            'pending_approval': 'Pending',
            'in_progress': 'In Progress',
            'needs_check': 'Needs Check',
            'needs_native_review': 'Needs Review',
            'ok': 'OK',
            'deprecated': 'Deprecated'
        };
        return statusMap[status] || status;
    }
}

// Initialize on page load
let manager;
window.addEventListener('DOMContentLoaded', () => {
    manager = new TechTermsManager();
});
