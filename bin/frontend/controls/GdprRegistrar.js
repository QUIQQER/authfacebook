/**
 * GDPR compliant QUIQQER account registration via Facebook Account
 *
 * @module package/quiqqer/authfacebook/bin/frontend/controls/GdprRegistrar
 * @author www.pcsg.de (Jan Wennrich)
 */
define('package/quiqqer/authfacebook/bin/frontend/controls/GdprRegistrar', [

    'package/quiqqer/authfacebook/bin/frontend/controls/Registrar',

    'Locale'

], function (AuthFacebookRegistrar, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: AuthFacebookRegistrar,
        Type   : 'package/quiqqer/authfacebook/bin/frontend/controls/GdprRegistrar',

        Binds: [
            '$onImport'
        ],

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            var self = this;

            var parentImportFunction = self.$constructor.parent.prototype.$onImport;

            if (!GDPR || (
                GDPR.isCookieCategoryAccepted('essential') &&
                GDPR.isCookieCategoryAccepted('preferences') &&
                GDPR.isCookieCategoryAccepted('statistics') &&
                GDPR.isCookieCategoryAccepted('marketing')
            )
            ) {
                return parentImportFunction.apply(self, arguments);
            }

            var Elm = this.getElm();

            var RegistrarForm   = Elm.getElement('.quiqqer-authfacebook-registrar-form'),
                RegistrarButton = Elm.getElement('.quiqqer-auth-facebook-registration-btn');

            if (!RegistrarForm || !RegistrarButton) {
                return;
            }

            RegistrarForm.removeClass('quiqqer-authfacebook__hidden');

            RegistrarButton.addEventListener('click', self.$onRegistrarButtonClick);
            RegistrarButton.disabled = false;

            GDPR.waitForCookieCategoriesAcceptance([
                'essential',
                'preferences',
                'statistics',
                'marketing'
            ]).then(function () {
                RegistrarButton.removeEventListener('click', self.$onRegistrarButtonClick);

                parentImportFunction.apply(self, arguments);
            });
        },

        $onRegistrarButtonClick: function () {
            require(['package/quiqqer/authfacebook/bin/controls/GdprConfirm'], function (GdprConfirm) {
                var Confirm = new GdprConfirm();
                Confirm.open();
            });
        }
    });
});
