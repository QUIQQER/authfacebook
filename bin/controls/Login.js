/**
 * Registration of codes for Google Authenticator QUIQQER plugin
 *
 * @module package/quiqqer/authfacebook/bin/controls/Login
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/controls/Login.css
 *
 */
define('package/quiqqer/authfacebook/bin/controls/Login', [

    'qui/controls/Control',
    'qui/controls/windows/Confirm',
    'qui/controls/buttons/Button',
    'qui/controls/loader/Loader',

    'package/quiqqer/authfacebook/bin/Facebook',

    'Ajax',
    'Locale',

    //'css!package/quiqqer/authfacebook/bin/controls/Login.css'

], function (QUIControl, QUIConfirm, QUIButton, QUILoader, Facebook,
             QUIAjax, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';
    return new Class({

        Extends: QUIControl,
        Type   : 'package/quiqqer/authfacebook/bin/controls/Login',

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
            this.parent(options);

            this.addEvents({
                onImport: this.$onImport
            });

            this.Loader   = new QUILoader();
            this.$InfoElm = null;
            this.$BtnElm  = null;
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-login',
                'html' : '<div class="quiqqer-auth-facebook-login-info"></div>' +
                '<div class="quiqqer-auth-facebook-login-btn"></div>'
            });

            this.$InfoElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-login-info'
            );

            this.$BtnElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-login-btn'
            );

            this.Loader.inject(this.$Elm);

            return this.$Elm;
        },

        /**
         * Event: onImport
         */
        $onImport: function () {
            var self = this;

            this.$Input      = this.getElm();
            this.$Input.type = 'hidden';
            this.$Form       = this.$Input.getParent('form');

            var Elm = this.create().inject(this.$Input, 'after');

            this.Loader.show();

            Facebook.getStatus().then(function (status) {
                switch (status) {
                    case 'connected':
                        Facebook.getAuthData().then(function (AuthData) {
                            self.Loader.hide();
                            self.$Input.value = AuthData.accessToken;
                            self.$Form.fireEvent('submit', [self.$Form]);
                        });
                        break;

                    case 'not_authorized':
                        self.$InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.login.status.not_authorized')
                        );
                        break;

                    case 'unknown':
                        self.$showLoginBtn();
                        break;
                }

                self.Loader.hide();
            });
        },

        /**
         * Show login button
         */
        $showLoginBtn: function () {
            var self     = this;
            var LoginBtn = Facebook.getLoginButton().inject(this.$BtnElm);

            Facebook.addEvents({
                onLogin: function (Response) {
                    LoginBtn.destroy();
                    self.$Input.value = Response.accessToken;
                    self.$Form.fireEvent('submit', [self.$Form]);
                }
            });
        }
    });
});