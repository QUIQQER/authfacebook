/**
 * Main controller for Facebook JavaScript API
 *
 * @module package/quiqqer/authfacebook/bin/classes/Facebook
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
    'package/quiqqer/frontend-users/bin/Registration',
    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/classes/Facebook.css'

], function (QUI, QDOM, QUIButton, QUIConfirm, registration, QUIAjax, QUILocale) {
    'use strict';

    const lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QDOM,
        Type: 'package/quiqqer/authfacebook/bin/classes/Facebook',

        Binds: [
            'login',
            'logout',
            'isLoggedIn'
        ],

        options: {},

        initialize: function (options) {
            this.parent(options);

            this.$token = false;    // FB access token
            this.$authData = false;    // FB access token
            this.$fbInitialized = false;
        },

        getButton: function () {
            return new QUIButton({
                'class': 'quiqqer-auth-facebook-registration-btn quiqqer-frontend-social-button',
                textimage: 'fa fa-facebook',
                text: QUILocale.get(lg, 'classes.facebook.login.btn.text'),
                events: {
                    onClick: (Btn) => {
                        Btn.disable();
                        Btn.setAttribute('textimage', 'fa fa-spinner fa-spin');

                        // set token to form
                        const form = Btn.getElm().getParent('form');

                        // start process
                        this.authenticate().then(() => {
                            if (form) {
                                let token = form.querySelector('input[name="token"]');

                                if (token) {
                                    token.parentNode.removeChild(token);
                                }

                                token = document.createElement('input');
                                token.type = 'hidden';
                                token.name = 'token';
                                token.value = this.$token;
                                form.appendChild(token);
                            }

                            return this.isAccountConnectedToQuiqqer(this.$token);
                        }).then((isConnected) => {
                            let Registration = null;
                            let Login = null;

                            const registrationNode = Btn.getElm().getParent('[data-qui="package/quiqqer/frontend-users/bin/frontend/controls/Registration"]');

                            if (registrationNode) {
                                Registration = QUI.Controls.getById(registrationNode.get('data-quiid'));
                            }

                            const loginNode = Btn.getElm().getParent('[data-qui="controls/users/Login"]');

                            if (loginNode) {
                                Login = QUI.Controls.getById(loginNode.get('data-quiid'));
                            }

                            // test if user already exists
                            // and we are in a login process
                            if (isConnected && Login) {
                                form.setAttribute('data-authenticator', 'QUI\\Auth\\Facebook\\Auth');
                                return Login.auth(form);
                            }

                            // if not: registration
                            if (Registration) {
                                return Registration.$sendForm(form);
                            }

                            return registration.register(
                                'QUI\\Registration\\Facebook\\Registrar',
                                {token: this.$token}
                            );
                        }).then(() => {
                            Btn.enable();
                            Btn.setAttribute('textimage', 'fa fa-facebook');
                        }).catch((exception) => {
                            console.error(exception);

                            Btn.enable();
                            Btn.setAttribute('textimage', 'fa fa-facebook');
                        });
                    }
                }
            });
        },

        authenticate: function () {
            return this.loadFacebookScript().then(async () => {
                // no need to authenticate
                // no double authentication
                if (this.$token) {
                    return;
                }

                return new Promise((resolve, reject) => {
                    FB.login((response) => {
                        if (typeof response.authResponse === 'undefined' || !response.authResponse) {
                            reject('Facebook Login failed.');
                            return;
                        }

                        this.$authData = response.authResponse;
                        this.$token = this.$authData.accessToken;
                        resolve();
                    }, {
                        scope: 'public_profile,email'
                    });
                });
            });
        },

        /**
         * Load Facebook JavaScript SDK
         *
         * @return {Promise}
         */
        loadFacebookScript: function () {
            if (this.$fbInitialized) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                // If FB SDK is already initialized by another script/app on the page,
                // do not re-initialize to avoid overriding global settings or tokens.
                if (window.FB && FB._initialized) {
                    this.$fbInitialized = true;
                    resolve();
                    return;
                }

                this.getApiCredentials().then((credentials) => {
                    if (!credentials.appId) {
                        console.error(QUILocale.get(lg, 'classes.facebook.warn.no.appId'));
                        reject('Facebook API missing credentials.');
                        return;
                    }

                    // Initialize Facebook JavaScript SDK
                    if (typeof window.fbAsyncInit !== 'function') {
                        window.fbAsyncInit = () => {
                            try {
                                FB.init({
                                    appId: credentials.appId,
                                    //status: true,
                                    cookie: true,
                                    xfbml: true,
                                    version: credentials.apiVersion
                                });

                                FB.getLoginStatus(() => {
                                    this.$fbInitialized = true;
                                    resolve();
                                });
                            } catch (Exception) {
                                reject('Facebook API initialization failed.');
                            }
                        };
                    }

                    if (!this.$scriptLoaded) {
                        const firstScriptTag = document.getElementsByTagName('script')[0];

                        if (!document.getElementById('facebook-jssdk')) {
                            const facebookScript = document.createElement('script');
                            facebookScript.id = 'facebook-jssdk';
                            facebookScript.src = '//connect.facebook.net/en_US/sdk.js';
                            firstScriptTag.parentNode.insertBefore(facebookScript, firstScriptTag);
                        }

                        this.$scriptLoaded = true;
                    }

                    // wait for load
                    let waitTime = 0;
                    const loadTimer = setInterval(() => {
                        waitTime += 200;

                        if (this.$fbInitialized) {
                            clearInterval(loadTimer);
                            this.$fbInitialized = true;
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
        getApiCredentials: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.get('package_quiqqer_authfacebook_ajax_getApiCredentials', resolve, {
                    'package': 'quiqqer/authfacebook',
                    onError: reject
                });
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
                QUIAjax.get('package_quiqqer_authfacebook_ajax_isFacebookAccountConnected', resolve, {
                    'package': 'quiqqer/authfacebook',
                    fbToken: fbToken,
                    onError: reject
                });
            });
        },

        // [region] OLD


        /**
         * Get Login Button
         *
         * @return {Object} - qui/controls/buttons/Button

        getLoginButton: function () {
            const LoginBtn = new QUIButton({
                'class': 'quiqqer-auth-facebook-login-btn quiqqer-frontend-social-button',
                disabled: true,
                textimage: 'fa fa-facebook-official',
                text: QUILocale.get(lg, 'classes.facebook.login.btn.text'),
                events: {
                    onClick: (Btn) => {
                        Btn.disable();

                        this.login().then(function () {
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

        getRegistrationButton: function () {
            const RegistrationBtn = new QUIButton({
                'class': 'quiqqer-auth-facebook-registration-btn',
                textimage: 'fa fa-facebook',
                text: QUILocale.get(lg, 'controls.frontend.registrar.registration_button'),
                events: {
                    onClick: (Btn) => {
                        Btn.disable();

                        this.login().then(function () {
                            Btn.enable();
                        }, function () {
                            Btn.enable();
                        });
                    }
                }
            });

            this.$load().then(() => {
                return RegistrationBtn;
            });
        },

        /**
         * Facebook login (opens FB popup and prompts for credentials)
         *
         * Must be triggered by user click
         *
         * @return {Promise}

        login: function () {
            if (this.$loggedIn) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                FB.login((response) => {
                    if (typeof response.authResponse === 'undefined' || !response.authResponse) {
                        reject('Facebook Login failed.');

                        return;
                    }

                    this.$AuthData = response.authResponse;
                    this.$token = this.$AuthData.accessToken;

                    this.fireEvent('login', [this.$AuthData, this]);
                    this.$loggedIn = true;
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

        isLoggedIn: function () {
            return this.$loggedIn;
        },

        /**
         * Get Logout Button
         *
         * @param {bool} [rerequest] - Re-request facebook permissions
         * @return {Object} - qui/controls/buttons/Button

        getAuthButton: function (rerequest) {
            const AuthBtn = new QUIButton({
                'class': 'quiqqer-auth-facebook-login-btn quiqqer-frontend-social-button',
                disabled: true,
                textimage: 'fa fa-facebook-official',
                text: QUILocale.get(lg, 'classes.facebook.login.btn.authorize.text'),
                events: {
                    onClick: (Btn) => {
                        Btn.disable();

                        this.auth().then(function () {
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

        auth: function (rerequest) {
            return new Promise((resolve) => {
                const Options = {
                    scope: 'public_profile,email'
                };

                if (rerequest) {
                    Options.auth_type = 'rerequest';
                }

                FB.login((response) => {
                    this.$AuthData = response.authResponse;
                    this.$token = this.$AuthData.accessToken;

                    if (response.authResponse) {
                        this.fireEvent('login', [response.authResponse, this]);
                    }

                    resolve();
                }, Options);
            });
        },

        /**
         * Get Logout Button
         *
         * @return {Object} - qui/controls/buttons/Button

        getLogoutButton: function () {
            const LogoutBtn = new QUIButton({
                'class': 'quiqqer-auth-facebook-login-btn quiqqer-frontend-social-button',
                disabled: true,
                textimage: 'fa fa-sign-out',
                text: QUILocale.get(lg, 'classes.facebook.logout.btn.text'),
                events: {
                    onClick: (Btn) => {
                        Btn.disable();

                        this.logout().then(function () {
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

        logout: function () {
            if (!this.$loggedIn) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                try {
                    FB.logout(() => {
                        this.$AuthData = null;
                        this.$token = null;

                        this.fireEvent('logout', [this]);
                        this.$loggedIn = false;

                        resolve();
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

        getAuthData: function () {
            return this.$load().then(() => {
                return this.$AuthData;
            });
        },

        /**
         * Get Facebook access token of currently connected Facebook account
         *
         * @return {Promise}

        getToken: function () {
            return new Promise((resolve, reject) => {
                this.$load().then(this.login, reject).then(() => {
                    resolve(this.$token);
                }, reject);
            });
        },

        /**
         * Return current login status
         *
         * @return {Promise}

        getStatus: function () {
            return new Promise((resolve, reject) => {
                this.$load().then(() => {
                    FB.getLoginStatus((response) => {
                        resolve(response.status);
                    });
                }, reject);
            });
        },

        /**
         * Get info of Facebook profile
         *
         * @return {Promise}

        getProfileInfo: function () {
            return new Promise((resolve, reject) => {
                this.$load().then(() => {
                    try {
                        FB.api('/me', {
                            fields: 'first_name,last_name,email',
                            access_token: this.$token || undefined
                        }, function (response) {
                            resolve(response);
                        });
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

        connectQuiqqerAccount: function (userId, fbToken) {
            return new Promise(function (resolve, reject) {
                QUIAjax.post('package_quiqqer_authfacebook_ajax_connectAccount', resolve, {
                    'package': 'quiqqer/authfacebook',
                    userId: userId,
                    fbToken: fbToken,
                    onError: reject
                });
            });
        },

        /**
         * Connect a facebook account with a quiqqer account
         *
         * @param {number} userId - QUIQQER User ID
         * @return {Promise}

        disconnectQuiqqerAccount: function (userId) {
            return new Promise(function (resolve, reject) {
                QUIAjax.post('package_quiqqer_authfacebook_ajax_disconnectAccount', resolve, {
                    'package': 'quiqqer/authfacebook',
                    userId: userId,
                    onError: reject
                });
            });
        },

        /**
         * Get details of connected Facebook account based on QUIQQER User ID
         *
         * @param {number} userId - QUIQQER User ID
         * @return {Promise}

        getAccountByQuiqqerUserId: function (userId) {
            return new Promise(function (resolve, reject) {
                QUIAjax.get('package_quiqqer_authfacebook_ajax_getAccountByQuiqqerUserId', resolve, {
                    'package': 'quiqqer/authfacebook',
                    userId: userId,
                    onError: reject
                });
            });
        },

        /**
         * Get Facebook login status
         *
         * @return {Promise}

        $getLoginStatus: function () {
            return new Promise((resolve) => {
                FB.getLoginStatus((response) => {
                    this.$loaded = true;

                    if (response.authResponse) {
                        this.$AuthData = response.authResponse;
                        this.$token = this.$AuthData.accessToken;
                    }

                    this.$loggedIn = response.status === 'connected';
                    this.fireEvent('loaded', [this]);
                    resolve();
                });
            });
        },

        /**
         * Load Facebook JavaScript SDK
         *
         * @return {Promise}

        $load: function () {
            if (this.$fbInitialized) {
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                // If FB SDK is already initialized by another script/app on the page,
                // do not re-initialize to avoid overriding global settings or tokens.
                if (window.FB && FB._initialized) {
                    this.$fbInitialized = true;
                    resolve();
                    return;
                }

                this.$getApiCredentials().then((Credentials) => {
                    if (!Credentials.appId) {
                        QUI.getMessageHandler().then((MH) => {
                            MH.addAttention(
                                QUILocale.get(lg, 'classes.facebook.warn.no.appId')
                            );
                        });

                        reject('Facebook API missing credentials.');
                        return;
                    }

                    // Initialize Facebook JavaScript SDK
                    if (typeof window.fbAsyncInit !== 'function') {
                        window.fbAsyncInit = () => {
                            try {
                                FB.init({
                                    appId: Credentials.appId,
                                    //status: true,
                                    cookie: true,
                                    xfbml: true,
                                    version: Credentials.apiVersion
                                });

                                FB.getLoginStatus(() => {
                                    this.$fbInitialized = true;
                                    resolve();
                                });
                            } catch (Exception) {
                                reject('Facebook API initialization failed.');
                            }
                        };
                    }

                    if (!this.$scriptLoaded) {
                        const firstScriptTag = document.getElementsByTagName('script')[0];

                        if (!document.getElementById('facebook-jssdk')) {
                            const facebookScript = document.createElement('script');
                            facebookScript.id = 'facebook-jssdk';
                            facebookScript.src = '//connect.facebook.net/en_US/sdk.js';
                            firstScriptTag.parentNode.insertBefore(facebookScript, firstScriptTag);
                        }

                        this.$scriptLoaded = true;
                    }

                    // wait for load
                    let waitTime = 0;
                    const loadTimer = setInterval(() => {
                        waitTime += 200;

                        if (this.$fbInitialized) {
                            clearInterval(loadTimer);
                            this.$fbInitialized = true;
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
        }
            */
    });
});
