import React from 'react';
import ReactDOM from 'react-dom';
import { Message } from 'oskari-ui';
import { Link } from './Link';

const LINKS = {
    fi: 'https://www.maanmittauslaitos.fi/asioi-verkossa/palveluiden-kayttoohjeet/paikkatietoikkuna/mobiili',
    sv: 'https://www.maanmittauslaitos.fi/sv/e-tjanster/bruksanvisningar-av-e-tjanster/paikkatietoikkuna/mobil',
    en: 'https://www.maanmittauslaitos.fi/en/e-services/instructions-use-our-services/paikkatietoikkuna/mobile'
};
/**
 * @class Oskari.mapframework.bundle.mobileuserguide.UserGuideBundleInstance
 *
 * Link to user guide for mobile users
 */
Oskari.clazz.define('Oskari.pti.mobileuserguide.UserGuideBundleInstance',
    function () {
    },
    {
        /**
         * @method getName
         * @return {String} the name for the component
         */
        getName: function () {
            return 'mobileuserguide';
        },

        _startImpl: function () {
            const nav = Oskari.dom.getNavigationEl();
            if (!nav) {
                return;
            }
            const linksContainer = nav.querySelector('.linksContainer');
            if (linksContainer) {
                const container = document.createElement('div');
                linksContainer.append(container);
                this.addLink(container);
            }
        },

        getHref: function () {
            return LINKS[Oskari.getLang()] || LINKS.fi;
        },

        addLink: function (root) {
            ReactDOM.render(<div>
                <Link href={ this.getHref() }><Message bundleKey={ this.getName() } messageKey='title' /></Link>
            </div>, root);
        }
    },
    {
        extend: ['Oskari.BasicBundle']
    });
