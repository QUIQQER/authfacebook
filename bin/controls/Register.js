/**
 * Registration of codes for Google Authenticator QUIQQER plugin
 *
 * @module package/quiqqer/authfacebook/bin/controls/Register
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/controls/Register.css
 *
 */
define('package/quiqqer/authfacebook/bin/controls/Register', [

    'qui/controls/Control',
    'qui/controls/windows/Confirm',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',

    'package/quiqqer/authfacebook/bin/Facebook',

    'Mustache',
    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/controls/Register.css'

], function (QUIControl, QUIConfirm, QUIButton, QUILoader, Facebook, Mustache,
             QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';
    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/controls/Register',

        Binds: [
            '$onInject',
            '$onRefresh',
            '$onCreate',
            '$onResize',
            'refresh',
            '$listRefresh',
            '$generateKey',
            '$showKey',
            '$deleteKeys'
        ],

        options: {
            uid: false
        },

        initialize: function (options) {
            this.setAttribute('title', QUILocale.get(lg, 'passwords.panel.title'));

            this.parent(options);

            this.addEvents({
                onInject: this.$onInject,
                onResize: this.$onResize
            });

            this.Loader   = new QUILoader();
            this.$InfoElm = null;
            this.$BtnsElm = null;
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-register',
                html   : '<div class="quiqqer-auth-facebook-settings-info"></div>' +
                '<div class="quiqqer-auth-facebook-settings-btns"></div>'
            });

            this.$InfoElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-settings-info'
            );

            this.$BtnsElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-settings-btns'
            );

            this.Loader.inject(this.$Elm);

            return this.$Elm;
        },

        /**
         * Event: onInject
         */
        $onInject: function () {
            this.$showRegisterInfo();
        },

        /**
         * Show info of connected facebook account
         *
         * @param {Object} Account - Data of connected Facebook account
         */
        $showAccountInfo: function (Account) {
            var self = this;

            this.$BtnsElm.set('html', '');
            this.$InfoElm.set(
                'html',
                QUILocale.get(
                    'quiqqer/authfacebook',
                    'controls.settings.showAccountInfo.text',
                    Account
                )
            );

            new QUIButton({
                'class'  : 'quiqqer-auth-facebook-settings-btn',
                textimage: 'fa fa-unlink',
                text     : QUILocale.get(lg, 'controls.settings.showAccountInfo.btn.disconnect'),
                events   : {
                    onClick: function (Btn) {
                        self.Loader.show();

                        Facebook.disconnectQuiqqerAccount(
                            self.getAttribute('uid')
                        ).then(function (success) {
                            self.Loader.hide();

                            if (success) {
                                Btn.destroy();
                                self.$showConnectionInfo();
                            }
                        });
                    }
                }
            }).inject(
                this.$Elm
            );
        },

        /**
         * Show registration info
         */
        $showRegisterInfo: function() {
            var self = this;

            this.Loader.show();

            Facebook.getStatus().then(function(status) {
                switch (status) {
                    case 'connected':

                        break;

                    case 'not_authorized':
                        self.Loader.hide();

                        self.$InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.register.step.authorize')
                        );

                        Facebook.getLoginButton().inject(self.$BtnsElm);
                        Facebook.addEvents({
                            onLogin: function() {
                                self.Loader.show();

                                self.$checkProfilePermissions().then(function() {
                                    // @todo Abbruch und Mitteilung, dass E-Mail-Adresse übergeben werden MUSS!
                                })
                            }
                        });
                        break;
                }
            });
        },

        /**
         * Check if the Facebook permissions given to QUIQQER
         * are sufficient for the registration process
         *
         * @return {Promise}
         */
        $checkProfilePermissions: function()
        {
            return new Promise(function(resolve, reject) {
                Facebook.getProfileInfo().then(function(Profile) {
                    resolve(typeof Profile.email !== 'undefined');
                });
            });
        },

        /**
         * Show info on how to connect a facebook account
         */
        $showConnectionInfo: function () {
            var self = this;

            this.Loader.show();

            this.$BtnsElm.set('html', '');

            Facebook.getStatus().then(function (status) {
                switch (status) {
                    case 'connected':
                        Promise.all([
                            Facebook.getProfileInfo(),
                            Facebook.getAuthData()
                        ]).then(function (result) {
                            var Profile  = result[0];
                            var AuthData = result[1];

                            // Check if user provided email
                            if (typeof Profile.email === 'undefined') {
                                self.$InfoElm.set(
                                    'html',
                                    QUILocale.get(lg, 'controls.settings.addAccount.email.unknown', {
                                        'name': Profile.first_name + ' ' + Profile.last_name
                                    })
                                );

                                Facebook.getLoginButton().inject(self.$BtnsElm);
                                return;
                            }

                            var QUser = self.getAttribute('User');

                            self.$InfoElm.set(
                                'html',
                                QUILocale.get(
                                    lg,
                                    'controls.settings.addAccount.info.connected', {
                                        'name'     : Profile.first_name + ' ' + Profile.last_name,
                                        'email'    : Profile.email,
                                        'qUserName': QUser.getUsername(),
                                        'qUserId'  : QUser.getId()
                                    }
                                )
                            );

                            new QUIButton({
                                'class'  : 'quiqqer-auth-facebook-settings-btn',
                                textimage: 'fa fa-link',
                                text     : QUILocale.get(lg, 'controls.settings.addAccount.btn.connect'),
                                events   : {
                                    onClick: function () {
                                        self.Loader.show();

                                        Facebook.connectQuiqqerAccount(
                                            self.getAttribute('uid'),
                                            AuthData.accessToken
                                        ).then(function (Account) {
                                            self.$showAccountInfo(Account);
                                            self.Loader.hide();
                                        });
                                    }
                                }
                            }).inject(self.$BtnsElm);
                        });
                        break;

                    case 'not_authorized':
                        self.$InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.addAccount.info.not_authorized')
                        );

                        Facebook.getLoginButton().inject(self.$BtnsElm);
                        Facebook.addEvents({
                            'onLogin': function () {
                                self.$showConnectionInfo();
                            }
                        });
                        break;

                    default:
                        self.$InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.addAccount.info.unknown')
                        );

                        Facebook.getLoginButton().inject(self.$BtnsElm);
                        Facebook.addEvents({
                            'onLogin': function () {
                                self.$showConnectionInfo();
                            }
                        });
                }

                self.Loader.hide();
            });
        },

        /**
         * Event: onResize
         */
        $onResize: function () {
            if (!this.$GridContainer) {
                return;
            }

            var size = this.$GridContainer.getSize();

            //this.$Grid.setHeight(size.y);
            this.$Grid.setHeight(200);  // @todo variable height
            this.$Grid.resize();
        }
    });
});