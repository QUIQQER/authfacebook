<?php

use QUI\Auth\Facebook\Facebook;

/**
 * Get Facebook API credentials
 *
 * @return string - App-ID
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getApiCredentials',
    function () {
        return array(
            'appId'      => Facebook::getAppId(),
            'apiVersion' => Facebook::getApiVersion()
        );
    }
);
