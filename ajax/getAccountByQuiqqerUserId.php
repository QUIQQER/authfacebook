<?php

/**
 * Check if a facebook account is connected to a QUIQQER user account
 *
 * @param int $userId - QUIQQER User ID
 * @return array|false - Details to connected Facebook account
 */

use QUI\Auth\Facebook\Facebook;

QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_getAccountByQuiqqerUserId',
    function ($userId) {
        if (QUI::getSession()->get('uid') !== $userId) {
            throw new QUI\Permissions\Exception(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'exception.operation.only.allowed.by.own.user'
                ),
                401
            );
        }

        return Facebook::getConnectedAccountByQuiqqerUserId($userId);
    },
    ['userId']
);
