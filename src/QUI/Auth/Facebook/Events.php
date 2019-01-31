<?php

namespace QUI\Auth\Facebook;

/**
 * Class Events
 *
 * Main class for handling QUIQQER Events
 */
class Events
{
    /**
     * QUIQQER Event: onUserDelete
     *
     * @param \QUI\Users\User $User
     * @return void
     */
    public static function onUserDelete($User)
    {
        // delete connected facebook account
        $connectedAccount = Facebook::getConnectedAccountByQuiqqerUserId($User->getId());

        if (!empty($connectedAccount)) {
            Facebook::disconnectAccount($User->getId(), false);
        }
    }
}
