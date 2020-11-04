/**
 * Facebook Authentication for QUIQQER
 *
 * @module package/quiqqer/authfacebook/bin/controls/Login
 * @author www.pcsg.de (Patrick Müller)
 */
define('package/quiqqer/authfacebook/bin/controls/Login', [

    'qui/controls/Control',
    'qui/controls/windows/Popup',
    'qui/controls/loader/Loader',

    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/controls/Login.css'

], function (QUIControl, QUIPopup, QUILoader, Facebook, QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/controls/Login',

        Binds: [
            '$onImport',
            '$init',
            '$showSettings',
            '$onConnected',
            '$getLoginUserId',
            '$showGeneralError',
            '$showMsg',
            '$clearMsg',
            '$openLoginPopup'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.Loader           = new QUILoader();
            this.$InfoElm         = null;
            this.$BtnElm          = null;
            this.$loggedIn        = false;
            this.$canAuthenticate = false;
            this.$FakeLoginButton = null;
            this.$LoginButton     = null;
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-login',
                'html' : '<div class="quiqqer-auth-facebook-login-info" style="display: none;"></div>' +
                    '<div class="quiqqer-auth-facebook-login-btns"></div>'
            });

            this.$InfoElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-login-info'
            );

            this.$BtnElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-login-btns'
            );

            this.Loader.inject(this.$Elm);

            return this.$Elm;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            var self = this;

            this.$Input           = this.getElm();
            this.$Input.type      = 'hidden';
            this.$Form            = this.$Input.getParent('form');
            this.$canAuthenticate = false;
            this.$FakeLoginButton = this.$Elm.getParent().getElement('.quiqqer-auth-facebook-login-btn');

            this.getElm().getParent('.quiqqer-facebook-login').set({
                'data-quiid': this.getId(),
                'data-qui'  : this.getType()
            });

            this.$FakeLoginButton.addEvents({
                click: function (event) {
                    event.stop();

                    self.$FakeLoginButton.disabled = true;
                    self.Loader.show();

                    Facebook.getGDPRConsent().then(function () {
                        return self.$openFacebookLoginHelper();
                    }).then(function (submit) {
                        if (!submit) {
                            self.$FakeLoginBtn.disabled = false;
                            return;
                        }

                        return self.$init(true);
                    }, function () {
                        self.$FakeLoginButton.disabled = false;
                        self.Loader.hide();
                    }).then(function () {
                        self.Loader.hide();
                    });
                }
            });

            this.create().inject(this.$Input, 'after');

            //if (localStorage.getItem('quiqqer_auth_facebook_autoconnect')) {
            //    this.$init().catch(function () {
            //        // nothing
            //    });
            //} else {
            this.$FakeLoginButton.disabled = false;
            //}

            Facebook.addEvents({
                onLogin : function () {
                    self.$loggedIn = true;

                    if (self.$canAuthenticate) {
                        self.$authenticate();
                    }
                },
                onLogout: function () {
                    self.$loggedIn        = false;
                    self.$canAuthenticate = false;
                }
            });
        },

        /**
         * Execute a click at the facebook login
         */
        click: function () {
            if (this.$LoginButton) {
                this.$LoginButton.click();
                return;
            }

            this.$FakeLoginButton.click();
        },

        /**
         * Initialize Facebook Login
         *
         * This means that a request to the Facebook servers is made
         * to load the JavaScript SDK (may be relevant for data protection purposes!)
         *
         * @param {Boolean} [autoauthenticate]
         * @return {Promise}
         */
        $init: function (autoauthenticate) {
            var self = this;

            autoauthenticate = autoauthenticate || false;

            return new Promise(function (resolve, reject) {
                Promise.all([
                    Facebook.getStatus(),
                    self.$getLoginUserId()
                ]).then(function (result) {
                    var status      = result[0];
                    var loginUserId = result[1];

                    switch (status) {
                        case 'connected':
                            //self.$onConnected(loginUserId);
                            self.$loggedIn = true;
                        //break;

                        case 'not_authorized':
                        case 'unknown':
                            self.$LoginButton = Facebook.getLoginButton();

                            self.$LoginButton.addEvent('onClick', function () {
                                self.$canAuthenticate = true;

                                if (self.$loggedIn) {
                                    self.$authenticate();
                                }
                            });

                            self.$FakeLoginButton.destroy();
                            self.$FakeLoginButton = null;

                            self.$LoginButton.inject(self.$BtnElm);
                            break;
                    }

                    if (autoauthenticate) {
                        self.$authenticate();
                    }

                    resolve();
                }, function () {
                    self.Loader.hide();
                    self.$showGeneralError();

                    reject();
                });
            });
        },

        /**
         * Helper if facebook sdk is not loaded
         *
         * @return {Promise}
         */
        $openFacebookLoginHelper: function () {
            if (Facebook.isLoggedIn()) {
                return Promise.resolve(true);
            }

            var self = this;

            return new Promise(function (resolve) {
                new QUIPopup({
                    icon     : 'fa fa-facebook',
                    title    : QUILocale.get(lg, 'controls.frontend.registrar.sign_in.popup.title'),
                    maxWidth : 500,
                    maxHeight: 300,
                    buttons  : false,
                    events   : {
                        onOpen: function (Win) {
                            Win.Loader.show();
                            Win.getContent().setStyles({
                                'alignItems'    : 'center',
                                'display'       : 'flex',
                                'flexDirection' : 'column',
                                'justifyContent': 'center'
                            });

                            Facebook.$load().then(function () {
                                Win.getContent().set(
                                    'html',
                                    '<p>' +
                                    QUILocale.get(lg, 'controls.register.status.unknown') +
                                    '</p>' +
                                    '<button class="qui-button quiqqer-auth-facebook-registration-btn qui-utils-noselect">' +
                                    QUILocale.get(lg, 'controls.frontend.registrar.sign_in.popup.btn') +
                                    '</button>'
                                );

                                Win.getContent().getElement('button').addEvent('click', function () {
                                    Win.Loader.show();

                                    Facebook.login().then(function () {
                                        self.$signedIn = false;
                                        resolve(true);
                                        Win.close();
                                    }).catch(function () {
                                        Win.Loader.hide();
                                    });
                                });

                                Win.Loader.hide();
                            });
                        },

                        onCancel: function () {
                            self.Loader.hide();
                            resolve(false);
                        }
                    }
                }).open();
            });
        },

        /**
         * Show general error msg on Facebook API failure
         */
        $showGeneralError: function () {
            if (this.$LoginButton) {
                this.$LoginButton.setAttribute('title', QUILocale.get(lg, 'controls.login.general_error'));
                this.$LoginButton.disable();
            }
        },

        /**
         * If the user is connected to FB and has authorized QUIQQER
         *
         * @param {Number} loginUserId - ID of the QUIQQER user that tries to log in (only used for 2FA)
         */
        $onConnected: function (loginUserId) {
            var self = this;

            Facebook.getToken().then(function (token) {
                Facebook.isAccountConnectedToQuiqqer(token).then(function (connected) {
                    // user is not connected and uses Facebook login as 2FA
                    if (!connected && loginUserId) {
                        self.$showSettings(loginUserId, status);
                        self.Loader.hide();
                        return;
                    }

                    // if there is no previous user id in the user session
                    // Facebook auth is used as a primary authenticator
                    if (!loginUserId) {
                        if (self.$canAuthenticate) {
                            self.$Input.value = token;

                            self.$Form.fireEvent('submit', [self.$Form]);
                            self.$canAuthenticate = false;
                            return;
                        }

                        self.$BtnElm.set('html', '');

                        self.$LoginButton = Facebook.getLoginButton();

                        self.$LoginButton.addEvent('onClick', function () {
                            self.$canAuthenticate = true;

                            if (self.$loggedIn) {
                                self.$authenticate();
                            }
                        });

                        self.$FakeLoginButton.destroy();
                        self.$LoginButton.inject(self.$BtnElm);
                        return;
                    }

                    // check if login user is facebook user
                    self.$isLoginUserFacebookUser(token).then(function (isLoginUser) {
                        self.Loader.hide();

                        if (!isLoginUser) {
                            self.Loader.show();

                            self.$loginErrorCheck().then(function (maxLoginsExceeded) {
                                self.Loader.hide();

                                if (maxLoginsExceeded) {
                                    window.location = window.location;
                                    return;
                                }

                                self.$showMsg(QUILocale.get(lg, 'controls.login.wrong.facebook.user'));

                                Facebook.getLogoutButton().inject(self.$BtnElm);
                            });
                            return;
                        }

                        if (self.$canAuthenticate) {
                            self.$authenticate();
                        }
                    });
                }, function () {
                    self.$showGeneralError();
                });
            }, function () {
                self.$showGeneralError();
            });
        },

        /**
         * Start authentication
         *
         * @return {Promise}
         */
        $authenticate: function () {
            var self = this;

            this.Loader.show();

            return Facebook.getToken().then(function (fbToken) {
                self.$Input.value = fbToken;
                self.$Form.fireEvent('submit', [self.$Form]);
                self.$canAuthenticate = false;

                self.Loader.hide();
            });
        },

        /**
         * Shows settings control
         *
         * @param {number} uid - QUIQQER User ID
         * @param {string} status - Facebook Login status
         */
        $showSettings: function (uid, status) {
            var self = this;

            this.Loader.show();
            this.$clearMsg();

            var emailProvided = true;

            require([
                'package/quiqqer/authfacebook/bin/controls/Settings'
            ], function (SettingsControl) {
                self.Loader.hide();
                var Settings = new SettingsControl({
                    uid   : uid,
                    events: {
                        onAccountConnected: function (Account, Control) {
                            self.$init();
                            Control.destroy();
                        },
                        onLoaded          : function () {
                            switch (status) {
                                case 'connected':
                                    if (!emailProvided) {
                                        Settings.setInfoText(
                                            QUILocale.get(lg, 'controls.login.register.status.not_authorized')
                                        );

                                        return;
                                    }

                                    Settings.setInfoText(
                                        QUILocale.get(lg, 'controls.login.register.status.connected')
                                    );
                                    break;
                            }
                        },
                        onAuthWithoutEmail: function () {
                            emailProvided = false;
                        }
                    }
                }).inject(self.$InfoElm);
            });
        },

        /**
         * Show info message
         *
         * @param {String} msg
         */
        $showMsg: function (msg) {
            this.$InfoElm.setStyle('display', '');
            this.$InfoElm.set('html', msg);
        },

        /**
         * Clear info message
         */
        $clearMsg: function () {
            this.$InfoElm.setStyle('display', 'none');
        },

        /**
         * Checks if the current QUIQQER Login user is the Facebook user
         *
         * @param {string} fbToken - Facebook API token
         * @return {Promise}
         */
        $isLoginUserFacebookUser: function (fbToken) {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_isLoginUserFacebookUser',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        fbToken  : fbToken,
                        onError  : reject
                    }
                );
            });
        },

        /**
         * Get ID of Login User
         *
         * @return {Promise}
         */
        $getLoginUserId: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getLoginUserId',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        onError  : reject
                    }
                );
            });
        },

        /**
         * Check facebook login errors
         *
         * @return {Promise}
         */
        $loginErrorCheck: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.post(
                    'package_quiqqer_authfacebook_ajax_loginErrorCheck',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        onError  : reject
                    }
                );
            });
        }
    });
});