/**
 * GDPR Facebook Authentication for QUIQQER
 *
 * @module package/quiqqer/authfacebook/bin/controls/GdprLogin
 * @author www.pcsg.de (Jan Wennrich)
 */
define('package/quiqqer/authfacebook/bin/controls/GdprLogin', [

    'package/quiqqer/authfacebook/bin/controls/Login'

], function (FacebookLogin) {
    "use strict";

    return new Class({

        Extends: FacebookLogin,
        Type   : 'package/quiqqer/authfacebook/bin/controls/GdprLogin',

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
            var parentImportFunction = this.$constructor.parent.prototype.$onImport;

            // If GDPR isn't available or cookies are already accepted there is noting to do here
            if (typeof GDPR === 'undefined' || (
                GDPR.isCookieCategoryAccepted('essential') &&
                GDPR.isCookieCategoryAccepted('preferences') &&
                GDPR.isCookieCategoryAccepted('statistics') &&
                GDPR.isCookieCategoryAccepted('marketing')
            )
            ) {
                // Call the parent $inImport function to initialize Facebook login
                return parentImportFunction.apply(this, arguments);
            }

            var LoginButton = this.$Elm.getParent().getElement('.quiqqer-auth-facebook-login-btn');

            // Add a click listener to display the GDPR-confirm-popup
            LoginButton.addEvent('click', this.$onLoginButtonClick);

            // Make the login button clickable
            LoginButton.disabled = false;

            // When the required cookies get accepted...
            GDPR.waitForCookieCategoriesAcceptance([
                'essential',
                'preferences',
                'statistics',
                'marketing'
            ]).then(function () {
                // ...remove the click listener
                LoginButton.removeEventListener('click', self.$onLoginButtonClick);

                // ...call the parent $inImport function to initialize Facebook login
                parentImportFunction.apply(self, arguments);
            });
        },

        $onLoginButtonClick: function (Event) {
            // Stop the event to prevent the login-form from being submitted
            Event.stop();

            // Display the GDPR info popup
            require(['package/quiqqer/authfacebook/bin/controls/GdprConfirm'], function (GdprConfirm) {
                var Confirm = new GdprConfirm();
                Confirm.open();
            });
        }
    });
});
