define([], function () {
    return {
        boot: function (el, context, config, mediator) {
            // Extract href of the first link in the content, if any
            var link = el.querySelector('a[href]');
            if (link) {
                var iframe = document.createElement('iframe');
                iframe.style.width = '100%';
                iframe.style.height = '500px'; // default height
                iframe.style.border = 'none';
                iframe.src = link.href;

                // Listen for requests from the iframe
                iframe.addEventListener('message', function(message) {
                    if (message.type === 'set-height') {
                        iframe.height = message.value + 'px';
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
