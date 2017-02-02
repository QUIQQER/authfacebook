<?php

/**
 * Check if the user who edits another user is the session user
 *
 * @param int $userId - Edit User ID
 * @return bool
 */
QUI::$Ajax->registerFunction(
    'package_quiqqer_authfacebook_ajax_isEditUserSessionUser',
    function ($userId) {
        return (int)QUI::getUserBySession()->getId() === (int)$userId;
    },
    array('userId'),
    'Permission::checkAdminUser'
);
