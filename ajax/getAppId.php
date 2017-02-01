<?php

/**
 * Get google authentication keys for a user
 *
 * @param string $title - key title
 * @return array - key data
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getAppId',
    function () {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'appId');
    }
);
