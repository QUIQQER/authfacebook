/**
 * Facebook Authentication for QUIQQER
 *
 * @module package/quiqqer/authfacebook/bin/controls/Login
 * @author www.pcsg.de (Patrick Müller)
 */
define('package/quiqqer/authfacebook/bin/controls/Login', [

    'qui/controls/Control',
    'qui/controls/loader/Loader',
    'qui/controls/windows/Confirm',

    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/controls/Login.css'

], function (QUIControl, QUILoader, QUIConfirm, Facebook, QUIAjax, QUILocale) {
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

            this.$FakeLoginButton.addEvents({
                click: function (event) {
                    event.stop();
                    localStorage.setItem('quiqqer_auth_facebook_autoconnect', true);

                    self.$FakeLoginButton.disabled = true;
                    self.Loader.show();

                    self.$init().then(function() {
                        self.Loader.hide();
                        self.$openLoginPopup();
                    }, function() {
                        self.Loader.hide();
                    });
                }
            });

            this.create().inject(this.$Input, 'after');

            if (localStorage.getItem('quiqqer_auth_facebook_autoconnect')) {
                this.$init();
            } else {
                this.$FakeLoginButton.disabled = false;
            }

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
         * Initialize Facebook Login
         *
         * This means that a request to the Facebook servers is made
         * to load the JavaScript SDK (may be relevant for data protection purposes!)
         *
         * @return {Promise}
         */
        $init: function () {
            var self = this;

            return new Promise(function(resolve, reject) {
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
                            self.$LoginButton.inject(self.$BtnElm);
                            break;
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
         * Opens Popup with a separate Facebook Login button
         *
         * This is only needed if the user first has to "agree" to the connection
         * to Facebook by clicking the original Login button
         */
        $openLoginPopup: function () {
            var self = this;

            new QUIConfirm({
                'class'  : 'quiqqer-auth-facebook-login-popup',
                icon     : 'fa fa-facebook-official',
                title    : 'Facebook Login',
                maxHeight: 200,
                maxWidth : 350,
                buttons  : false,
                events   : {
                    onOpen: function (Popup) {
                        var Content = Popup.getContent();

                        Content.set('html', '');

                        var LoginBtn = Facebook.getLoginButton().inject(Content);
                        LoginBtn.setAttribute(
                            'text',
                            QUILocale.get(lg, 'controls.login.popup.btn.text')
                        );

                        LoginBtn.addEvent('onClick', function () {
                            self.$canAuthenticate = true;

                            if (self.$loggedIn) {
                                self.$authenticate();
                            }

                            Popup.close();
                        });
                    }
                }
            }).open();
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