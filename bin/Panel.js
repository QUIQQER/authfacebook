/**
 * List of location categories and CRUD functions
 *
 * @module package/quiqqer/authfacebook/bin/Panel
 * @author www.pcsg.de (Patrick Müller)
 *
 * @require qui/controls/desktop/Panel
 * @require qui/controls/buttons/Seperator
 * @require qui/controls/buttons/Button
 * @require qui/controls/loader/Loader
 * @require qui/controls/windows/Popup
 * @require qui/controls/windows/Confirm
 * @require controls/grid/Grid
 * @requrie Ajax
 * @require Locale
 * @require css!package/quiqqer/authfacebook/bin/Panel.css
 */
define('package/quiqqer/authfacebook/bin/Panel', [

    'qui/controls/desktop/Panel',
    'package/quiqqer/authfacebook/bin/controls/FacebookLogin'

], function (QUIPanel, Settings) {
    "use strict";

    var lg = 'quiqqer/authfacebook';

    return new Class({

        Extends: QUIPanel,
        Type   : 'package/quiqqer/authfacebook/bin/Panel',

        Binds: [
            '$onInject',
            '$onCreate'
        ],

        initialize: function (options) {
            this.parent(options);

            this.addEvents({
                onRefresh: this.$onRefresh,
                onCreate : this.$onCreate,
                onResize : this.$onResize
            });
        },

        /**
         * event on DOMElement creation
         */
        $onCreate: function () {
            var self    = this,
                Content = this.getContent();

            new Settings().inject(Content);

            this.$Elm.setStyles({
                height: '100%',
                width : '100%'
            })
        },

        /**
         * event: onResize
         */
        $onResize: function () {
            //var size = this.$GridContainer.getSize();
            //
            //// workaround - force shows text on button bar buttons
            ////this.getButtonBar()
            ////    .getElm()
            ////    .getElement('.qui-toolbar-tabs')
            ////    .removeClass('qui-toolbar--mobile');
            //
            //this.$Grid.setHeight(size.y);
            //this.$Grid.resize();
        },

        /**
         * Refresh category list
         *
         * @return {Promise}
         */
        refresh: function () {
            //var self = this;
            //
            //this.Loader.show();
            //
            //return new Promise(function (resolve, reject) {
            //    QUIAjax.get('package_quiqqer_locationcategories_ajax_getList', function (categories) {
            //        self.$Grid.setData({
            //            data : categories,
            //            page : 1,
            //            total: 1
            //        });
            //
            //        self.Loader.hide();
            //        resolve();
            //    }, {
            //        'package': 'quiqqer/authfacebook',
            //        onError  : reject
            //    });
            //});
        }
    });
});