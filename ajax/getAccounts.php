<?php

/**
 * Get google authentication keys for a user
 *
 * @param string $title - key title
 * @return array - key data
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getAccounts',
    function ($userId) {
        $Users       = QUI::getUsers();
        $SessionUser = QUI::getUserBySession();
        $AuthUser    = $Users->get((int)$userId);

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
            return json_decode($AuthUser->getAttribute('quiqqer.auth.facebook.accounts'), true);
        } catch (QUI\Auth\Facebook\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.getAccounts.error',
                    array(
                        'error' => $Exception->getMessage()
                    )
                )
            );

            return false;
        } catch (\Exception $Exception) {
            QUI\System\Log::addError(
                'AJAX :: package_quiqqer_authfacebook_ajax_getAccounts -> ' . $Exception->getMessage()
            );

            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.general.error'
                )
            );

            return false;
        }
    },
    array('userId'),
    'Permission::checkAdminUser'
);
