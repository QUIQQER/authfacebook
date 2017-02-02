<?php

use QUI\Auth\Facebook\Facebook;

/**
 * Check if a facebook account is connected to a QUIQQER user account
 *
 * @param int $userId - QUIQQER User ID
 * @return array|false - Details to connected Facebook account
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getAccountByQuiqqerUserId',
    function ($userId) {
        $SessionUser = QUI::getUserBySession();

        if ($SessionUser->getId() !== $userId) {
            throw new QUI\Permissions\Exception(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'exception.ajax.operation.only.allowed.by.own.user'
                ),
                401
            );
        }

        return Facebook::getConnectedAccountByQuiqqerUserId($userId);
    },
    array('userId'),
    'Permission::checkAdminUser'
);
