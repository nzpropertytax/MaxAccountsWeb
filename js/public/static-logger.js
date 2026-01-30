/**
 * Static Site Logger
 * Lightweight logging for static sites - tracks page views and JavaScript errors.
 * 
 * Configuration (set before including this script):
 * - window.StaticLoggerConfig.apiEndpoint: URL to send data to
 * - window.StaticLoggerConfig.apiKey: API key for authentication
 * - window.StaticLoggerConfig.siteId: Site identifier
 * - window.StaticLoggerConfig.trackPageViews: Whether to track page views (default: true)
 * - window.StaticLoggerConfig.batchInterval: How often to send data in ms (default: 30000)
 */
(function() {
    'use strict';
    
    const STORAGE_KEY = 'static_site_logs';
    const MAX_ENTRIES = 100;
    
    // Default configuration
    const defaultConfig = {
        apiEndpoint: null,
        apiKey: null,
        siteId: null,
        trackPageViews: true,
        batchInterval: 30000, // 30 seconds
        maxBatchSize: 20,
        debugMode: false
    };
    
    // Merge with user config
    const config = Object.assign({}, defaultConfig, window.StaticLoggerConfig || {});
    
    const StaticLogger = {
        entries: [],
        pendingEntries: [],
        batchTimer: null,
        pageStartTime: Date.now(),
        
        init: function() {
            this.loadFromStorage();
            
            // Track page view
            if (config.trackPageViews) {
                this.trackPageView();
            }
            
            // Capture JavaScript errors
            window.onerror = this.handleError.bind(this);
            window.onunhandledrejection = this.handlePromiseRejection.bind(this);
            
            // Start batch timer if API endpoint is configured
            if (config.apiEndpoint) {
                this.startBatchTimer();
            }
            
            // Send remaining data on page unload
            window.addEventListener('beforeunload', this.flush.bind(this));
            
            this.debug('StaticLogger initialized', config);
        },
        
        debug: function(message, data) {
            if (config.debugMode || window.location.hostname === 'localhost') {
                console.log('[StaticLogger]', message, data || '');
            }
        },
        
        loadFromStorage: function() {
            try {
                var stored = localStorage.getItem(STORAGE_KEY);
                this.entries = stored ? JSON.parse(stored) : [];
            } catch (e) {
                this.entries = [];
            }
        },
        
        saveToStorage: function() {
            try {
                if (this.entries.length > MAX_ENTRIES) {
                    this.entries = this.entries.slice(-MAX_ENTRIES);
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
            } catch (e) {
                // localStorage not available
            }
        },
        
        generateId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
        },
        
        trackPageView: function() {
            var entry = {
                id: this.generateId(),
                type: 'pageview',
                timestamp: new Date().toISOString(),
                siteId: config.siteId,
                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer || null,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            };
            
            this.entries.push(entry);
            this.pendingEntries.push(entry);
            this.saveToStorage();
            
            this.debug('Page view tracked', entry.path);
        },
        
        logError: function(message, data) {
            var entry = {
                id: this.generateId(),
                type: 'error',
                timestamp: new Date().toISOString(),
                siteId: config.siteId,
                level: 'ERROR',
                message: message,
                data: data || null,
                path: window.location.pathname
            };
            
            this.entries.push(entry);
            this.pendingEntries.push(entry);
            this.saveToStorage();
            
            this.debug('Error logged', message);
            return entry;
        },
        
        handleError: function(message, source, lineno, colno, error) {
            this.logError('JavaScript Error: ' + message, {
                source: source,
                line: lineno,
                column: colno,
                stack: error && error.stack ? error.stack.substring(0, 500) : null
            });
            return false; // Let the error propagate
        },
        
        handlePromiseRejection: function(event) {
            this.logError('Unhandled Promise Rejection', {
                reason: String(event.reason),
                stack: event.reason && event.reason.stack ? event.reason.stack.substring(0, 500) : null
            });
        },
        
        startBatchTimer: function() {
            var self = this;
            if (this.batchTimer) {
                clearInterval(this.batchTimer);
            }
            
            this.batchTimer = setInterval(function() {
                self.sendPendingData();
            }, config.batchInterval);
        },
        
        sendPendingData: function() {
            if (!config.apiEndpoint || this.pendingEntries.length === 0) {
                return;
            }
            
            var entriesToSend = this.pendingEntries.splice(0, config.maxBatchSize);
            
            var payload = {
                siteId: config.siteId,
                apiKey: config.apiKey,
                entries: entriesToSend
            };
            
            this.debug('Sending batch', { count: entriesToSend.length });
            
            var self = this;
            this.sendToApi(config.apiEndpoint, payload)
                .then(function(response) {
                    if (!response.success) {
                        // Re-queue failed entries
                        self.pendingEntries = entriesToSend.concat(self.pendingEntries);
                    }
                })
                .catch(function() {
                    // Re-queue failed entries
                    self.pendingEntries = entriesToSend.concat(self.pendingEntries);
                });
        },
        
        sendToApi: function(endpoint, payload) {
            var headers = {
                'Content-Type': 'application/json'
            };
            
            if (config.apiKey) {
                headers['X-API-Key'] = config.apiKey;
            }
            
            return fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                keepalive: true
            })
            .then(function(response) { 
                return response.json(); 
            })
            .catch(function(error) {
                return { success: false, error: error.message };
            });
        },
        
        flush: function() {
            this.sendPendingData();
        },
        
        // Public API for manual logging
        log: function(message, data) {
            var entry = {
                id: this.generateId(),
                type: 'log',
                timestamp: new Date().toISOString(),
                siteId: config.siteId,
                level: 'INFO',
                message: message,
                data: data || null,
                path: window.location.pathname
            };
            
            this.entries.push(entry);
            this.pendingEntries.push(entry);
            this.saveToStorage();
            
            return entry;
        },
        
        getEntries: function() {
            return this.entries;
        },
        
        clear: function() {
            this.entries = [];
            this.pendingEntries = [];
            localStorage.removeItem(STORAGE_KEY);
        },
        
        exportLogs: function() {
            var blob = new Blob([JSON.stringify(this.entries, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'static-site-logs-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
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

