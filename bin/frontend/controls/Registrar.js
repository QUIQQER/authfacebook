/**
 * QUIQQER account registration via Facebook Account
 *
 * @module package/quiqqer/authfacebook/bin/frontend/controls/Registrar
 * @author www.pcsg.de (Patrick Müller)
 */
define('package/quiqqer/authfacebook/bin/frontend/controls/Registrar', [

    'qui/controls/Control',
    'qui/controls/windows/Popup',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',

    'controls/users/Login',
    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/frontend/controls/Registrar.css'

], function (QUIControl, QUIPopup, QUIButton, QUILoader, QUILogin, Facebook,
             QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';
    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/frontend/controls/Registrar',

        Binds: [
            '$onImport',
            '$login',
            '$showRegistrarBtn',
            '$getRegistrarUserId',
            '$showInfo',
            '$clearInfo',
            '$showGeneralError'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.$signedIn   = false;
            this.$TokenInput = null;
            this.$Form       = null;
            this.$InfoElm    = null;
            this.$BtnElm     = null;
            this.Loader      = new QUILoader();
            this.$Elm        = null;
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

            self.$login();

            Facebook.addEvents({
                onLogin: function () {
                    self.$signedIn = true;
                    self.$login();
                }
            });

            Facebook.addEvents({
                onLogout: function () {
                    self.$signedIn = false;
                    self.$login();
                }
            });
        },

        /**
         * Start login process
         */
        $login: function () {
            var self = this;

            this.Loader.show();
            this.$clearInfo();

            if (!self.$signedIn) {
                Facebook.getRegistrationButton().then(function (RegistrationBtn) {
                    self.Loader.hide();

                    self.$clearButtons();
                    RegistrationBtn.inject(self.$BtnElm);
                }, function () {
                    self.Loader.hide();
                    self.$showGeneralError();
                });

                return;
            }

            Facebook.getToken().then(function (token) {
                self.$token = token;

                Facebook.isAccountConnectedToQuiqqer(token).then(function (connected) {
                    if (connected) {
                        self.$clearButtons();
                        self.$showAlreadyConnectedInfo();

                        return;
                    }

                    self.$TokenInput.value = token;
                    self.$Form.submit();
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
                )
            });
        }
    });
});