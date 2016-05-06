define([], function () {
    return {
        boot: function (el, context, config, mediator) {
            // Extract href of the first link in the content, if any
            var iframe;
            var isVisible;
            var link = el.querySelector('a[href]');

            function _postMessage(message) {
                iframe.contentWindow.postMessage(JSON.stringify(message), '*');
            }

            // threshold represents the fraction of the element that must be in the
            // viewport before it is considered visible.
            // e.g. 0.5 means that half the height or width must be in the viewport
            //      1 means that the entire element must be in the viewport
            //      (defaults to 1)
            function _isVisible(threshold) {
                var threshold = threshold || 1;
                var box = el.getBoundingClientRect();
                var width = box.right - box.left;
                var height = box.bottom - box.top;
                var windowHeight = window.innerHeight || document.documentElement.clientHeight;
                var windowWidth = window.innerWidth || document.documentElement.clientWidth;
                return (
                    box.left >= -(width * (1 - threshold)) &&
                    box.top >= -(height * (1 - threshold)) &&
                    box.right <= windowWidth + (width * (1 - threshold)) &&
                    box.bottom <= windowHeight + (height * (1 - threshold))
                );
            }

            function _hasVisibilityChanged(threshold) {
                var wasVisible = isVisible;
                isVisible = _isVisible(threshold);
                return (wasVisible !== isVisible);
            }

            function _postMessageOnVisibilityChange(threshold) {
                if (_hasVisibilityChanged(threshold)) {
                    _postMessage({
                        'type': 'visibility',
                        'visible': isVisible
                    });
                }
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
                            _postMessage({
                                'id':           message.id,
                                'type':         message.type,
                                'iframeTop':    iframe.getBoundingClientRect().top,
                                'innerHeight':  window.innerHeight,
                                'innerWidth':   window.innerWidth,
                                'pageYOffset':  window.pageYOffset
                            });
                            break;
                        case 'monitor-visibility':
                            // Send initial visibility value
                            _postMessage({
                                'type': 'visibility',
                                'visible': _isVisible(message.threshold)
                            });

                            // Send updated visibility if and when it changes
                            window.addEventListener('scroll', function(ev) {
                                _postMessageOnVisibilityChange(message.threshold);
                            });
                            window.addEventListener('resize', function(ev) {
                                _postMessageOnVisibilityChange(message.threshold);
                            });
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

