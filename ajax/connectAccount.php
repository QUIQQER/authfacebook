<?php

use QUI\Auth\Facebook\Facebook;

/**
 * Connect QUIQQER account with Facebook account
 *
 * @param int $userId - QUIQQER user id
 * @param array $fbAccountData - Facebook account data
 * @return array - connection account data
 *
 * @throws QUI\Permissions\Exception
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_connectAccount',
    function ($userId, $fbToken) {
        $userId = (int)$userId;

        try {
            Facebook::connectQuiqqerAccount($userId, $fbToken);
            $accountData = Facebook::getConnectedAccountByQuiqqerUserId($userId);
        } catch (QUI\Auth\Facebook\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.connectAccount.error',
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

        QUI::getMessagesHandler()->addSuccess(
            QUI::getLocale()->get(
                'quiqqer/authfacebook',
                'message.ajax.connectAccount.success',
                array(
                    'fbAccount' => $accountData['name'] . ' (' . $accountData['email'] . ')',
                    'qUserName' => QUI::getUsers()->get($accountData['userId'])->getUsername(),
                    'qUserId'   => $accountData['userId']
                )
            )
        );

        return $accountData;
    },
    array('userId', 'fbToken')
);
