/**
 * leaflet-headless
 *
 * Server side leaflet with fake DOM using jsdom.
 */

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new jsdom.JSDOM('<html><head></head><body></body></html>', {
        features: {
            FetchExternalResources: ['img']
        }
    });
const { document } = window.window;
var path = require('path');

global.window = window;
global.document = document;
global.window.navigator.userAgent = 'webkit';
global.navigator = global.window.navigator;

if (!global.L) {
    // make some globals to fake browser behaviour.
    //global.document = new jsdom.JSDOM('<html><head></head><body></body></html>', {
    //    features: {
    //        FetchExternalResources: ['img']
    //    }
    //}).window;
    //console.log(global.document);
    //global.window = global.document;
    //global.window.navigator.userAgent = 'webkit';
    //global.navigator = global.window.navigator;
    global.Image = require('./src/image.js');

    global.L_DISABLE_3D = true;
    global.L_NO_TOUCH = true;

    var leafletPath = require.resolve('leaflet');
    var L = require(leafletPath);
    global.L = L;

    var scriptLength = leafletPath.split(path.sep).slice(-1)[0].length;
    L.Icon.Default.imagePath = 'file://' + leafletPath.substring(0, leafletPath.length - scriptLength) + 'images/';

    // Monkey patch Leaflet
    var originalInit = L.Map.prototype.initialize;
    L.Map.prototype.initialize = function (id, options) {
        options = L.extend(options || {}, {
            fadeAnimation: false,
            zoomAnimation: false,
            markerZoomAnimation: false,
            preferCanvas: true
        });

        return originalInit.call(this, id, options);
    }

    // jsdom does not have clientHeight/clientWidth on elements.
    // Adjust size with L.Map.setSize()
    L.Map.prototype.getSize = function () {
        if (!this._size || this._sizeChanged) {
            this._size = new L.Point(1024, 1024);
            this._sizeChanged = false;
        }
        return this._size.clone();
    };

    L.Map.prototype.setSize = function (width, height) {
        this._size = new L.Point(width, height);
        // reset pixelOrigin
        this._resetView(this.getCenter(), this.getZoom());
        return this;
    };

    L.Map.prototype.saveImage = function (outfilename, callback) {
        var leafletImage = require('leaflet-image');
        var fs = require('fs');

        leafletImage(this, function (err, canvas) {
            if (err) {
                console.error(err);
                return;
            }
            var data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, '');
            fs.writeFile(outfilename, new Buffer(data, 'base64'), function () {
                if (callback) {
                    callback(outfilename);
                }
            });
        });
    };
}

module.exports = global.L;
