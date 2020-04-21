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

            var parentImportFunction = this.$constructor.parent.prototype.$onImport;

            if (!GDPR || (
                GDPR.isCookieCategoryAccepted('essential') &&
                GDPR.isCookieCategoryAccepted('preferences') &&
                GDPR.isCookieCategoryAccepted('statistics') &&
                GDPR.isCookieCategoryAccepted('marketing')
            )
            ) {
                return parentImportFunction.apply(this, arguments);
            }

            var LoginButton = this.$Elm.getParent().getElement('.quiqqer-auth-facebook-login-btn');

            LoginButton.addEvent('click', this.$onLoginButtonClick);

            LoginButton.disabled = false;

            GDPR.waitForCookieCategoriesAcceptance([
                'essential',
                'preferences',
                'statistics',
                'marketing'
            ]).then(function () {
                LoginButton.removeEventListener('click', self.$onLoginButtonClick);

                parentImportFunction.apply(self, arguments);
            });
        },

        $onLoginButtonClick: function (Event) {
            Event.stop();

            require(['package/quiqqer/authfacebook/bin/controls/GdprConfirm'], function (GdprConfirm) {
                var Confirm = new GdprConfirm();
                Confirm.open();
            });
        }
    });
});
