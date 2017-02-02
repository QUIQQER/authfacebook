/**
 * Registration of codes for Google Authenticator QUIQQER plugin
 *
 * @module package/quiqqer/authfacebook/bin/controls/Settings
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/QUI
 * @require qui/controls/Control
 * @require qui/controls/buttons/Button
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/controls/Settings.css
 *
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

            this.Loader = new QUILoader();
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-register'
            });

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
                        return;
                    }

                    Facebook.getAccountByQuiqqerUserId(userId).then(function (Account) {
                        if (!Account) {
                            self.$showConnectionInfo();
                            return;
                        }

                        self.$showAccountInfo(Account);
                    }, function (Exception) {
                        console.log(Exception.getCode());
                    });
                }, {
                    'package': 'quiqqer/authfacebook',
                    userId   : userId
                }
            );
        },

        /**
         * Show info of connected facebook account
         *
         * @param {Object} Account - Data of connected Facebook account
         */
        $showAccountInfo: function (Account) {

        },

        /**
         * Show info on how to connect a facebook account
         */
        $showConnectionInfo: function () {
            var self = this;

            this.$Elm.set(
                'html',
                '<div class="quiqqer-auth-facebook-settings-addaccount-info"></div>' +
                '<div class="quiqqer-auth-facebook-settings-addaccount-btns"></div>'
            );

            this.Loader.show();

            var InfoElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-settings-addaccount-info'
            );
            var BtnsElm = this.$Elm.getElement(
                '.quiqqer-auth-facebook-settings-addaccount-btns'
            );

            Facebook.getStatus().then(function (status) {

                console.log(status);

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
                                InfoElm.set(
                                    'html',
                                    QUILocale.get(lg, 'controls.settings.addAccount.email.unknown', {
                                        'name': Profile.first_name + ' ' + Profile.last_name
                                    })
                                );

                                Facebook.getLoginButton().inject(BtnsElm);
                                return;
                            }

                            var QUser = self.getAttribute('User');

                            InfoElm.set(
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

                            console.log(AuthData);

                            new QUIButton({
                                textimage: 'fa fa-link',
                                text     : QUILocale.get(lg, 'controls.settings.addAccount.btn.connect'),
                                events   : {
                                    onClick: function () {
                                        Facebook.connectQuiqqerAccount(
                                            self.getAttribute('uid'),
                                            AuthData.accessToken,
                                            Profile
                                        )
                                    }
                                }
                            }).inject(BtnsElm);
                        });
                        break;

                    case 'not_authorized':
                        InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.addAccount.info.not_authorized')
                        );

                        Facebook.getLoginButton().inject(BtnsElm);
                        break;

                    default:
                        InfoElm.set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.addAccount.info.unknown')
                        );

                        Facebook.getLoginButton().inject(BtnsElm);
                        Facebook.addEvents({
                            'onLogin': function () {
                                self.$showConnectionInfo();
                            }
                        });
                }
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
        },

        /**
         * Generate a new google authenticator key
         */
        $addAccount: function () {
            var self         = this;
            var submitAction = 'close';

            var FuncSetPopupInfo = function (Popup, infoText) {
                var Content = Popup.getContent();

                Content.getElement(
                    '.quiqqer-auth-facebook-settings-addaccount-info'
                ).set(
                    'html',
                    infoText
                );

                Popup.Loader.hide();
            };

            var FuncFacebookStatusCheck = function (Popup) {
                var Content = Popup.getContent();

                Content.set(
                    'html',
                    '<div class="quiqqer-auth-facebook-settings-addaccount-info"></div>' +
                    '<div class="quiqqer-auth-facebook-settings-addaccount-btns"></div>'
                );

                Popup.Loader.show();

                var BtnsElm = Content.getElement(
                    '.quiqqer-auth-facebook-settings-addaccount-btns'
                );

                Facebook.getStatus().then(function (status) {

                    console.log(status);

                    switch (status) {
                        case 'connected':
                            Facebook.getProfileInfo().then(function (Profile) {
                                Facebook.checkAccountRegistration(Profile.userID).then(function (result) {
                                    var QUser = self.getAttribute('User');
                                    var email = QUILocale.get(lg, 'controls.settings.addAccount.email.unknown');

                                    if (typeof Profile.email !== 'undefined') {
                                        email = Profile.email
                                    }

                                    if (result.connected) {
                                        // @todo Konto bereits verknüpft
                                        console.log(result);
                                        return;
                                    }

                                    FuncSetPopupInfo(Popup, QUILocale.get(
                                        lg,
                                        'controls.settings.addAccount.info.connected', {
                                            'name'     : Profile.first_name + ' ' + Profile.last_name,
                                            'email'    : email,
                                            'qUserName': QUser.getUsername(),
                                            'qUserId'  : QUser.getId()
                                        }
                                    ));

                                    submitAction = 'add';
                                });
                            });
                            break;

                        case 'not_authorized':
                            FuncSetPopupInfo(Popup, QUILocale.get(
                                lg,
                                'controls.settings.addAccount.info.not_authorized'
                            ));

                            Facebook.getLoginButton().inject(BtnsElm);
                            break;

                        default:
                            FuncSetPopupInfo(Popup, QUILocale.get(
                                lg,
                                'controls.settings.addAccount.info.unknown'
                            ));

                            Facebook.getLoginButton().inject(BtnsElm);
                            Facebook.addEvents({
                                'onLogin': function () {
                                    FuncFacebookStatusCheck(Popup);
                                }
                            });
                    }
                });
            };

            // open popup
            var Popup = new QUIConfirm({
                title             : QUILocale.get(
                    lg, 'controls.settings.addAccount.title'
                ),
                maxHeight         : 500,
                maxWidth          : 600,
                icon              : 'fa fa-plus',
                backgroundClosable: true,

                // buttons
                buttons         : true,
                titleCloseButton: true,
                content         : false,
                events          : {
                    onOpen  : FuncFacebookStatusCheck,
                    onSubmit: function () {
                        var Input = Popup.getContent().getElement('input');
                        var val   = Input.value.trim();

                        if (val == '') {
                            Input.value = '';
                            Input.focus();
                            return;
                        }

                        Popup.Loader.show();

                        QUIAjax.post(
                            'package_quiqqer_authfacebook_ajax_generateKey',
                            function (success) {
                                Popup.Loader.hide();

                                if (success) {
                                    Popup.close();

                                    self.refresh().then(function () {
                                        self.$showKey(self.$Grid.getData().length - 1);
                                    });
                                }
                            }, {
                                'package': 'quiqqer/authfacebook',
                                title    : val,
                                userId   : self.getAttribute('uid')
                            }
                        )
                    }
                }
            });

            Popup.open();
        },

        /**
         * Show access code for google authenticator account
         */
        $showKey: function (row) {
            var self = this;
            var KeyData;
            var Row  = this.$Grid.getDataByRow(row);

            var FuncShowRegenerateWarning = function () {
                var WarnPopup = new QUIConfirm({
                    title             : QUILocale.get(lg, 'controls.settings.showkey.regenerate.warning.title'),
                    maxHeight         : 200,
                    maxWidth          : 500,
                    icon              : 'fa fa-repeat',
                    backgroundClosable: false,

                    // buttons
                    buttons         : true, // {bool} [optional] show the bottom button line
                    //closeButtonText : Locale.get('qui/controls/windows/Popup', 'btn.close'),
                    titleCloseButton: false,  // {bool} show the title close button
                    content         : false,
                    events          : {
                        onOpen  : function () {
                            Popup.Loader.show();

                            var Content = WarnPopup.getContent();

                            Content.set(
                                'html',
                                QUILocale.get(lg, 'controls.settings.showkey.regenerate.warning')
                            );
                        },
                        onSubmit: function () {
                            QUIAjax.post(
                                'package_quiqqer_authfacebook_ajax_regenerateRecoveryKeys',
                                function (success) {
                                    Popup.Loader.hide();
                                    WarnPopup.close();

                                    if (!success) {
                                        return;
                                    }

                                    Popup.close();
                                    self.$showKey(row);
                                }, {
                                    'package': 'quiqqer/authfacebook',
                                    title    : Row.title,
                                    userId   : self.getAttribute('uid')
                                }
                            );
                        },
                        onClose : function () {
                            Popup.Loader.hide();
                        }
                    }
                });

                WarnPopup.open();
            };

            var Popup = new QUIConfirm({
                title             : QUILocale.get(lg, 'controls.settings.showkey.template.tableHeader', {
                    title: Row.title
                }),
                maxHeight         : 710,
                maxWidth          : 665,
                icon              : 'fa fa-key',	// {false|string} [optional] icon of the window
                backgroundClosable: true, // {bool} [optional] closes the window on click? standard = true

                // buttons
                buttons         : false, // {bool} [optional] show the bottom button line
                //closeButtonText : Locale.get('qui/controls/windows/Popup', 'btn.close'),
                titleCloseButton: true,  // {bool} show the title close button
                content         : false,
                events          : {
                    onOpen: function () {
                        var Content  = Popup.getContent();
                        var lgPrefix = 'controls.settings.showkey.template.';

                        Content.set(
                            'html',
                            Mustache.render(keyDataTemplate, {
                                key              : KeyData.key,
                                createUser       : KeyData.createUser,
                                createDate       : KeyData.createDate,
                                labelQrCode      : QUILocale.get(lg, lgPrefix + 'labelQrCode'),
                                labelKey         : QUILocale.get(lg, lgPrefix + 'labelKey'),
                                labelCreateUser  : QUILocale.get(lg, lgPrefix + 'labelCreateUser'),
                                labelCreateDate  : QUILocale.get(lg, lgPrefix + 'labelCreateDate'),
                                labelRecoveryKeys: QUILocale.get(lg, lgPrefix + 'labelRecoveryKeys')
                            })
                        );

                        // QR Code
                        new Element('img', {
                            src: KeyData.qrCode
                        }).inject(
                            Content.getElement(
                                '.quiqqer-auth-facebook-register-showkey-qrcode'
                            )
                        );

                        // Recovery keys
                        var RecoveryListElm = Content.getElement(
                            '.quiqqer-auth-facebook-register-showkey-recoverykeys ul'
                        );

                        for (var i = 0, len = KeyData.recoveryKeys.length; i < len; i++) {
                            var RecoveryKeyData = KeyData.recoveryKeys[i];

                            var LiElm = new Element('li').inject(RecoveryListElm);

                            var KeyTextElm = new Element('span', {
                                html: RecoveryKeyData.key
                            }).inject(LiElm);

                            if (RecoveryKeyData.used) {
                                KeyTextElm.setStyle('text-decoration', 'line-through');

                                new Element('span', {
                                    html: ' (' + RecoveryKeyData.usedDate + ')'
                                }).inject(LiElm);
                            }
                        }

                        // Re-generate recovery keys btn
                        new QUIButton({
                            textimage: 'fa fa-repeat',
                            text     : QUILocale.get(lg, 'controls.settings.showkey.regenerate.recoverykeys.btn'),
                            events   : {
                                onClick: FuncShowRegenerateWarning
                            }
                        }).inject(
                            Content.getElement(
                                '.quiqqer-auth-facebook-register-showkey-recoverykeys-regenerate-btn'
                            )
                        )
                    }
                }
            });

            this.Loader.show();

            QUIAjax.get(
                'package_quiqqer_authfacebook_ajax_getKey',
                function (Result) {
                    KeyData = Result;
                    Popup.open();
                    self.Loader.hide();
                }, {
                    'package': 'quiqqer/authfacebook',
                    title    : Row.title,
                    userId   : self.getAttribute('uid')
                }
            );
        }
        ,

        /**
         * Delete key(s)
         */
        $deleteKeys: function () {
            var self   = this;
            var data   = this.$Grid.getSelectedData();
            var titles = [];

            for (var i = 0, len = data.length; i < len; i++) {
                titles.push(data[i].title);
            }

            // open popup
            var Popup = new QUIConfirm({
                title             : QUILocale.get(
                    lg, 'controls.settings.deleteKeys.title'
                ),
                maxHeight         : 300,
                maxWidth          : 500,
                icon              : 'fa fa-trash',
                backgroundClosable: true,

                // buttons
                buttons         : true,
                titleCloseButton: true,
                content         : false,
                events          : {
                    onOpen  : function () {
                        Popup.getContent().set(
                            'html',
                            QUILocale.get(lg, 'controls.settings.deleteKeys.info', {
                                titles: titles.join('<br/>')
                            })
                        );
                    },
                    onSubmit: function () {
                        Popup.Loader.show();

                        QUIAjax.post(
                            'package_quiqqer_authfacebook_ajax_deleteKeys',
                            function (success) {
                                Popup.close();
                                self.refresh();
                            }, {
                                'package': 'quiqqer/authfacebook',
                                titles   : JSON.encode(titles),
                                userId   : self.getAttribute('uid')
                            }
                        )
                    }
                }
            });

            Popup.open();
        }
    })
        ;
})
;