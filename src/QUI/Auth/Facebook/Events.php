<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Database\Exception;
use QUI\Package\Package;
use QUI\Users\User;

use function ltrim;
use function str_replace;

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
     * @param QUI\Interfaces\Users\User $User
     * @return void
     * @throws Exception|QUI\Permissions\Exception
     */
    public static function onUserDelete(QUI\Interfaces\Users\User $User): void
    {
        // delete connected facebook account
        $connectedAccount = Facebook::getConnectedAccountByQuiqqerUserId($User->getId());

        if (!empty($connectedAccount)) {
            Facebook::disconnectAccount($User->getId(), false);
        }
    }

    /**
     * quiqqer/quiqqer: onPackageSetup
     *
     * @param Package $Package
     * @return void
     * @throws QUI\Exception
     */
    public static function onPackageSetup(Package $Package): void
    {
        if ($Package->getName() !== 'quiqqer/authfacebook') {
            return;
        }

        $currentApiVersion = Facebook::getApiVersion();

        if (!empty($currentApiVersion)) {
            $currentApiVersion = (int)ltrim(str_replace('.', '', $currentApiVersion), 'v');
        } else {
            $currentApiVersion = 1;
        }

        if ($currentApiVersion < 100) {
            $Conf = QUI::getPackage('quiqqer/authfacebook')->getConfig();
            $Conf->setValue('apiSettings', 'apiVersion', 'v12.0');
            $Conf->save();
        }
    }
}
