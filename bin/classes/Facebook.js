/**
 * Main controller for Facebook JavaScript API
 *
 * @module package/quiqqer/authfacebook/bin/classes/Facebook
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/classes/Facebook.css
 *
 * @event onLoaded [this] - Fires if everything has loaded
 * @event onLogin [this, authResponse] - Fires if the user successfully authenticates with Facebook
 */
define('package/quiqqer/authfacebook/bin/classes/Facebook', [

    'qui/classes/DOM',
    'qui/controls/buttons/Button',

    'Ajax',
    'Locale'

], function (QDOM, QUIButton, QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QDOM,
        Type   : 'package/quiqqer/authfacebook/bin/classes/Facebook',

        Binds: [
            'getLoginButton'
        ],

        options: {},

        initialize: function (options) {
            var self = this;

            this.parent(options);
            this.$loginStatus = false;
            this.$loaded      = false;


        },

        /**
         * Get Login Button
         *
         * @return {Object} - qui/controls/buttons/Button
         */
        getLoginButton: function () {
            var self = this;

            var btnText = QUILocale.get(lg, 'classes.facebook.login.btn.text');

            if (self.$loginStatus) {
                btnText = QUILocale.get(lg, 'classes.facebook.login.btn.authorize.text');
            }

            var LoginBtn = new QUIButton({
                'class'  : 'quiqqer-auth-facebook-login-btn',
                disabled : true,
                textimage: 'fa fa-facebook',
                text     : btnText,
                events   : {
                    onClick: function () {
                        FB.login(function (response) {
                            self.$loginStatus = response.status;

                            if (response.authResponse) {
                                self.fireEvent('login', [self, response.authResponse]);
                            }
                        }, {
                            scope: 'public_profile,email'
                        });
                    }
                }
            });

            this.$load().then(function() {
                LoginBtn.enable();
            });

            return LoginBtn;
        },

        /**
         * Return current login status
         *
         * @return {Promise}
         */
        getStatus: function () {
            return this.$load().then(function () {
                return this.$loginStatus
            });
        },

        /**
         * Load Facebook JavaScript SDK
         *
         * @return {Promise}
         */
        $load: function () {
            if (this.$loaded) {
                return Promise.resolve();
            }

            var self = this;

            return new Promise(function (resolve, reject) {
                this.$getAppId().then(function (appId) {
                    // Initialize Facebook JavaScript SDK
                    window.fbAsyncInit = function () {
                        FB.init({
                            appId  : appId,
                            version: 'v2.8' // @todo put in config
                        });

                        FB.getLoginStatus(function (response) {
                            self.$loginStatus = response.status;
                            self.$loaded      = true;
                            self.fireEvent('loaded', [self]);
                            resolve();
                        });
                    };

                    (function (d, s, id) {
                        var js, fjs = d.getElementsByTagName(s)[0];

                        if (d.getElementById(id)) {
                            return;
                        }

                        js     = d.createElement(s);
                        js.id  = id;
                        js.src = "//connect.facebook.net/en_US/sdk.js";

                        fjs.parentNode.insertBefore(js, fjs);
                    }(document, 'script', 'facebook-jssdk'));
                });
            });
        },

        /**
         * Get App-ID for Facebook API requests
         *
         * @return {Promise}
         */
        $getAppId: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getAppId',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        onError  : reject
                    }
                )
            });
        }
    });
});