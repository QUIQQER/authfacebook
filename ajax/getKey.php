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
 * @return array - key data
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getKey',
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
            $Google2FA = new Google2FA();
            $secrets   = json_decode($AuthUser->getAttribute('quiqqer.auth.google2fa.secrets'), true);

            if (!isset($secrets[$title])) {
                throw new QUI\Auth\Google2Fa\Exception(array(
                    'quiqqer/authfacebook',
                    'exception.ajax.getKey.title.not.found',
                    array(
                        'title'  => $title,
                        'user'   => $AuthUser->getUsername(),
                        'userId' => $AuthUser->getId()
                    )
                ));
            }

            $keyData['key']    = Security::decrypt($secrets[$title]['key']);
            $keyData['qrCode'] = $Google2FA->getQRCodeInline(
                $_SERVER['SERVER_NAME'],
                $AuthUser->getUsername(),
                $keyData['key']
            );

            $CreateUser            = QUI::getUsers()->get($secrets[$title]['createUserId']);
            $keyData['createUser'] = $CreateUser->getUsername() . ' (' . $CreateUser->getId() . ')';
            $keyData['createDate'] = $secrets[$title]['createDate'];

            $keyData['recoveryKeys'] = array();

            foreach ($secrets[$title]['recoveryKeys'] as $k => $recoveryKeyData) {
                $recoveryKeyData['key']    = trim(Security::decrypt($recoveryKeyData['key']));
                $keyData['recoveryKeys'][] = $recoveryKeyData;
            }
        } catch (QUI\Auth\Google2Fa\Exception $Exception) {
            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.getKey.error',
                    array(
                        'error' => $Exception->getMessage()
                    )
                )
            );

            return false;
        } catch (\Exception $Exception) {
            QUI\System\Log::addError(
                'AJAX :: package_quiqqer_authfacebook_ajax_getKey -> ' . $Exception->getMessage()
            );

            QUI::getMessagesHandler()->addError(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.ajax.general.error'
                )
            );

            return false;
        }

        return $keyData;
    },
    array('userId', 'title'),
    'Permission::checkAdminUser'
);
