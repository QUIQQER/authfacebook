<?php

use QUI;
use PragmaRX\Google2FA\Google2FA;
use QUI\Utils\Security\Orthos;
use QUI\Security;
use QUI\Auth\Google2Fa\Auth;

/**
 * Create new google authenticator key for a user
 *
 * @param string $title - key title
 * @return bool - success
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_addAccount',
    function ($userId, $title) {
        $Users       = QUI::getUsers();
        $SessionUser = QUI::getUserBySession();
        $AuthUser    = $Users->get((int)$userId);
        $title       = Orthos::clear($title);

        if ($Users->isNobodyUser($SessionUser)) {
            throw new QUI\Permissions\Exception(
                QUI::getLocale()->get(
                    'quiqqer/system',
                    'exception.lib.user.no.edit.rights'
                )
            );
        }

        $SessionUser->checkEditPermission();

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

        QUI::getMessagesHandler()->addSuccess(
            QUI::getLocale()->get(
                'quiqqer/authfacebook',
                'message.ajax.generateKey.success',
                array(
                    'title' => $title
                )
            )
        );

        return true;
    },
    array('userId', 'title'),
    'Permission::checkAdminUser'
);
