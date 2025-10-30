/**
 * QUIQQER account registration via Facebook Account
 *
 * @module package/quiqqer/authfacebook/bin/frontend/controls/Registrar
 */
define('package/quiqqer/authfacebook/bin/frontend/controls/Registrar', [

    'qui/controls/Control',
    'package/quiqqer/authfacebook/bin/Facebook',

    'css!package/quiqqer/authfacebook/bin/frontend/controls/Registrar.css'

], function (QUIControl, Facebook) {
    'use strict';

    const lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/authfacebook/bin/frontend/controls/Registrar',

        Binds: [
            '$onImport',
            '$init',
            '$showRegistrarBtn',
            '$getRegistrarUserId',
            '$showInfo',
            '$clearInfo',
            '$showGeneralError',
            '$register',
            '$getGDPRConsent',
            '$openFacebookLoginHelper'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.$Form = null;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            this.$Elm = this.getElm();

            const RegistrarForm = this.$Elm.getElement('.quiqqer-facebook-registrar-form');

            if (!RegistrarForm) {
                return;
            }

            RegistrarForm.removeClass('quiqqer-facebook__hidden');

            this.$Form = this.$Elm.getParent('form');
            this.$ButtonContainer = this.$Elm.getElement('.quiqqer-facebook-registrar-btn');

            this.$Form.addEvent('submit', function (event) {
                event.stop();
            });

            Facebook.getButton().inject(this.$ButtonContainer);
        }
    });
});