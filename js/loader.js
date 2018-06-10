// Load async scripts on sucesive order
const loadScript = function(arrPath, onComplete) {

    if (arrPath.length > 0) {
        const script = document.createElement('script');
        script.src = arrPath[0];
        script.onload = function() {
            arrPath.shift();
            loadScript(arrPath, onComplete);
        };
        document.head.appendChild(script);
    } else {
        onComplete();
    }

};


window.addEventListener('load', function() {

    const scriptsToLoad =  [
        'https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/8.7.1/lazyload.min.js',
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyD0_isyJ0lKYeI4467C_TE5ePjG0roTrIg&libraries=places',
        '/js/idb/idb.js',
        '/js/dbhelper.js',
        '/js/idbhelper.js'
    ];

    if (window.currentPage === 'index') {
        scriptsToLoad.push('/js/main.js');
    } else if (window.currentPage === 'restaurant') {
        scriptsToLoad.push('/js/review_modal.js');
        scriptsToLoad.push('/js/restaurant_info.js');
    }

    loadScript(scriptsToLoad, function() {

        window.initMap();
        window.setTimeout(function() {
            const _iframes = document.getElementsByTagName('iframe');
            for (let i = 0; i < _iframes.length; i++) {
                _iframes[i].title = 'Google Map';
            }
            new LazyLoad();
        }, 250);

    });

});

// Load service worker
window.swHelper = null;
if ( 'serviceWorker' in navigator ) {

    window.addEventListener('load', function() {

        navigator
            .serviceWorker
            .register('/sw.js', { scope: '/' })
            .then(function(registration) {
                window.swHelper = registration;
                console.log('[App] Service Worker registration successful with scope: ', registration.scope);
            })
            .catch(function (err) {
                console.log('[App] Service Worker Failed to Register', err);
            });

    });

}

window.appIsOnline = true;
window.addEventListener('online', function() {
    console.log('[App] Network is now online');
    window.appIsOnline = true;
    if ('SyncManager' in window && window.swHelper !== null) {
        window.swHelper.sync.register('sync-reviews');
    }
});
window.addEventListener('offline', function() {
    console.log('[App] Network is now offline');
    window.appIsOnline = false;
});