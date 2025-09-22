/**
 * QUIQQER account registration via Facebook Account
 *
 * @module package/quiqqer/authfacebook/bin/frontend/controls/Registrar
 */
define('package/quiqqer/authfacebook/bin/frontend/controls/Registrar', [

    'qui/controls/Control',
    'qui/controls/windows/Popup',
    'qui/controls/loader/Loader',
    'package/quiqqer/authfacebook/bin/Facebook',
    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/frontend/controls/Registrar.css'

], function (QUIControl, QUIPopup, QUILoader, Facebook, QUIAjax, QUILocale) {
    'use strict';

    const lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIControl,
        Type: 'package/quiqqer/authfacebook/bin/frontend/controls/Registrar',

        Binds: [
            '$onImport',
            '$init',
            '$showRegistrarBtn',
            '$getRegistrarUserId',
            '$showInfo',
            '$clearInfo',
            '$showGeneralError',
            '$register',
            '$getGDPRConsent',
            '$openFacebookLoginHelper'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.$signedIn = false;
            this.$TokenInput = null;
            this.$Form = null;
            this.$InfoElm = null;
            this.$BtnElm = null;
            this.Loader = new QUILoader();
            this.$Elm = null;
            this.$registerBtnClicked = false;
            this.$SubmitBtn = null;
            this.$RegisterBtn = null;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            const self = this;

            this.$Elm = this.getElm();

            const RegistrarForm = this.$Elm.getElement('.quiqqer-authfacebook-registrar-form');

            if (!RegistrarForm) {
                return;
            }

            RegistrarForm.removeClass('quiqqer-authfacebook__hidden');

            const FakeRegisterBtn = this.$Elm.getElement('.quiqqer-auth-facebook-registration-btn');

            FakeRegisterBtn.addEvents({
                click: function (event) {
                    event.stop();

                    self.Loader.show();
                    FakeRegisterBtn.disabled = true;

                    self.$openFacebookLoginHelper().then(function (submit) {
                        if (!submit) {
                            FakeRegisterBtn.disabled = false;
                            return;
                        }

                        return self.$init(true);
                    }, function () {
                        FakeRegisterBtn.disabled = false;
                        self.Loader.hide();
                    }).then(function () {
                        self.Loader.hide();
                    });
                }
            });

            this.Loader.inject(this.$Elm);

            this.$Form = this.$Elm.getParent('form');
            this.$TokenInput = this.$Elm.getElement('input[name="token"]');
            this.$BtnElm = this.$Elm.getElement('.quiqqer-authfacebook-registrar-btn');
            this.$InfoElm = this.$Elm.getElement('.quiqqer-authfacebook-registrar-info');
            this.$SubmitBtn = this.$Elm.getElement('button[type="submit"]');

            this.$Form.addEvent('submit', function (event) {
                event.stop();
            });

            //if (localStorage.getItem('quiqqer_auth_facebook_autoconnect')) {
            //    this.$init().catch(function () {
            //        // nothing
            //    });
            //} else {
            FakeRegisterBtn.disabled = false;
            //}

            Facebook.addEvents({
                onLogin: function () {
                    self.$signedIn = true;

                    if (self.$registerBtnClicked) {
                        self.$registerBtnClicked = false;
                        self.$register();
                    }
                },
                onLogout: function () {
                    self.$signedIn = false;
                    self.$init();
                }
            });
        },

        /**
         * Initialize Facebook
         *
         * This means that a request to the Facebook servers is made
         * to load the JavaScript SDK (maybe relevant for data protection purposes!)
         *
         * @param {Boolean} [autoregister]
         * @return {Promise}
         */
        $init: function (autoregister) {
            const self = this;

            autoregister = autoregister || false;

            //this.Loader.show();
            this.$clearInfo();

            return new Promise(function (resolve, reject) {
                Facebook.getStatus().then(function (fbStatus) {
                    //self.Loader.hide();

                    if (fbStatus === 'connected') {
                        self.$signedIn = true;
                    }

                    Facebook.getRegistrationButton().then(function (RegistrationBtn) {
                        self.Loader.hide();

                        self.$RegisterBtn = RegistrationBtn;

                        self.$clearButtons();
                        self.$RegisterBtn.inject(self.$BtnElm);
                        self.$RegisterBtn.addEvent('onClick', function () {
                            if (self.$signedIn) {
                                self.$register();
                            }

                            self.$registerBtnClicked = true;
                        });

                        if (autoregister) {
                            self.$register();
                        }

                        resolve();
                    }, function () {
                        self.Loader.hide();
                        self.$showGeneralError();
                        reject();
                    });
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

            return Facebook.$load().then(function () {
                return Facebook.login()
            }).then(() => {
                this.$signedIn = false;
                return true;
            }).catch(function (err) {
                console.error(err);
            });
        },

        /**
         * Start registration process
         *
         * @return {Promise}
         */
        $register: function () {
            const self = this;

            this.Loader.show();

            return Facebook.getToken().then(function (token) {
                self.$token = token;

                Facebook.isAccountConnectedToQuiqqer(token).then(function (connected) {
                    if (connected) {
                        self.Loader.hide();
                        self.$showAlreadyConnectedInfo();

                        return;
                    }

                    self.$TokenInput.value = token;

                    self.$SubmitBtn.type = 'submit'; // make button submit the registration form
                    self.$SubmitBtn.click(); // simulate form submit by button click to trigger form submit event
                }, self.$showGeneralError);
            }, self.$showGeneralError);
        },

        /**
         * Show error msg when Facebook API could not be initialized correctly
         */
        $showGeneralError: function () {
            if (this.$RegisterBtn) {
                this.$RegisterBtn.setAttribute('text', QUILocale.get(lg, 'controls.frontend.registrar.general_error'));
                this.$RegisterBtn.disable();
            }
        },

        /**
         * Show popup with login option
         *
         * This is shown if the user visits the registration page
         * and a QUIQQER account is already registered with his Facebook account
         */
        $showAlreadyConnectedInfo: function () {
            const self = this;

            this.Loader.show();

            Facebook.getProfileInfo().then(function (ProfileData) {
                self.Loader.hide();

                new QUIPopup({
                    icon: 'fa fa-sign-in',
                    title: QUILocale.get(lg, 'controls.frontend.registrar.login_popup.title'),
                    buttons: false,
                    backgroundClosable: false,
                    titleCloseButton: true,
                    maxHeight: 400,
                    maxWidth: 600,
                    events: {
                        onOpen: function (Popup) {
                            Popup.Loader.show();

                            const Content = Popup.getContent();

                            Content.set(
                                'html',
                                '<p>' +
                                QUILocale.get(lg,
                                    'controls.frontend.registrar.already_connected', {
                                        email: ProfileData.email
                                    }
                                ) +
                                '</p>' +
                                '<div class="facebook-login">' +
                                '<p>' +
                                QUILocale.get(
                                    lg,
                                    'controls.frontend.registrar.already_connected.login.label'
                                ) +
                                '</p>' +
                                '</div>'
                            );

                            require([
                                'package/quiqqer/frontend-users/bin/frontend/controls/login/Login'
                            ], function (FrontendUsersLogin) {
                                new FrontendUsersLogin({
                                    header: false,
                                    authenticators: ['QUI\\Auth\\Facebook\\Auth'],
                                    mail: false,
                                    passwordReset: false
                                }).inject(Content.getElement('.facebook-login'));

                                Popup.Loader.hide();
                            });
                        },
                        onClose: function () {
                            self.Loader.show();

                            Facebook.logout().then(function () {
                                self.Loader.hide();
                            });
                        }
                    }
                }).open();
            }, self.$showGeneralError);
        },

        /**
         * Remove all buttons
         */
        $clearButtons: function () {
            this.$BtnElm.set('html', '');
        },

        /**
         * Show info text (overrides previous info messages)
         */
        $showInfo: function (msg) {
            this.$clearInfo();
            this.$InfoElm.set('html', msg);
        },

        /**
         * Remove info message
         */
        $clearInfo: function () {
            this.$InfoElm.set('html', '');
        },

        /**
         * Get ID of Registrar User
         *
         * @return {Promise}
         */
        $getRegistrarUserId: function () {
            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getRegistrarUserId',
                    resolve, {
                        'package': 'quiqqer/authfacebook',
                        onError: reject
                    }
                );
            });
        }
    });
});