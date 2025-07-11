document.addEventListener('DOMContentLoaded', function() {
    const rootUrlInput = document.getElementById('rootUrl');
    const zoomLevelInput = document.getElementById('zoomLevel');
    const backgroundColorInput = document.getElementById('backgroundColor');
    const colorPreview = document.getElementById('colorPreview');
    const saveBtn = document.getElementById('saveBtn');
    const applyCurrentBtn = document.getElementById('applyCurrentBtn');
    const currentUrlSpan = document.getElementById('currentUrl');
    const statusDiv = document.getElementById('status');
    const savedSitesList = document.getElementById('savedSitesList');

    let currentTab = null;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        currentTab = tabs[0];
        if (currentTab) {
            const url = new URL(currentTab.url);
            const rootDomain = url.hostname;
            currentUrlSpan.textContent = rootDomain;
            rootUrlInput.value = rootDomain;
            
            loadSiteSettings(rootDomain);
        }
    });

    backgroundColorInput.addEventListener('input', function() {
        colorPreview.textContent = backgroundColorInput.value;
    });


    saveBtn.addEventListener('click', function() {
        const rootUrl = rootUrlInput.value.trim();
        const zoomLevel = parseInt(zoomLevelInput.value);
        const backgroundColor = backgroundColorInput.value;

        if (!rootUrl) {
            showStatus('Please enter a root URL', 'error');
            return;
        }

        if (zoomLevel < 25 || zoomLevel > 500) {
            showStatus('Zoom level must be between 25% and 500%', 'error');
            return;
        }

        const settings = {
            rootUrl: rootUrl,
            zoomLevel: zoomLevel,
            backgroundColor: backgroundColor
        };

        chrome.storage.sync.get(['siteSettings'], function(result) {
            const siteSettings = result.siteSettings || {};
            siteSettings[rootUrl] = settings;
            
            chrome.storage.sync.set({siteSettings: siteSettings}, function() {
                showStatus('Settings saved successfully!', 'success');
                loadSavedSites();
            });
        });
    });


    applyCurrentBtn.addEventListener('click', function() {
        if (!currentTab) {
            showStatus('No active tab found', 'error');
            return;
        }

        const zoomLevel = parseInt(zoomLevelInput.value);
        const backgroundColor = backgroundColorInput.value;


        chrome.tabs.setZoom(currentTab.id, zoomLevel / 100);


        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: applyBackgroundColorDirect,
            args: [backgroundColor]
        }).then(() => {
            showStatus('Settings applied to current tab!', 'success');
        }).catch((error) => {
            console.error('Error applying settings:', error);
            showStatus('Error applying settings', 'error');
        });
    });


    function applyBackgroundColorDirect(color) {

        document.body.style.backgroundColor = color;
        

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

    function loadSiteSettings(rootUrl) {
        chrome.storage.sync.get(['siteSettings'], function(result) {
            const siteSettings = result.siteSettings || {};
            const settings = siteSettings[rootUrl];
            
            if (settings) {
                zoomLevelInput.value = settings.zoomLevel;
                backgroundColorInput.value = settings.backgroundColor;
                colorPreview.textContent = settings.backgroundColor;
            }
        });
    }

    function loadSavedSites() {
        chrome.storage.sync.get(['siteSettings'], function(result) {
            const siteSettings = result.siteSettings || {};
            savedSitesList.innerHTML = '';
            
            Object.keys(siteSettings).forEach(function(rootUrl) {
                const settings = siteSettings[rootUrl];
                const siteDiv = document.createElement('div');
                siteDiv.className = 'saved-site';
                
                siteDiv.innerHTML = `
                    <div class="saved-site-info">
                        <strong>${rootUrl}</strong><br>
                        Zoom: ${settings.zoomLevel}%, Color: ${settings.backgroundColor}
                    </div>
                    <button class="delete-btn" data-url="${rootUrl}">Delete</button>
                `;
                
                savedSitesList.appendChild(siteDiv);
            });

            document.querySelectorAll('.delete-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const urlToDelete = this.getAttribute('data-url');
                    deleteSiteSettings(urlToDelete);
                });
            });
        });
    }

    function deleteSiteSettings(rootUrl) {
        chrome.storage.sync.get(['siteSettings'], function(result) {
            const siteSettings = result.siteSettings || {};
            delete siteSettings[rootUrl];
            
            chrome.storage.sync.set({siteSettings: siteSettings}, function() {
                showStatus('Settings deleted successfully!', 'success');
                loadSavedSites();
            });
        });
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 3000);
    }
    loadSavedSites();
});