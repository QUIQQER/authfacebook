<?php

use QUI\Utils\Security\Orthos;

/**
 * Create new google authenticator key for a user
 *
 * @param array $titles - titles of the keys that should be deleted
 * @return bool - success
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_deleteKeys',
    function ($userId, $titles) {
        $Users       = QUI::getUsers();
        $AuthUser    = $Users->get((int)$userId);
        $titles      = Orthos::clearArray(json_decode($titles, true));
        $SessionUser = QUI::getUserBySession();

        // @todo Check user edit permission of session user
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
            $secrets = json_decode($AuthUser->getAttribute('quiqqer.auth.google2fa.secrets'), true);

            foreach ($titles as $title) {
                if (isset($secrets[$title])) {
                    unset($secrets[$title]);
                }
            }

            $AuthUser->setAttribute(
                'quiqqer.auth.google2fa.secrets',
                json_encode($secrets)
            );

            $AuthUser->save();
        } catch (QUI\Auth\Google2Fa\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.deleteKeys.error',
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
                'message.ajax.deleteKeys.success'
            )
        );

        return true;
    },
    array('userId', 'titles'),
    'Permission::checkAdminUser'
);
