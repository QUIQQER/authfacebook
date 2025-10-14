<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Database\Exception;
use QUI\Package\Package;

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
     * @throws Exception|QUI\Permissions\Exception|QUI\Exception
     */
    public static function onUserDelete(QUI\Interfaces\Users\User $User): void
    {
        // delete connected facebook account
        $connectedAccount = Facebook::getConnectedAccountByQuiqqerUserId($User->getUUID());

        if (!empty($connectedAccount)) {
            Facebook::disconnectAccount($User->getUUID(), false);
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

    public static function onQuiqqerMigrationV2(QUI\System\Console\Tools\MigrationV2 $Console): void
    {
        $Console->writeLn('- Migrate facebook auth');
        $table = QUI::getDBTableName(Facebook::TBL_ACCOUNTS);

        QUI::getDatabase()->execSQL(
            'ALTER TABLE `' . $table . '` CHANGE `userId` `userId` VARCHAR(50) NOT NULL;'
        );

        QUI\Utils\MigrationV1ToV2::migrateUsers(
            $table,
            ['userId'],
            'userId'
        );
    }
}
