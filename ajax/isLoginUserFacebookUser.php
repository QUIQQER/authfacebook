<?php

/**
 * Check if the user that logs in via facebook is the login User
 *
 * @return bool
 */

use QUI\Auth\Facebook\Facebook;
use QUI\Utils\Security\Orthos;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_isLoginUserFacebookUser',
    function ($fbToken) {
        $loginUserId = QUI::getSession()->get('uid');

        if (!$loginUserId) {
            return false;
        }

        try {
            $profileData = Facebook::getProfileData(Facebook::getToken(Orthos::clear($fbToken)));
            $accountData = Facebook::getConnectedAccountByQuiqqerUserId($loginUserId);
        } catch (Exception $Exception) {
            QUI\System\Log::writeException($Exception);
            return false;
        }

        if (!$accountData) {
            return false;
        }

        if (!isset($profileData['id'])) {
            return false;
        }

        return (int)$profileData['id'] === (int)$accountData['fbUserId'];
    },
    ['fbToken']
);
