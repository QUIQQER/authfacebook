/**
 * Main controller for Facebook JavaScript API
 *
 * @module package/quiqqer/authfacebook/bin/classes/Facebook
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/classes/DOM
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/classes/Facebook.css
 *
 * @event onLoaded [this] - Fires if everything has loaded
 * @event onLogin [authResponse, this] - Fires if the user successfully authenticates with Facebook
 * @event onLogout [this] - Fires if the user clicks the Logout button
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
            'login',
            'logout'
        ],

        options: {},

        initialize: function (options) {
            this.parent(options);

            this.$AuthData = false;
            this.$token    = false;    // FB access token
            this.$loaded   = false;
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
                    onClick: function (Btn) {
                        Btn.disable();

                        self.login().then(function () {
                            Btn.enable();
                        });
                    }
                }
            });

            this.$load().then(function () {
                LoginBtn.enable();
            }, function() {
                // nothing
            });

            return LoginBtn;
        },

        /**
         * Facebook login (opens FB popup and prompts for credentials)
         *
         * Must be triggered by user click
         *
         * @return {Promise}
         */
        login: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                FB.login(function (response) {
                    self.$AuthData = response.authResponse;
                    self.$token    = self.$AuthData.accessToken;

                    if (response.authResponse) {
                        self.fireEvent('login', [response.authResponse, self]);
                    }

                    resolve();
                }, {
                    scope: 'public_profile,email'
                });
            });
        },

        /**
         * Get Logout Button
         *
         * @param {bool} [rerequest] - Re-request facebook permissions
         * @return {Object} - qui/controls/buttons/Button
         */
        getAuthButton: function (rerequest) {
            var self = this;

            var AuthBtn = new QUIButton({
                'class'  : 'quiqqer-auth-facebook-login-btn',
                disabled : true,
                textimage: 'fa fa-facebook-official',
                text     : QUILocale.get(lg, 'classes.facebook.login.btn.authorize.text'),
                events   : {
                    onClick: function (Btn) {
                        Btn.disable();

                        self.auth().then(function () {
                            Btn.enable();
                        });
                    }
                }
            });

            this.$load().then(function () {
                AuthBtn.enable();
            });

            return AuthBtn;
        },

        /**
         * Start authentication process for authenticating QUIQQER with FB account
         *
         * Must be triggered by user click
         *
         * @param {bool} [rerequest] - set to true if the user should be forced
         * to confirm Facebook permissions (again)
         * @return {Promise}
         */
        auth: function (rerequest) {
            var self = this;

            return new Promise(function (resolve, reject) {
                var Options = {
                    scope: 'public_profile,email'
                };

                if (rerequest) {
                    Options.auth_type = 'rerequest';
                }

                FB.login(function (response) {
                    self.$AuthData = response.authResponse;
                    self.$token    = self.$AuthData.accessToken;

                    if (response.authResponse) {
                        self.fireEvent('login', [response.authResponse, self]);
                    }

                    resolve();
                }, Options);
            });
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
                    onClick: function (Btn) {
                        Btn.disable();

                        self.logout().then(function () {
                            Btn.enable();
                        });
                    }
                }
            });

            this.$load().then(function () {
                LogoutBtn.enable();
            });

            return LogoutBtn;
        },

        /**
         * Facebook Logout
         *
         * Must be triggered by user click and needs Facebook profile permissions
         *
         * @return {Promise}
         */
        logout: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                FB.logout(function (response) {
                    self.$AuthData = null;
                    self.$token    = null;

                    self.fireEvent('logout', [self]);
                    resolve();
                }, {
                    accessToken: self.$token
                });
            });
        },

        /**
         * Get auth data of currently connected Facebook account
         *
         * @return {Promise}
         */
        getAuthData: function () {
            var self = this;

            return this.$load().then(function () {
                return self.$AuthData
            });
        },

        /**
         * Get Facebook access token of currently connected Facebook account
         *
         * @return {Promise}
         */
        getToken: function() {
            var self = this;

            return this.$load().then(function () {
                return self.$token
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
         * @return {Promise}
         */
        connectQuiqqerAccount: function (userId, fbToken) {
            return new Promise(function (resolve, reject) {
                QUIAjax.post(
                    'package_quiqqer_authfacebook_ajax_connectAccount',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        userId   : userId,
                        fbToken  : fbToken,
                        onError  : reject
                    }
                )
            });
        },

        /**
         * Connect a facebook account with a quiqqer account
         *
         * @param {number} userId - QUIQQER User ID
         * @return {Promise}
         */
        disconnectQuiqqerAccount: function (userId) {
            return new Promise(function (resolve, reject) {
                QUIAjax.post(
                    'package_quiqqer_authfacebook_ajax_disconnectAccount',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        userId   : userId,
                        onError  : reject
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
         * Check if Facebook account is connected to a QUIQQER account
         *
         * @param {string} fbToken - Facebook API token
         * @return {Promise}
         */
        isAccountConnectedToQuiqqer: function (fbToken) {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_isFacebookAccountConnected',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        fbToken  : fbToken,
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
                                self.$AuthData = response.authResponse;
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