chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'setZoom') {
        chrome.tabs.setZoom(sender.tab.id, request.zoomLevel);
    }
});