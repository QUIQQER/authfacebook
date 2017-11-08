<?php

use QUI\Auth\Facebook\Facebook;

/**
 * Check if a facebook account is connected to a QUIQQER user account
 *
 * @param int $fbToken - Facebook API token
 * @return array|false - Details to connected Facebook account
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_isFacebookAccountConnected',
    function ($fbToken) {
        return Facebook::existsQuiqqerAccount($fbToken);
    },
    array('fbToken')
);
