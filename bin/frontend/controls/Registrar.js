/**
 * QUIQQER account registration via Facebook Account
 *
 * @module package/quiqqer/authfacebook/bin/frontend/controls/Registrar
 * @author www.pcsg.de (Patrick Müller)
 */
define('package/quiqqer/authfacebook/bin/frontend/controls/Registrar', [

    'qui/controls/Control',
    'qui/controls/windows/Popup',
    'qui/controls/loader/Loader',
    'qui/controls/windows/Confirm',

    'controls/users/Login',
    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/frontend/controls/Registrar.css'

], function (QUIControl, QUIPopup, QUILoader, QUIConfirm, QUILogin, Facebook,
             QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';
    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/frontend/controls/Registrar',

        Binds: [
            '$onImport',
            '$init',
            '$showRegistrarBtn',
            '$getRegistrarUserId',
            '$showInfo',
            '$clearInfo',
            '$showGeneralError',
            '$register',
            '$openRegistrationPopup'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.$signedIn           = false;
            this.$TokenInput         = null;
            this.$Form               = null;
            this.$InfoElm            = null;
            this.$BtnElm             = null;
            this.Loader              = new QUILoader();
            this.$Elm                = null;
            this.$registerBtnClicked = false;
            this.$SubmitBtn          = null;
            this.$RegisterBtn        = null;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            var self = this;

            this.$Elm = this.getElm();

            var RegistrarForm = this.$Elm.getElement('.quiqqer-authfacebook-registrar-form');

            if (!RegistrarForm) {
                return;
            }

            RegistrarForm.removeClass('quiqqer-authfacebook__hidden');

            var FakeRegisterBtn = this.$Elm.getElement('.quiqqer-auth-facebook-registration-btn');

            FakeRegisterBtn.addEvents({
                click: function (event) {
                    event.stop();
                    localStorage.setItem('quiqqer_auth_facebook_autoconnect', true);

                    self.Loader.show();
                    FakeRegisterBtn.disabled = true;

                    self.$init().then(self.$openRegistrationPopup, function () {
                        self.Loader.hide();
                    });
                }
            });

            this.Loader.inject(this.$Elm);

            this.$Form       = this.$Elm.getParent('form');
            this.$TokenInput = this.$Elm.getElement('input[name="token"]');
            this.$BtnElm     = this.$Elm.getElement('.quiqqer-authfacebook-registrar-btn');
            this.$InfoElm    = this.$Elm.getElement('.quiqqer-authfacebook-registrar-info');
            this.$SubmitBtn  = this.$Elm.getElement('button[type="submit"]');

            this.$Form.addEvent('submit', function (event) {
                event.stop();
            });

            if (localStorage.getItem('quiqqer_auth_facebook_autoconnect')) {
                this.$init();
            } else {
                FakeRegisterBtn.disabled = false;
            }

            Facebook.addEvents({
                onLogin : function () {
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
         * to load the JavaScript SDK (may be relevant for data protection purposes!)
         *
         * @return {Promise}
         */
        $init: function () {
            var self = this;

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
                            self.$registerBtnClicked = true;

                            if (self.$signedIn) {
                                self.$register();
                            }
                        });

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
         * Opens Popup with a separate Facebook Registration button
         *
         * This is only needed if the user first has to "agree" to the connection
         * to Facebook by clicking the original Registration button
         */
        $openRegistrationPopup: function () {
            var self = this;

            new QUIConfirm({
                'class'  : 'quiqqer-auth-facebook-registration-popup',
                icon     : 'fa fa-facebook-official',
                title    : QUILocale.get(lg, 'controls.frontend.registrar.popup.title'),
                maxHeight: 200,
                maxWidth : 400,
                buttons  : false,
                events   : {
                    onOpen: function (Popup) {
                        var Content = Popup.getContent();

                        Content.set('html', '');
                        Popup.Loader.show();

                        Facebook.getRegistrationButton().then(function (RegistrationBtn) {
                            Popup.Loader.hide();

                            RegistrationBtn.inject(Content);

                            RegistrationBtn.setAttribute(
                                'text',
                                QUILocale.get(lg, 'controls.frontend.registrar.popup.btn.text')
                            );

                            RegistrationBtn.addEvent('onClick', function () {
                                self.$registerBtnClicked = true;

                                if (self.$signedIn) {
                                    self.$register();
                                }

                                Popup.close();
                            });
                        }, function () {
                            Popup.close();
                            self.$showGeneralError();
                        });
                    }
                }
            }).open();
        },

        /**
         * Start registration process
         *
         * @return {Promise}
         */
        $register: function () {
            var self = this;

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
                    self.$SubmitBtn.click(); // simulate form submit by button click to trigger form submit event
                }, self.$showGeneralError);
            }, self.$showGeneralError);
        },

        /**
         * Show error msg when Facebook API could not be initialized correctly
         */
        $showGeneralError: function () {
            if (this.$RegisterBtn) {
                this.$RegisterBtn.setAttribute('title', QUILocale.get(lg, 'controls.frontend.registrar.general_error'));
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
            var self = this;

            this.Loader.show();

            Facebook.getProfileInfo().then(function (ProfileData) {
                self.Loader.hide();

                new QUIPopup({
                    icon              : 'fa fa-sign-in',
                    title             : QUILocale.get(lg, 'controls.frontend.registrar.login_popup.title'),
                    buttons           : false,
                    backgroundClosable: false,
                    titleCloseButton  : true,
                    events            : {
                        onOpen : function (Popup) {
                            var Content = Popup.getContent();

                            Content.set(
                                'html',
                                '<p>' +
                                QUILocale.get(lg,
                                    'controls.frontend.registrar.already_connected', {
                                        email: ProfileData.email
                                    }) +
                                '</p>' +
                                '<div class="facebook-login">' +
                                '<p>' +
                                QUILocale.get(lg,
                                    'controls.frontend.registrar.already_connected.login.label') +
                                '</p>' +
                                '</div>'
                            );

                            // Login
                            new QUILogin({
                                authenticators: ['QUI\\Auth\\Facebook\\Auth']
                            }).inject(
                                Content.getElement('.facebook-login')
                            );
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
                        onError  : reject
                    }
                );
            });
        }
    });
});