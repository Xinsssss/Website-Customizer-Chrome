
(function() {
    function applyBackgroundColor(color) {
        document.body.style.backgroundColor = color;
        s
        const viewportHeight = window.innerHeight;
        const heightThreshold = viewportHeight * 0.85;
        const allElements = document.querySelectorAll('*');
        const backgroundElements = [];
        
        allElements.forEach(element => {

            const tagName = element.tagName.toLowerCase();
            if (['img', 'video', 'canvas', 'svg', 'iframe', 'button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
                return;
            }
            
            if (element.childNodes.length > 0) {
                const hasDirectText = Array.from(element.childNodes).some(node => 
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
                );
                if (hasDirectText) return;
            }
            
            const rect = element.getBoundingClientRect();
            
            if (rect.height >= heightThreshold && 
                rect.width > 0 && 
                rect.top < viewportHeight && 
                rect.bottom > 0) {
                
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.display !== 'none' && 
                    computedStyle.visibility !== 'hidden' && 
                    computedStyle.opacity !== '0') {
                    
                    backgroundElements.push({
                        element: element,
                        height: rect.height,
                        width: rect.width,
                        area: rect.height * rect.width,
                        zIndex: parseInt(computedStyle.zIndex) || 0
                    });
                }
            }
        });
        
        backgroundElements
            .sort((a, b) => b.area - a.area)
            .forEach(item => {
                const currentBg = window.getComputedStyle(item.element).backgroundColor;
                if (currentBg === 'rgba(0, 0, 0, 0)' || currentBg === 'transparent' || 
                    currentBg === 'rgb(255, 255, 255)' || currentBg === 'white') {
                    item.element.style.backgroundColor = color;
                }
            });
    }

    function getRootDomain() {
        try {
            const url = new URL(window.location.href);
            return url.hostname;
        } catch (e) {
            return null;
        }
    }

    function checkAndApplySettings() {
        const rootDomain = getRootDomain();
        if (!rootDomain) return;

        chrome.storage.sync.get(['siteSettings'], function(result) {
            const siteSettings = result.siteSettings || {};
            
            let settings = siteSettings[rootDomain];
            
            if (!settings) {
                const domainWithoutWww = rootDomain.replace(/^www\./, '');
                settings = siteSettings[domainWithoutWww];
            }
            
            if (!settings && !rootDomain.startsWith('www.')) {
                const domainWithWww = 'www.' + rootDomain;
                settings = siteSettings[domainWithWww];
            }
            
            if (!settings) {
                const baseDomain = rootDomain.split('.').slice(-2).join('.');
                Object.keys(siteSettings).forEach(function(savedDomain) {
                    const savedBaseDomain = savedDomain.split('.').slice(-2).join('.');
                    if (savedBaseDomain === baseDomain) {
                        settings = siteSettings[savedDomain];
                    }
                });
            }

            if (settings) {
                if (chrome.tabs && chrome.tabs.getZoom) {
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs[0]) {
                            chrome.tabs.setZoom(tabs[0].id, settings.zoomLevel / 100);
                        }
                    });
                }

                applyBackgroundColor(settings.backgroundColor);
            }
        });
    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'applyStyles') {
            applyBackgroundColor(request.backgroundColor);
            sendResponse({success: true});
        }
        return true;
    });
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndApplySettings);
    } else {
        checkAndApplySettings();
    }

    let currentUrl = window.location.href;
    setInterval(function() {
        if (currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            setTimeout(checkAndApplySettings, 500);
        }
    }, 1000);
})();