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

    'controls/users/Login',
    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/frontend/controls/Registrar.css'

], function (QUIControl, QUIPopup, QUILoader, QUILogin, Facebook,
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
            '$register'
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

            this.Loader.inject(this.$Elm);

            this.$Form       = this.$Elm.getParent('form');
            this.$TokenInput = this.$Elm.getElement('input[name="token"]');
            this.$BtnElm     = this.$Elm.getElement('.quiqqer-authfacebook-registrar-btn');
            this.$InfoElm    = this.$Elm.getElement('.quiqqer-authfacebook-registrar-info');
            this.$SubmitBtn  = this.$Elm.getElement('button[type="submit"]');

            this.$Form.addEvent('submit', function (event) {
                event.stop();
            });

            this.Loader.show();

            self.$init();

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
         * Start login process
         */
        $init: function () {
            var self = this;

            this.Loader.show();
            this.$clearInfo();

            Facebook.getStatus().then(function (fbStatus) {
                self.Loader.hide();

                if (fbStatus === 'connected') {
                    self.$signedIn = true;
                }

                Facebook.getRegistrationButton().then(function (RegistrationBtn) {
                    self.Loader.hide();

                    self.$clearButtons();
                    RegistrationBtn.inject(self.$BtnElm);
                    RegistrationBtn.addEvent('onClick', function () {
                        self.$registerBtnClicked = true;

                        if (self.$signedIn) {
                            self.$register();
                        }
                    });
                }, function () {
                    self.Loader.hide();
                    self.$showGeneralError();
                });
            }, function () {
                self.Loader.hide();
                self.$showGeneralError();
            });
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
                        self.$clearButtons();
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
            this.$clearButtons();

            this.$showInfo(
                QUILocale.get(lg, 'controls.frontend.registrar.general_error')
            );
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

                var msg = QUILocale.get(lg,
                    'controls.frontend.registrar.already_connected', {
                        email: ProfileData.email
                    });

                self.$showInfo(msg);

                new QUIPopup({
                    icon              : 'fa fa-sign-in',
                    title             : QUILocale.get(lg, 'controls.frontend.registrar.login_popup.title'),
                    buttons           : false,
                    backgroundClosable: false,
                    titleCloseButton  : true,
                    events            : {
                        onOpen: function (Popup) {
                            Popup.Loader.show();

                            var Content = Popup.getContent();

                            Content.set(
                                'html',
                                '<p>' + msg + '</p>' +
                                '<div class="facebook-login"></div>'
                            );

                            // Login
                            Facebook.logout().then(function () {
                                new QUILogin().inject(
                                    Content.getElement('.facebook-login')
                                );

                                Popup.Loader.hide();
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