/**
 * Shared Slider Functionality
 * Provides common scroll and filter functions for horizontal card sliders.
 */
(function() {
    'use strict';

    /**
     * Scrolls a slider track in the specified direction.
     * @param {string} trackSelector - CSS selector for the slider track element
     * @param {number} direction - Direction to scroll (-1 for left, 1 for right)
     * @param {number} scrollAmount - Amount to scroll in pixels (default: 220)
     */
    window.scrollSlider = function(trackSelector, direction, scrollAmount) {
        scrollAmount = scrollAmount || 220;
        const track = document.querySelector(trackSelector);
        if (track) {
            track.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
        }
    };

    /**
     * Filters slider items by group (case-insensitive comparison).
     * @param {HTMLElement} btn - The button element that was clicked
     * @param {string} group - The group value to filter by (empty string for all)
     * @param {string} pillsSelector - CSS selector for all pill buttons
     * @param {string} itemsSelector - CSS selector for all slider items
     */
    window.filterSliderByGroup = function(btn, group, pillsSelector, itemsSelector) {
        // Update active pill
        document.querySelectorAll(pillsSelector).forEach(function(p) {
            p.classList.remove('active');
        });
        btn.classList.add('active');

        // Normalize group for comparison (trim and lowercase)
        var normalizedGroup = (group || '').trim().toLowerCase();

        // Filter items (case-insensitive comparison)
        document.querySelectorAll(itemsSelector).forEach(function(item) {
            var itemGroup = (item.dataset.group || '').trim().toLowerCase();
            if (normalizedGroup === '' || itemGroup === normalizedGroup) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };

    // ===== SERVICES SLIDER =====
    window.scrollServicesSlider = function(direction) {
        scrollSlider('.services-slider-track', direction, 220);
    };

    window.filterSliderGroup = function(btn, group) {
        filterSliderByGroup(btn, group, '.slider-group-pill', '.service-slide');
    };

    // ===== TEAM SLIDER =====
    window.scrollTeamSlider = function(direction) {
        scrollSlider('.team-slider-track', direction, 200);
    };

    window.filterTeamSliderGroup = function(btn, group) {
        filterSliderByGroup(btn, group, '.team-slider-groups .slider-group-pill', '.team-slide');
    };

    // ===== GALLERY SLIDER =====
    window.scrollGallerySlider = function(direction) {
        scrollSlider('.gallery-slider-track', direction, 220);
    };

    window.filterGallerySliderGroup = function(btn, group) {
        filterSliderByGroup(btn, group, '.gallery-slider-groups .slider-group-pill', '.gallery-slide');
    };

    // ===== NEWSFEED SLIDER =====
    window.scrollNewsFeedSlider = function(direction) {
        scrollSlider('.newsfeed-slider-track', direction, 240);
    };

    window.filterNewsFeedSliderGroup = function(btn, group) {
        filterSliderByGroup(btn, group, '.newsfeed-slider-groups .slider-group-pill', '.article-slide');
    };

})();
