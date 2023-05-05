/*
 * Sort of working Image implementation for jsdom, supporting
 * http, https, and file urls.
 */

var fs = require('fs');
var request = require('request').defaults({
    encoding: null
});

var CanvasImage = require('canvas').Image;

function stripQuerystring (url) {
    if (url.indexOf('?') !== -1) {
        url = url.substr(0, url.indexOf('?'));
    }
    return url;
}

var Image = function Image () {};
Image.prototype.__defineSetter__('src', function (src) {
    var self = this;

    function buffer2image (buffer) {
        var image = new CanvasImage();
        //if (self.onload) {
        //    self.onload.apply(image);
        //}
        image.onload = () => resolve(image);
        image.onerror = () => console.log('Failed to load image', buffer.toString('hex'));
        
        image.src = buffer;
    }
    switch (src.substr(0, 7)) {
    case 'https:/':
        console.log(src);
        request.get(src, function (err, res, buffer) {
            if (err) {
                console.error('Could not get url', err);
                return;
            }
            //console.log(res);
            console.log(buffer.length);            
            buffer2image(buffer);
        });
        break;            
    case 'http://':
        request.get(src, function (err, res, buffer) {
            if (err) {
                console.error('Could not get url', err);
                return;
            }

            buffer2image(buffer);
        });
        break;
    case 'file://':
        // strip off file://
        src = src.substr(7);

    default: // fallthrough
        src = stripQuerystring(src);

        fs.exists(src, function (exists) {
            if (!exists) {
                console.error('Could not find image ', src);
                return;
            }

            fs.readFile(src, function (err, buffer) {
                if (err) {
                    console.err(err);
                    return;
                }
                buffer2image(buffer);
            });
        });
        break;
        // console.error('Image not implemented for url: ' + src);
    }
});

module.exports = Image;
