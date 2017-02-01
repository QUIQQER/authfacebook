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

    'controls/grid/Grid',
    'package/quiqqer/authfacebook/bin/Facebook',

    'Mustache',
    'Ajax',
    'Locale',

    //'css!package/quiqqer/authfacebook/bin/controls/Settings.css'

], function (QUIControl, QUIConfirm, QUIButton, QUILoader, Grid, Facebook, Mustache,
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

            this.Loader         = new QUILoader();
            this.$GridContainer = null;
            this.$Grid          = null;
        },

        /**
         * event on DOMElement creation
         */
        create: function () {
            var self = this;

            this.$Elm = new Element('div', {
                'class': 'quiqqer-auth-facebook-register'
            });

            this.Loader.inject(this.$Elm);

            // content
            this.$GridContainer = new Element('div', {
                'class': 'quiqqer-auth-facebook-register-grid-container'
            }).inject(this.$Elm);

            var GridContainer = new Element('div', {
                'class': 'quiqqer-auth-facebook-register-grid'
            }).inject(this.$GridContainer);

            this.$Grid = new Grid(GridContainer, {
                buttons          : [{
                    name     : 'add',
                    text     : QUILocale.get(lg, 'controls.settings.table.btn.add'),
                    textimage: 'fa fa-plus',
                    events   : {
                        onClick: self.$addAccount
                    }
                }, {
                    name     : 'delete',
                    text     : QUILocale.get(lg, 'controls.settings.table.btn.delete'),
                    textimage: 'fa fa-trash',
                    events   : {
                        onClick: self.$deleteAccount
                    }
                }],
                pagination       : false,
                serverSort       : false,
                multipleSelection: true,
                columnModel      : [{
                    header   : QUILocale.get(lg, 'controls.settings.table.header.account'),
                    dataIndex: 'account',
                    dataType : 'string',
                    width    : 150
                }, {
                    header   : QUILocale.get('quiqqer/system', 'createdate'),
                    dataIndex: 'created',
                    dataType : 'text',
                    width    : 250
                }]
            });

            this.$Grid.addEvents({
                //onDblClick: function () {
                //    self.$showKey(self.$Grid.selected[0]);
                //},
                onClick  : function () {
                    var TableButtons = self.$Grid.getAttribute('buttons');
                    TableButtons.delete.enable();
                },
                onRefresh: this.refresh
            });

            return this.$Elm;
        },

        /**
         * Event: onInject
         */
        $onInject: function () {
            this.resize();
            this.refresh();
        },

        /**
         * Event: onRefresh
         */
        $onRefresh: function () {
            this.refresh();
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
         * Refresh key list
         *
         * @return {Promise}
         */
        refresh: function () {
            var self = this;

            this.Loader.show();

            var TableButtons = self.$Grid.getAttribute('buttons');
            TableButtons.delete.disable();

            return new Promise(function (resolve, reject) {
                QUIAjax.get(
                    'package_quiqqer_authfacebook_ajax_getAccounts',
                    function (keys) {
                        self.$Grid.setData({
                            data : keys,
                            page : 1,
                            total: 1
                        });

                        self.Loader.hide();
                        resolve();
                    }, {
                        'package': 'quiqqer/authfacebook',
                        'userId' : self.getAttribute('uid'),
                        onError  : reject
                    }
                );
            });
        },

        /**
         * Generate a new google authenticator key
         */
        $addAccount: function () {
            var self = this;

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
                    onOpen  : function () {
                        var Content = Popup.getContent();

                        Content.set(
                            'html',
                            '<div class="quiqqer-auth-facebook-settings-addaccount-info"></div>' +
                            '<div class="quiqqer-auth-facebook-settings-addaccount-btns"></div>'
                        );

                        Popup.Loader.show();

                        var infoText;
                        var BtnsElm = Content.getElement(
                            '.quiqqer-auth-facebook-settings-addaccount-btns'
                        );

                        Facebook.getStatus().then(function (status) {
                            switch (status) {
                                case 'connected':
                                    Facebook.getAuthData().then(function (authData) {
                                        console.log(authData);
                                    });
                                    break;

                                case 'not_authorized':
                                    infoText = QUILocale.get(
                                        lg,
                                        'controls.settings.addAccount.info.not_authorized'
                                    );

                                    Facebook.getLoginButton().inject(BtnsElm);
                                    break;

                                default:

                            }

                            Content.getElement(
                                '.quiqqer-auth-facebook-settings-addaccount-info'
                            ).set(
                                'html',
                                infoText
                            );

                            Popup.Loader.hide();
                        });

                        //var Input = Popup.getContent().getElement('input');
                        //Input.focus();
                        //
                        //Input.addEvents({
                        //    keyup: function (event) {
                        //        if (event.code === 13) {
                        //            Popup.submit();
                        //            Input.blur();
                        //        }
                        //    }
                        //});
                    },
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
        },

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
    });
});