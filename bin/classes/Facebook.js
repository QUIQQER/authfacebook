/**
 * Main controller for Facebook JavaScript API
 *
 * @module package/quiqqer/authfacebook/bin/classes/Facebook
 * @author www.pcsg.de (Patrick Müller)
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
            this.$loggedIn = false;
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
            }, function () {
                // nothing
            });

            return LoginBtn;
        },

        /**
         * Get Registration Button
         *
         * @return {Promise}
         */
        getRegistrationButton: function () {
            var self = this;

            var RegistrationBtn = new QUIButton({
                'class'  : 'quiqqer-auth-facebook-registration-btn',
                textimage: 'fa fa-facebook',
                text     : QUILocale.get(lg, 'controls.frontend.registrar.registration_button'),
                events   : {
                    onClick: function (Btn) {
                        Btn.disable();

                        self.login().then(function () {
                            Btn.enable();
                        }, function () {
                            Btn.enable();
                        });
                    }
                }
            });

            return new Promise(function (resolve, reject) {
                this.$load().then(function () {
                    resolve(RegistrationBtn);
                }, reject);
            }.bind(this));
        },

        /**
         * Facebook login (opens FB popup and prompts for credentials)
         *
         * Must be triggered by user click
         *
         * @return {Promise}
         */
        login: function () {
            if (this.$loggedIn) {
                return Promise.resolve();
            }

            var self = this;

            return new Promise(function (resolve, reject) {
                FB.login(function (response) {
                    if (typeof response.authResponse === 'undefined'
                        || !response.authResponse) {
                        reject('Facebook Login failed.');

                        return;
                    }

                    self.$AuthData = response.authResponse;
                    self.$token    = self.$AuthData.accessToken;

                    self.fireEvent('login', [self.$AuthData, self]);

                    self.$loggedIn = true;
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
            if (!this.$loggedIn) {
                return Promise.resolve();
            }
            
            var self = this;

            return new Promise(function (resolve, reject) {
                try {
                    FB.logout(function () {
                        self.$AuthData = null;
                        self.$token    = null;

                        self.fireEvent('logout', [self]);
                        self.$loggedIn = false;

                        resolve();
                    }, {
                        accessToken: self.$token
                    });
                } catch(e) {
                    reject('Facebook logout failed.');
                }
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
        getToken: function () {
            var self = this;

            return new Promise(function(resolve, reject) {
                self.$load().then(self.login, reject).then(function () {
                    resolve(self.$token);
                }, reject);
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
            var self = this;

            return new Promise(function (resolve, reject) {
                self.$load().then(function() {
                    try {
                        FB.api(
                            '/me', {
                                fields: 'first_name,last_name,email'
                            }, function (response) {
                                resolve(response);
                            }
                        );
                    } catch (e) {
                        reject();
                    }
                }, reject);
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
                self.$getApiCredentials().then(function (Credentials) {
                    if (!Credentials.appId) {
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
                                appId  : Credentials.appId,
                                status : true,
                                version: Credentials.apiVersion
                            });
                        } catch (Exception) {
                            reject('Facebook API initialization failed.');
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
        $getApiCredentials: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getApiCredentials',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        onError  : reject
                    }
                )
            });
        }
    });
});