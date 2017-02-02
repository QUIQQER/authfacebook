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
    'Locale',

    'css!package/quiqqer/authfacebook/bin/classes/Facebook.css'

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
            this.$authData    = false;
            this.$loaded      = false;
        },

        /**
         * Get Login Button
         *
         * @return {Object} - qui/controls/buttons/Button
         */
        getLoginButton: function () {
            var self = this;

            var LoginBtn = new QUIButton({
                'class'  : 'quiqqer-auth-facebook-login-btn',
                disabled : true,
                textimage: 'fa fa-facebook-official',
                text     : QUILocale.get(lg, 'classes.facebook.login.btn.text'),
                events   : {
                    onClick: function () {
                        FB.login(function (response) {
                            self.$authData = response.authResponse;

                            if (response.authResponse) {
                                self.fireEvent('login', [self, response.authResponse]);
                            }
                        }, {
                            scope: 'public_profile,email'
                        });
                    }
                }
            });

            this.$load().then(function () {
                self.getStatus().then(function (status) {
                    if (status == 'not_authorized') {
                        LoginBtn.setAttribute(
                            'text',
                            QUILocale.get(lg, 'classes.facebook.login.btn.authorize.text')
                        );
                    }

                    LoginBtn.enable();
                });
            });

            return LoginBtn;
        },

        /**
         * Get Logout Button
         *
         * @return {Object} - qui/controls/buttons/Button
         */
        getLogoutButton: function () {
            var self = this;

            var LogoutBtn = new QUIButton({
                'class'  : 'quiqqer-auth-facebook-login-btn',
                disabled : true,
                textimage: 'fa fa-sign-out',
                text     : QUILocale.get(lg, 'classes.facebook.logout.btn.text'),
                events   : {
                    onClick: function () {
                        console.log(self.$authData);

                        //FB.logout(function (response) {
                        //    self.$loginStatus = 'unknown';
                        //    self.$authData    = false;
                        //
                        //    self.fireEvent('logout', [self]);
                        //}, {
                        //
                        //});
                    }
                }
            });

            this.$load().then(function () {
                LogoutBtn.enable();
            });

            return LogoutBtn;
        },

        /**
         * Get auth data of currently connected Facebook account
         *
         * @return {Promise}
         */
        getAuthData: function () {
            var self = this;

            return this.$load().then(function () {
                return self.$authData
            });
        },

        /**
         * Return current login status
         *
         * @return {Promise}
         */
        getStatus: function () {
            return this.$load().then(function () {
                return new Promise(function (resolve, reject) {
                    FB.getLoginStatus(function (response) {
                        resolve(response.status);
                    });
                });
            });
        },

        /**
         * Get info of Facebook profile
         *
         * @return {Promise}
         */
        getProfileInfo: function () {
            return this.$load().then(function () {
                return new Promise(function (resolve, reject) {
                    FB.api(
                        '/me', {
                            fields: 'first_name,last_name,email'
                        }, function (response) {
                            resolve(response);
                        }
                    );
                });
            });
        },

        /**
         * Connect a facebook account with a quiqqer account
         *
         * @param {number} userId - QUIQQER User ID
         * @param {string} fbToken - FB Api access token
         * @param {Object} FbAccountData - Account data
         */
        connectQuiqqerAccount: function (userId, fbToken, FbAccountData) {
            return new Promise(function (resolve, reject) {
                QUIAjax.post(
                    'package_quiqqer_authfacebook_ajax_connectAccount',
                    resolve, {
                        'package'    : 'quiqqer/authfacebook',
                        userId       : userId,
                        fbToken      : fbToken,
                        fbAccountData: JSON.encode(FbAccountData),
                        onError      : reject
                    }
                )
            });
        },

        /**
         * Get details of connected Facebook account based on QUIQQER User ID
         *
         * @param {number} userId - QUIQQER User ID
         * @return {Promise}
         */
        getAccountByQuiqqerUserId: function (userId) {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getAccountByQuiqqerUserId',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        userId   : userId,
                        onError  : reject
                    }
                );
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
                self.$getAppId().then(function (appId) {
                    if (!appId) {
                        QUI.getMessageHandler().then(function (MH) {
                            MH.addAttention(
                                QUILocale.get(lg, 'classes.facebook.warn.no.appId')
                            )
                        });

                        return;
                    }

                    // Initialize Facebook JavaScript SDK
                    window.fbAsyncInit = function () {
                        try {
                            FB.init({
                                appId  : appId,
                                status : true,
                                version: 'v2.8' // @todo put in config
                            });
                        } catch (Exception) {
                            console.log(Exception);
                        }

                        FB.getLoginStatus(function (response) {
                            self.$loaded = true;

                            if (response.authResponse) {
                                self.$authData = response.authResponse;
                            }

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