/**
 * Settings for Facebook QUIQQER Authentication
 *
 * @module package/quiqqer/authfacebook/bin/controls/Settings
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/controls/Control
 * @require qui/controls/windows/Confirm
 * @require qui/controls/buttons/Button
 * @requrie qui/controls/loader/Loader
 * @require package/quiqqer/authfacebook/bin/Facebook
 * @require Mustache
 * @require Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/controls/Settings.css
 *
 * @event onLoaded [self] - fires when all information is gathered and control is loaded
 * @event onAccountConnected [Account, self] - fires if the user connects his QUIQQER account
 * with his Facebook account
 * @event onAccountDisconnected [userId, self] - fires if the user disconnects his QUIQQER account from
 * his Facebook account
 * @event onAuthWithoutEmail [self] - fires if the user authorizes QUIQQER to use his Facebook account
 * but explicitly disallows use of Facebook E-Mail address
 */
define('package/quiqqer/authfacebook/bin/controls/Settings', [

    'qui/controls/Control',
    'qui/controls/windows/Confirm',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',

    'package/quiqqer/authfacebook/bin/Facebook',

    'Mustache',
    'Ajax',
    'Locale',

    'css!package/quiqqer/authfacebook/bin/controls/Settings.css'

], function (QUIControl, QUIConfirm, QUIButton, QUILoader, Facebook, Mustache,
             QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/controls/Settings',

        Binds: [
            '$onInject',
            '$onResize',
            '$showAccountInfo',
            'setInfoText',
            '$showConnectionInfo'
        ],

        options: {
            uid: false  // QUIQQER User ID
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onInject: this.$onInject
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
            var self   = this;
            var userId = this.getAttribute('uid');

            this.Loader.show();

            // check if user is allowed to edit facebook account connection
            QUIAjax.get(
                'package_quiqqer_authfacebook_ajax_isEditUserSessionUser',
                function (result) {
                    if (!result) {
                        self.$Elm.set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.wrong.user.info')
                        );

                        self.Loader.hide();

                        self.fireEvent('loaded', [self]);
                        return;
                    }

                    Facebook.getAccountByQuiqqerUserId(userId).then(function (Account) {
                        self.Loader.hide();

                        if (!Account) {
                            self.$showConnectionInfo().then(function() {
                                self.fireEvent('loaded', [self]);
                            });
                            return;
                        }

                        self.$showAccountInfo(Account).then(function() {
                            self.fireEvent('loaded', [self]);
                        });
                    }, function (Exception) {
                        console.log(Exception.getCode());
                    });
                }, {
                    'package': 'quiqqer/authfacebook',
                    userId   : userId
                }
            );

            Facebook.addEvents({
                'onLogin': function () {
                    self.$showConnectionInfo();
                }
            });
        },

        /**
         * Show info of connected facebook account
         *
         * @param {Object} Account - Data of connected Facebook account
         * @return {Promise}
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

            var userId = this.getAttribute('uid');

            new QUIButton({
                'class'  : 'quiqqer-auth-facebook-settings-btn',
                textimage: 'fa fa-unlink',
                text     : QUILocale.get(lg, 'controls.settings.showAccountInfo.btn.disconnect'),
                events   : {
                    onClick: function (Btn) {
                        self.Loader.show();

                        Facebook.disconnectQuiqqerAccount(
                            userId
                        ).then(function (success) {
                            self.Loader.hide();

                            if (success) {
                                Btn.destroy();
                                self.$showConnectionInfo();
                                self.fireEvent('accountDisconnected', [userId, self]);
                            }
                        });
                    }
                }
            }).inject(
                this.$Elm
            );

            return Promise.resolve();
        },

        /**
         * Set information text
         *
         * @param {string} text
         */
        setInfoText: function(text) {
            this.$InfoElm.set('html', text);
        },

        /**
         * Show info on how to connect a facebook account
         */
        $showConnectionInfo: function () {
            var self = this;

            this.Loader.show();

            this.$BtnsElm.set('html', '');

            return new Promise(function(resolve, reject) {
                Facebook.getStatus().then(function (status) {
                    switch (status) {
                        case 'connected':
                            Promise.all([
                                Facebook.getProfileInfo(),
                                Facebook.getAuthData()
                            ]).then(function (result) {
                                resolve(); // fires onLoaded

                                var Profile  = result[0];
                                var AuthData = result[1];

                                // Check if user provided email
                                if (typeof Profile.email === 'undefined') {
                                    self.setInfoText(QUILocale.get(lg, 'controls.settings.addAccount.email.unknown', {
                                        'name': Profile.first_name + ' ' + Profile.last_name
                                    }));

                                    Facebook.getAuthButton(true).inject(self.$BtnsElm);

                                    self.fireEvent('authWithoutEmail', [self]);
                                    return;
                                }

                                self.setInfoText(
                                    QUILocale.get(
                                        lg,
                                        'controls.settings.addAccount.info.connected', {
                                            'name'     : Profile.first_name + ' ' + Profile.last_name,
                                            'email'    : Profile.email
                                        }
                                    )
                                );

                                // "Connect account" Button
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
                                                self.Loader.hide();

                                                if (!Account) {
                                                    return;
                                                }

                                                self.$showAccountInfo(Account);
                                                self.fireEvent('accountConnected', [Account, self]);
                                            });
                                        }
                                    }
                                }).inject(self.$BtnsElm);
                            });
                            break;

                        case 'not_authorized':
                            self.setInfoText(
                                QUILocale.get(lg, 'controls.settings.addAccount.info.not_authorized')
                            );

                            Facebook.getAuthButton().inject(self.$BtnsElm);
                            resolve();
                            break;

                        default:
                            self.setInfoText(
                                QUILocale.get(lg, 'controls.settings.addAccount.info.unknown')
                            );

                            Facebook.getLoginButton().inject(self.$BtnsElm);
                            resolve();
                    }

                    self.Loader.hide();
                });
            });
        }
    });
});