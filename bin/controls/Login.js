/**
 * Facebook Authentication for QUIQQER
 *
 * @module package/quiqqer/authfacebook/bin/controls/Login
 */
define('package/quiqqer/authfacebook/bin/controls/Login', [

    'qui/controls/Control',
    'package/quiqqer/authfacebook/bin/Facebook',

    'css!package/quiqqer/authfacebook/bin/controls/Login.css'

], function (QUIControl, Facebook) {
    'use strict';

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/authfacebook/bin/controls/Login',

        Binds: [
            '$onImport',
            'create'
        ],

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-login'
            });

            Facebook.getButton().inject(this.$Elm);

            return this.$Elm;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            let container = this.$Elm;

            if (container.nodeName === 'INPUT') {
                container = container.getParent('.quiqqer-auth-facebook-login');
            }

            const button = container.querySelector('button');
            const fbButton = Facebook.getButton();
            const node = fbButton.create();

            if (button) {
                button.replaceWith(node);
            } else {
                fbButton.inject(container);
            }
        }
    });
});