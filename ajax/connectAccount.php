<?php

use QUI\Auth\Facebook\Facebook;
use QUI\Utils\Security\Orthos;

/**
 * Connect QUIQQER account with Facebook account
 *
 * @param int $userId - QUIQQER user id
 * @param array $fbAccountData - Facebook account data
 * @return bool - success
 *
 * @throws QUI\Permissions\Exception
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_connectAccount',
    function ($userId, $fbToken, $fbAccountData) {
        if ((int)QUI::getUserBySession()->getId() !== (int)$userId
            || !$userId) {
            throw new QUI\Permissions\Exception(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'exception.ajax.operation.only.allowed.by.own.user'
                ),
                401
            );
        }

        if (!Facebook::validateAccessToken($fbToken)) {
            // @todo Exception
        }

        $fbAccountData = Orthos::clearArray(json_decode($fbAccountData, true));

        \QUI\System\Log::writeRecursive($fbAccountData);

        try {

        } catch (QUI\Auth\Google2Fa\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.generateKey.error',
                    array(
                        'error' => $Exception->getMessage()
                    )
                )
            );

            return false;
        } catch (\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.general.error'
                )
            );

            return false;
        }

//        QUI::getMessagesHandler()->addSuccess(
//            QUI::getLocale()->get(
//                'quiqqer/authfacebook',
//                'message.ajax.generateKey.success',
//                array(
//                    'title' => $title
//                )
//            )
//        );

        return true;
    },
    array('userId', 'fbToken', 'fbAccountData'),
    'Permission::checkAdminUser'
);
