window.addEventListener('load', function() {

    console.log('loading...');

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
        scriptsToLoad.push('/js/restaurant_info.js');
    }

    let i = 0;
    scriptsToLoad.forEach(function(src) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = function() {
            i++;
            if (i === scriptsToLoad.length) {

                window.initMap();
                window.setTimeout(function() {
                    const _iframes = document.getElementsByTagName('iframe');
                    for (let i = 0; i < _iframes.length; i++) {
                        _iframes[i].title = 'Google Map';
                    }
                    new LazyLoad();
                }, 250);


            }
        };
        document.head.appendChild(script);
        console.log('Loading: ' + src);

    });

});

/*initMap
const _worker = new Worker('/js/worker.js');
_worker.addEventListener('message', function(e) {
    console.log('Worker: ' + e.data);
});
_worker.postMessage('load');
*/

// Load service worker
if ( 'serviceWorker' in navigator ) {
    window.addEventListener('load', function() {
        navigator
            .serviceWorker
            .register('/sw.js', { scope: '/' })
            .then(function(registration) {
                console.log('Service Worker registration successful with scope: ', registration.scope);
            })
            .catch(function (err) {
                console.log('Service Worker Failed to Register', err);
            });
    });
}