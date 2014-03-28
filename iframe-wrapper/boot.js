define([], function () {
    return {
        boot: function (el, context, config, mediator) {
            // Extract href of the first link in the content, if any
            var iframe;
            var link = el.querySelector('a[href]');
            var matches = link.href.match(/(^https?\:\/\/[^\/?#]+)(?:[\/?#]|$)/i);
            var iframeDomain = matches && matches[1];

            function _postMessage(message) {
                iframe.contentWindow.postMessage(JSON.stringify(message), '*');
            }

            function _isSignedIn() {
                return document.cookie.match('GU_U=');
            }

            function _showElement(element) {
                element.className = element.className.replace(/\bis-hidden\b/, "").replace(/\bhidden\b/, "");
            }

            function _requireSignin() {
                var requestSignin = el.querySelector(".js-signin-required-help-text");

                var signinUrl = "https://profile.theguardian.com/signin?returnUrl=";
                signinUrl += encodeURIComponent(window.location.href);

                var signinLink = document.createElement("a");
                signinLink.setAttribute("href", signinUrl)
                signinLink.className = "sign-in-link fancy-button fancy-button-inline muted submit-input";
                var signinLinkText = document.createTextNode("Sign in");
                signinLink.appendChild(signinLinkText);

                requestSignin.appendChild(signinLink);

                _showElement(requestSignin);

                link.className += " hidden is-hidden";
            }

            function _createIframe() {
                iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.border = 'none';
                iframe.height = '500'; // default height
                iframe.src = link.href;
                iframe.className = link.className;

                // Listen for requests from the window
                window.addEventListener('message', function(event) {
                    if (event.origin !== iframeDomain) {
                        return;
                    }

                    // IE 8 + 9 only support strings
                    var message = JSON.parse(event.data);

                    // Restrict message events to source iframe
                    if (!message.href || message.href !== link.href) {
                        return;
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
                        case 'get-position':
                            _postMessage({
                                'iframeTop':    iframe.getBoundingClientRect().top,
                                'innerHeight':  window.innerHeight,
                                'pageYOffset':  window.pageYOffset
                            });
                            break;
                        default:
                           console.error('Received unknown action from iframe: ', message);
                    }
                }, false);

                // Replace link with iframe
                // Note: link is assumed to be a direct child
                el.replaceChild(iframe, link);
                _showElement(iframe);
            }

            if (link) {
                if (el.className.match(/\bjs-request-user-signin\b/)) {
                    if (_isSignedIn()) {
                        _createIframe();
                    } else {
                        _requireSignin();
                    }
                } else {
                    _createIframe();
                }
            } else {
                console.warn('iframe-wrapper applied to element without any link');
            }
        }
    };
});
