'use strict';
/**
 * Start when dom ready
 */
jQuery(document).ready(function () {
    var getAppSetupParams = {};
    // populate url with possible control parameters
    Object.keys(window.controlParams || {}).forEach(function (key) {
        getAppSetupParams[key] = window.controlParams[key];
    });

    function gfiParamHandler (sandbox) {
        if (Oskari.util.getRequestParam('showGetFeatureInfo', false) !== 'true') {
            return;
        }
        // getPixelFromCoordinate should be part of mapmodule instead of doing ol3-specific code here
        // for some reason a timeout is required, but this is a hacky feature anyway
        // TODO: refactor to be more useful.GetFeatureInfoRequest shouldn't take both coordinates and pixels but one or the other
        // otherwise we should check if the pixels and coordinates do actually match
        setTimeout(function () {
            var lon = sandbox.getMap().getX();
            var lat = sandbox.getMap().getY();
            var mapModule = sandbox.findRegisteredModuleInstance('MainMapModule');
            var px = mapModule.getMap().getPixelFromCoordinate([lon, lat]);
            if (px) {
                sandbox.postRequestByName('MapModulePlugin.GetFeatureInfoRequest', [lon, lat, px[0], px[1]]);
            }
        }, 500);
    }

    jQuery.ajax({
        type: 'POST',
        dataType: 'json',
        data: getAppSetupParams,
        url: '/action?action_route=GetAppSetup',
        success: function (appSetup) {
            var app = Oskari.app;
            if (!appSetup.startupSequence) {
                jQuery('#mapdiv').append('Unable to start');
                return;
            }

            app.init(appSetup);
            app.startApplication(function () {
                var sb = Oskari.getSandbox();
                gfiParamHandler(sb);

                // pti 10
                var cookieName = 'pti10v';
                var shownCount = parseInt(jQuery.cookie(cookieName) || '0');
                if(shownCount < 7) {
                    shownCount++;
                    var msg = 'Vastaa Paikkatietoikkunan <a href="https://www.webropolsurveys.com/S/95DA4555779B4E91.par" target="_blank">10-vuotiskyselyyn</a>';
                    var lang = appSetup.env.lang || 'fi';
                    if (lang === 'sv') {
                        msg = 'Svara på geoportalens <a href="https://www.webropolsurveys.com/S/A198188659407312.par" target="_blank">10-årsanvändarenkät</a>';
                    } else if (lang === 'en') {
                        msg = 'Paikkatietoikkuna 10 years - <a href="https://www.webropolsurveys.com/S/8F095C742396905C.par" target="_blank">user survey</a>';
                    }

                    toastr.info(msg);
                    jQuery.cookie(cookieName, '' + shownCount, { expires: 22 });
                }
                // /pti 10v
            });
        },
        error: function (jqXHR, textStatus) {
            if (jqXHR.status !== 0) {
                jQuery('#mapdiv').append('Unable to start');
            }
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
                // Service worker is resource in servlet-map
                navigator.serviceWorker.register('/xhr-prioritizer.js').then(function (registration) {
                console.debug('ServiceWorker registration successful with scope: ', registration.scope);
            }, function (err) {
                console.debug(err.message);
            });
        });
    }
});
