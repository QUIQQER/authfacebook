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

            this.$Elm = this.getElm();

            var RegistrarForm   = this.$Elm.getElement('.quiqqer-authfacebook-registrar-form'),
                RegistrarButton = this.$Elm.getElement('.quiqqer-auth-facebook-registration-btn');

            if (!RegistrarForm || !RegistrarButton) {
                return;
            }

            RegistrarForm.removeClass('quiqqer-authfacebook__hidden');

            var parentImportFunction = self.$constructor.parent.prototype.$onImport;

            if (!GDPR || GDPR.isCookieCategoryAccepted('statistics')) {
                return parentImportFunction.apply(self, arguments);
            }

            var oldButtonTitle = RegistrarButton.title;
            RegistrarButton.title = QUILocale.get(lg, 'controls.frontend.registrar.gdpr.button.title');

            RegistrarButton.addEventListener('click', self.$onRegistrarButtonClick);
            RegistrarButton.disabled = false;

            GDPR.waitForCookieCategoriesAcceptance([
                'essential',
                'preferences',
                'statistics',
                'marketing'
            ]).then(function () {
                RegistrarButton.title = oldButtonTitle;
                RegistrarButton.removeEventListener('click', self.$onRegistrarButtonClick);

                parentImportFunction.apply(self, arguments);
            });
        },

        $onRegistrarButtonClick: function () {
            require([
                'package/quiqqer/gdpr/bin/CookieManager',
                'qui/controls/windows/Confirm'
            ], function (CookieManager, ConfirmControl) {
                var Confirm = new ConfirmControl({
                    information: QUILocale.get(lg, 'controls.frontend.registrar.gdpr.popup.content'),
                    title      : false,
                    icon       : false,
                    texticon   : false
                });

                Confirm.addEvent('submit', function () {
                    CookieManager.revokeCookies(true);
                });

                Confirm.open();
            });
        }
    });
});
