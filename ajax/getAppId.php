<?php

use QUI\Auth\Facebook\Facebook;

/**
 * Get Facebook API App-ID from config
 *
 * @return string - App-ID
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getAppId',
    function () {
        return Facebook::getAppId();
    }
);
