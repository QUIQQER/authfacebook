<?php

/**
 * Check if a facebook account is connected to a QUIQQER user account
 *
 * @param int $fbToken - Facebook API token
 * @return array|false - Details to connected Facebook account
 */

use QUI\Auth\Facebook\Facebook;
use QUI\Utils\Security\Orthos;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_isFacebookAccountConnected',
    function ($fbToken) {
        try {
            return Facebook::existsQuiqqerAccount(Facebook::getToken(Orthos::clear($fbToken)));
        } catch (Exception $Exception) {
            QUI\System\Log::writeException($Exception);

            throw new QUI\Exception([
                'quiqqer/authfacebook',
                'message.ajax.general.error'
            ]);
        }
    },
    ['fbToken']
);
