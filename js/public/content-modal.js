/**
 * Content Detail Modal Handler
 * Loads and displays full content in a Bootstrap modal for single-page sites.
 * 
 * Usage:
 * 1. Add data attributes to trigger elements:
 *    <button data-content-modal="true" 
 *            data-content-id="my-content-id" 
 *            data-content-type="page-content"
 *            data-title="My Title">
 *        Learn More
 *    </button>
 * 
 * 2. Or call programmatically:
 *    window.contentModal.show('my-content-id', 'page-content', 'My Title');
 * 
 * Supported content types:
 * - page-content (default)
 * - service
 * - team-member
 * - article
 * - portfolio
 */
(function() {
    'use strict';

    let modal = null;
    let modalEl = null;
    let modalTitle = null;
    let modalBody = null; 
    let isInitialized = false;

    /**
     * Initialize the modal handler
     */
    function init() {
        if (isInitialized) return;
        
        modalEl = document.getElementById('contentDetailModal');
        if (!modalEl) {
            console.warn('Content modal element not found. Modal functionality disabled.');
            return;
        }
        
        modal = new bootstrap.Modal(modalEl);
        modalTitle = document.getElementById('contentDetailModalTitle');
        modalBody = document.getElementById('contentDetailModalBody');
        
        // Handle modal trigger clicks via event delegation
        document.addEventListener('click', handleModalTrigger);
        
        // Handle pre-rendered content (for static sites)
        modalEl.addEventListener('show.bs.modal', handlePreRenderedContent);
        
        isInitialized = true;
    }

    /**
     * Handle clicks on modal trigger elements
     */
    function handleModalTrigger(e) {
        const trigger = e.target.closest('[data-content-modal]');
        if (!trigger) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const contentId = trigger.dataset.contentId;
        const contentType = trigger.dataset.contentType || 'page-content';
        const title = trigger.dataset.title || 'Details';
        
        if (!contentId) {
            console.error('Content modal trigger missing data-content-id attribute');
            return;
        }
        
        showModal(contentId, contentType, title);
    }

    /**
     * Handle pre-rendered content for static sites
     * Checks if content exists as a hidden element before making API call
     */
    function handlePreRenderedContent(e) {
        const trigger = e.relatedTarget;
        if (!trigger) return;
        
        const contentId = trigger.dataset.contentId;
        if (!contentId) return;
        
        // Check for pre-rendered content
        const preRendered = document.getElementById('modal-content-' + contentId);
        if (preRendered) {
            modalBody.innerHTML = preRendered.innerHTML;
            return;
        }
    }

    /**
     * Show modal with loading state and fetch content
     */
    function showModal(contentId, contentType, title) {
        if (!modal) {
            init();
            if (!modal) {
                console.error('Modal not available');
                return;
            }
        }
        
        // Check for pre-rendered content first (static sites)
        const preRendered = document.getElementById('modal-content-' + contentId);
        if (preRendered) {
            modalTitle.textContent = title;
            modalBody.innerHTML = preRendered.innerHTML;
            modal.show();
            return;
        }
        
        // Show loading state
        showLoading(title);
        modal.show();
        
        // Fetch content from API
        loadContent(contentId, contentType);
    }

    /**
     * Show loading spinner in modal
     */
    function showLoading(title) {
        modalTitle.textContent = title;
        modalBody.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading content...</p>
            </div>
        `;
    }

    /**
     * Show error message in modal
     */
    function showError(message) {
        modalBody.innerHTML = `
            <div class="alert alert-danger mb-0">
                <i class="fa fa-exclamation-triangle me-2"></i>
                ${escapeHtml(message || 'Failed to load content. Please try again.')}
            </div>
        `;
    }

    /**
     * Fetch and display content from API
     */
    async function loadContent(contentId, contentType) {
        try {
            const response = await fetch(`/api/content-modal/${contentType}/${encodeURIComponent(contentId)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    showError('Content not found.');
                } else {
                    showError(`Failed to load content (${response.status}).`);
                }
                return;
            }
            
            const html = await response.text();
            modalBody.innerHTML = html;
            
            // Initialize any Bootstrap components in the loaded content
            initializeBootstrapComponents();
            
        } catch (error) {
            console.error('Error loading modal content:', error);
            showError('Failed to load content. Please check your connection and try again.');
        }
    }

    /**
     * Initialize Bootstrap components in dynamically loaded content
     */
    function initializeBootstrapComponents() {
        // Initialize tooltips
        const tooltips = modalBody.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(el => new bootstrap.Tooltip(el));
        
        // Initialize carousels
        const carousels = modalBody.querySelectorAll('.carousel');
        carousels.forEach(el => new bootstrap.Carousel(el));
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /**
     * Export public API for programmatic use
     */
    window.contentModal = {
        /**
         * Show modal with content
         * @param {string} contentId - The ID of the content to display
         * @param {string} contentType - Type of content (page-content, service, team-member, article, portfolio)
         * @param {string} title - Modal title
         */
        show: function(contentId, contentType, title) {
            showModal(contentId, contentType || 'page-content', title || 'Details');
        },
        
        /**
         * Hide the modal
         */
        hide: function() {
            if (modal) {
                modal.hide();
            }
        },
        
        /**
         * Check if modal is initialized
         */
        isReady: function() {
            return isInitialized;
        }
    };
})();
