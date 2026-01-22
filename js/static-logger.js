/**
 * Static Site Logger
 * Lightweight logging for static sites - stores logs in localStorage
 * and can optionally send to an analytics endpoint.
 */
(function() {
    'use strict';
    
    const STORAGE_KEY = 'static_site_logs';
    const MAX_LOGS = 100;
    
    const StaticLogger = {
        logs: [],
        
        init: function() {
            this.loadLogs();
            this.logPageView();
            window.onerror = this.logError.bind(this);
        },
        
        loadLogs: function() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                this.logs = stored ? JSON.parse(stored) : [];
            } catch (e) {
                this.logs = [];
            }
        },
        
        saveLogs: function() {
            try {
                // Keep only the last MAX_LOGS entries
                if (this.logs.length > MAX_LOGS) {
                    this.logs = this.logs.slice(-MAX_LOGS);
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
            } catch (e) {
                console.warn('Failed to save logs:', e);
            }
        },
        
        log: function(level, message, data) {
            const entry = {
                timestamp: new Date().toISOString(),
                level: level,
                message: message,
                data: data || null,
                page: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 100)
            };
            
            this.logs.push(entry);
            this.saveLogs();
            
            // Also log to console in development
            if (window.location.hostname === 'localhost') {
                console.log(`[${level}] ${message}`, data);
            }
        },
        
        info: function(message, data) { this.log('INFO', message, data); },
        warn: function(message, data) { this.log('WARN', message, data); },
        error: function(message, data) { this.log('ERROR', message, data); },
        
        logPageView: function() {
            this.info('Page View', {
                path: window.location.pathname,
                referrer: document.referrer || 'direct',
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            });
        },
        
        logError: function(message, source, lineno, colno, error) {
            this.error('JavaScript Error', {
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error?.stack
            });
            return false; // Let the error propagate
        },
        
        getLogs: function(level) {
            if (level) {
                return this.logs.filter(l => l.level === level);
            }
            return this.logs;
        },
        
        clearLogs: function() {
            this.logs = [];
            localStorage.removeItem(STORAGE_KEY);
        },
        
        exportLogs: function() {
            const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'static-site-logs-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { StaticLogger.init(); });
    } else {
        StaticLogger.init();
    }
    
    // Expose to global scope
    window.StaticLogger = StaticLogger;
})();