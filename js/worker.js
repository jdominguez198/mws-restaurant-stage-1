self.addEventListener('message', function(e) {

    if (typeof importScripts === 'function') {
        importScripts('/js/main.js');

        self.postMessage('loaded');
    }

});