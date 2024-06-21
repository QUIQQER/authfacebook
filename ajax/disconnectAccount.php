<?php

/**
 * Disconnect QUIQQER account from Facebook account
 *
 * @param int $userId - QUIQQER user id
 * @return bool - success
 *
 * @throws QUI\Permissions\Exception
 */

use QUI\Auth\Facebook\Facebook;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_disconnectAccount',
    function ($userId) {
        try {
            Facebook::disconnectAccount($userId);
        } catch (QUI\Auth\Facebook\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.disconnectAccount.error',
                    [
                        'error' => $Exception->getMessage()
                    ]
                )
            );

            return false;
        } catch (Exception $Exception) {
            QUI\System\Log::addError(
                'AJAX :: package_quiqqer_authfacebook_ajax_disconnectAccount -> ' . $Exception->getMessage()
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
                'message.ajax.disconnectAccount.success',
                [
                    'qUserName' => QUI::getUsers()->get($userId)->getUsername(),
                    'qUserId' => $userId
                ]
            )
        );

        return true;
    },
    ['userId'],
    'Permission::checkAdminUser'
);
