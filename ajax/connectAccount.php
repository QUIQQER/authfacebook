<?php

/**
 * Connect QUIQQER account with Facebook account
 *
 * @param int $userId - QUIQQER user id
 * @param array $fbAccountData - Facebook account data
 * @return array - connection account data
 *
 * @throws QUI\Permissions\Exception
 */

use QUI\Auth\Facebook\Facebook;
use QUI\Utils\Security\Orthos;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_connectAccount',
    function ($userId, $fbToken) {
        try {
            Facebook::connectQuiqqerAccount($userId, Facebook::getToken(Orthos::clear($fbToken)));
            $accountData = Facebook::getConnectedAccountByQuiqqerUserId($userId);
        } catch (QUI\Auth\Facebook\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.connectAccount.error',
                    [
                        'error' => $Exception->getMessage()
                    ]
                )
            );

            return false;
        } catch (Exception $Exception) {
            QUI\System\Log::addError(
                'AJAX :: package_quiqqer_authfacebook_ajax_connectAccount -> ' . $Exception->getMessage()
            );

            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.general.error'
                )
            );

            return false;
        }

        QUI::getMessagesHandler()->addSuccess(
            QUI::getLocale()->get(
                'quiqqer/authfacebook',
                'message.ajax.connectAccount.success',
                [
                    'fbAccount' => $accountData['name'] . ' (' . $accountData['email'] . ')',
                    'qUserName' => QUI::getUsers()->get($accountData['userId'])->getUsername(),
                    'qUserId' => $accountData['userId']
                ]
            )
        );

        return $accountData;
    },
    ['userId', 'fbToken']
);
