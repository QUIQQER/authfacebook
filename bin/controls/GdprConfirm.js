/**
 * Popup telling the user to accept cookies in order to use Facebook.
 *
 * @module package/quiqqer/authfacebook/bin/controls/GdprConfirm
 * @author www.pcsg.de (Jan Wennrich)
 */
define('package/quiqqer/authfacebook/bin/controls/GdprConfirm', [

    'qui/controls/windows/Confirm',

    'Locale'

], function (QUIConfirm, QUILocale) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIConfirm,
        Type   : 'package/quiqqer/authfacebook/bin/controls/GdprConfirm',

        Binds: [
            '$onImport'
        ],

        options: {
            information: QUILocale.get(lg, 'controls.frontend.registrar.gdpr.confirm.content'),
            title      : false,
            icon       : false,
            texticon   : false
        },

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onSubmit: this.$onSubmit
            });
        },

        $onSubmit: function () {
            require(['package/quiqqer/gdpr/bin/CookieManager'], function (CookieManager) {
                CookieManager.revokeCookies(true);
            });
        }
    });
});
