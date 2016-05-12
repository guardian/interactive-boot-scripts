define([], function () {
    return {
        boot: function (el, context, config, mediator) {
            // Extract href of the first link in the content, if any
            var iframe;
            var link = el.querySelector('a[href]');

            // Calls func on trailing edge of the wait period
            function _debounce(func, wait) {
                var timeout;
                return function() {
                    var context = this, args = arguments;
                    var later = function() {
                        func.apply(context, args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            function _postMessage(message) {
                iframe.contentWindow.postMessage(JSON.stringify(message), '*');
            }

            if (link) {
                iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.border = 'none';
                iframe.height = '500'; // default height
                iframe.src = link.href;

                // Listen for requests from the window
                window.addEventListener('message', function(event) {
                    if (event.source !== iframe.contentWindow) {
                        return;
                    }

                    // IE 8 + 9 only support strings
                    var message = JSON.parse(event.data);

                    function _postPositionMessage(subscribe) {
                        var iframeBox = iframe.getBoundingClientRect();
                        _postMessage({
                            'id':           message.id,
                            'type':         message.type,
                            'subscribe':    !!subscribe,
                            'iframeTop':    iframeBox.top,
                            'iframeRight':  iframeBox.right,
                            'iframeBottom': iframeBox.bottom,
                            'iframeLeft':   iframeBox.left,
                            'innerHeight':  window.innerHeight,
                            'innerWidth':   window.innerWidth,
                            'pageYOffset':  window.pageYOffset,
                        });
                    }

                    // Actions
                    switch (message.type) {
                        case 'set-height':
                            iframe.height = message.value;
                            break;
                        case 'navigate':
                            document.location.href = message.value;
                            break;
                        case 'scroll-to':
                            window.scrollTo(message.x, message.y);
                            break;
                        case 'get-location':
                            _postMessage({
                                'id':       message.id,
                                'type':     message.type,
                                'hash':     window.location.hash,
                                'host':     window.location.host,
                                'hostname': window.location.hostname,
                                'href':     window.location.href,
                                'origin':   window.location.origin,
                                'pathname': window.location.pathname,
                                'port':     window.location.port,
                                'protocol': window.location.protocol,
                                'search':   window.location.search
                            }, message.id);
                            break;
                        case 'get-position':
                            _postPositionMessage();
                            break;
                        case 'monitor-position':
                            // Send initial position
                            _postPositionMessage(true);

                            // Send updated position on scroll or resize
                            window.addEventListener('scroll', _debounce(function(ev) {
                                _postPositionMessage(true);
                            }, 50));
                            window.addEventListener('resize', _debounce(function(ev) {
                                _postPositionMessage(true);
                            }, 50));
                            break;
                    }
                }, false);

                // Replace link with iframe
                // Note: link is assumed to be a direct child
                el.replaceChild(iframe, link);
            } else {
                console.warn('iframe-wrapper applied to element without any link');
            }
        }
    };
});

