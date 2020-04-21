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

            // The $onImport function of the parent class
            var parentImportFunction = self.$constructor.parent.prototype.$onImport;

            // If GDPR isn't available or cookies are already accepted there is noting to do here
            if (typeof GDPR === 'undefined' || (
                GDPR.isCookieCategoryAccepted('essential') &&
                GDPR.isCookieCategoryAccepted('preferences') &&
                GDPR.isCookieCategoryAccepted('statistics') &&
                GDPR.isCookieCategoryAccepted('marketing')
            )
            ) {
                // Call the parent $inImport function to initialize Facebook login
                return parentImportFunction.apply(self, arguments);
            }

            var Elm = this.getElm();

            var RegistrarForm   = Elm.getElement('.quiqqer-authfacebook-registrar-form'),
                RegistrarButton = Elm.getElement('.quiqqer-auth-facebook-registration-btn');

            // If the form or button aren't available, we can't do anything here
            if (!RegistrarForm || !RegistrarButton) {
                return;
            }

            // Make the register form visible
            RegistrarForm.removeClass('quiqqer-authfacebook__hidden');

            // Add a click listener to display the GDPR-confirm-popup
            RegistrarButton.addEventListener('click', self.$onRegistrarButtonClick);

            // Make the register button clickable
            RegistrarButton.disabled = false;

            // When the required cookies get accepted...
            GDPR.waitForCookieCategoriesAcceptance([
                'essential',
                'preferences',
                'statistics',
                'marketing'
            ]).then(function () {
                // ...remove the click listener
                RegistrarButton.removeEventListener('click', self.$onRegistrarButtonClick);

                // ...call the parent $inImport function to initialize Facebook registration
                parentImportFunction.apply(self, arguments);
            });
        },

        $onRegistrarButtonClick: function () {
            // Display the GDPR info popup
            require(['package/quiqqer/authfacebook/bin/controls/GdprConfirm'], function (GdprConfirm) {
                var Confirm = new GdprConfirm();
                Confirm.open();
            });
        }
    });
});
