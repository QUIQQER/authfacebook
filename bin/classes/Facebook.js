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

    'qui/QUI',
    'qui/classes/DOM',
    'qui/controls/buttons/Button',
    'qui/controls/windows/Confirm',

    'Ajax',
    'Locale',
    'Mustache',

    'text!package/quiqqer/authfacebook/bin/classes/GDPRConsent.html',
    'css!package/quiqqer/authfacebook/bin/classes/Facebook.css'

], function (QUI, QDOM, QUIButton, QUIConfirm, QUIAjax, QUILocale, Mustache, templateGDPRConsent) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QDOM,
        Type   : 'package/quiqqer/authfacebook/bin/classes/Facebook',

        Binds: [
            'login',
            'logout',
            'isLoggedIn'
        ],

        options: {},

        initialize: function (options) {
            this.parent(options);

            this.$AuthData      = false;
            this.$token         = false;    // FB access token
            this.$loaded        = false;
            this.$loggedIn      = false;
            this.$scriptLoaded  = false;
            this.$fbInitialized = false;
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
                        }, function () {
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
                //this.fireEvent('login', [this.$AuthData, this]);
                return Promise.resolve();
            }

            var self = this;

            return new Promise(function (resolve, reject) {
                FB.login(function (response) {
                    if (typeof response.authResponse === 'undefined' || !response.authResponse) {
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
         * Check if user is logged in at FB
         *
         * @return {Promise}
         */
        isLoggedIn: function() {
            return this.$loggedIn;
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
                } catch (e) {
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
                return self.$AuthData;
            });
        },

        /**
         * Get Facebook access token of currently connected Facebook account
         *
         * @return {Promise}
         */
        getToken: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
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
            var self = this;

            return new Promise(function (resolve, reject) {
                self.$load().then(function () {
                    FB.getLoginStatus(function (response) {
                        resolve(response.status);
                    });
                }, reject);
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
                self.$load().then(function () {
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
                );
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
                );
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
         * Opens popup with GDPR-compliant confirmation for a Facebook connection
         *
         * This is only needed if the user first has to "agree" to the connection
         * to Facebook by clicking the original Registration button
         *
         * @return {Promise}
         */
        getGDPRConsent: function () {
            if (typeof localStorage !== 'undefined' && localStorage.getItem('quiqqer_auth_facebook_autoconnect')) {
                return Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                new QUIConfirm({
                    'class'  : 'quiqqer-auth-facebook-registration-popup',
                    icon     : 'fa fa-facebook-official',
                    title    : QUILocale.get(lg, 'gdpr_consent.popup.title'),
                    maxHeight: 350,
                    maxWidth : 600,
                    buttons  : false,
                    events   : {
                        onOpen  : function (Popup) {
                            var Content = Popup.getContent();

                            Content.set('html', Mustache.render(templateGDPRConsent, {
                                connectInfo: QUILocale.get(lg, 'gdpr_consent.popup.info')
                            }));

                            new QUIButton({
                                text  : QUILocale.get(lg, 'gdpr_consent.popup.btn.text'),
                                events: {
                                    onClick: function () {
                                        localStorage.setItem('quiqqer_auth_facebook_autoconnect', true);

                                        resolve(true);
                                        Popup.close();
                                    }
                                }
                            }).inject(
                                Content.getElement('.quiqqer-auth-facebook-consent-btn')
                            );
                        },
                        onCancel: function() {
                            resolve(false);
                        }
                    }
                }).open();
            });
        },

        /**
         * Get Facebook login status
         *
         * @return {Promise}
         */
        $getLoginStatus: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                FB.getLoginStatus(function (response) {
                    self.$loaded = true;

                    if (response.authResponse) {
                        self.$AuthData = response.authResponse;
                        self.$token    = self.$AuthData.accessToken;
                    }

                    self.$loggedIn = response.status === 'connected';
                    self.fireEvent('loaded', [self]);
                    resolve();
                });
            });
        },

        /**
         * Load Facebook JavaScript SDK
         *
         * @return {Promise}
         */
        $load: function () {
            if (this.$fbInitialized) {
                return Promise.resolve();
                //return this.$getLoginStatus();
            }

            var self = this;

            return new Promise(function (resolve, reject) {
                self.$getApiCredentials().then(function (Credentials) {
                    if (!Credentials.appId) {
                        QUI.getMessageHandler().then(function (MH) {
                            MH.addAttention(
                                QUILocale.get(lg, 'classes.facebook.warn.no.appId')
                            );
                        });

                        reject('Facebook API missing credentials.');
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

                            FB.getLoginStatus(function () {
                                self.$fbInitialized = true;
                                resolve();
                            });
                        } catch (Exception) {
                            reject('Facebook API initialization failed.');
                        }
                    };

                    if (!self.$scriptLoaded) {
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

                        self.$scriptLoaded = true;
                    }

                    // wait for load
                    var waitTime  = 0;
                    var loadTimer = setInterval(function () {
                        waitTime += 200;

                        if (self.$fbInitialized) {
                            clearInterval(loadTimer);
                            resolve();
                            return;
                        }

                        if (waitTime >= 5000) {
                            clearInterval(loadTimer);
                            reject('Facebook API initialization failed.');
                        }
                    }, 200);
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
                );
            });
        }
    });
});