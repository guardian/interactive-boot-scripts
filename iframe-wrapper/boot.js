define([], function () {
    return {
        boot: function (el, context, config, mediator) {
            // Extract href of the first link in the content, if any
            var link = el.querySelector('a[href]');
            if (link) {
                var iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.border = 'none';
                iframe.height = '500'; // default height
                iframe.src = link.href;

                // Listen for requests from the window
                window.addEventListener('message', function(event) {
                    var message = JSON.parse(event.data); // IE 8 + 9 only support strings

                    if (message.type === 'set-height') {
                        iframe.height = message.value;
                    } else if (message.type === 'navigate') {
                        document.location.href = message.value;
                    } else {
                        console.error('Received unknown message from iframe: ', message);
                    }
                }, false);

                // Replace link with iframe
                el.removeChild(link); // assumed to be direct child
                el.appendChild(iframe);
            } else {
                console.warn('iframe-wrapper applied to element without any link');
            }
        }
    };
});
