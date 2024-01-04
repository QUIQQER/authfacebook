<?php

/**
 * Get Facebook API credentials
 *
 * @return string - App-ID
 */

use QUI\Auth\Facebook\Facebook;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getApiCredentials',
    function () {
        return [
            'appId' => Facebook::getAppId(),
            'apiVersion' => Facebook::getApiVersion()
        ];
    }
);
