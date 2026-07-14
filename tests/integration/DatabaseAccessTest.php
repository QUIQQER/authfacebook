<?php

namespace QUITests\Auth\Facebook\Integration;

use PHPUnit\Framework\TestCase;
use QUI;
use QUI\Auth\Facebook\Facebook;
use Throwable;

class DatabaseAccessTest extends TestCase
{
    private ?string $userUuid = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!QUI::getSchemaManager()->tablesExist([Facebook::table()])) {
            self::markTestSkipped('The Facebook authentication database table is not installed.');
        }
    }

    protected function tearDown(): void
    {
        if ($this->userUuid !== null) {
            try {
                QUI::getDataBaseConnection()->delete(
                    QUI\Utils\Doctrine::quoteIdentifier(Facebook::table()),
                    [QUI\Utils\Doctrine::quoteIdentifier('userId') => $this->userUuid]
                );

                QUI::getUsers()->deleteUser($this->userUuid);
            } catch (Throwable) {
            }
        }

        parent::tearDown();
    }

    public function testNumericUserIdLookupAndDisconnectUseStoredUuid(): void
    {
        $Users = QUI::getUsers();
        $SystemUser = $Users->getSystemUser();
        $suffix = bin2hex(random_bytes(8));
        $username = 'phpunit-authfacebook-' . $suffix;

        try {
            $User = $Users->createChildWithAttributes([
                'username' => $username,
                'email' => $username . '@example.invalid',
                'firstname' => 'Facebook',
                'lastname' => 'DBAL'
            ], $SystemUser);
        } catch (Throwable $Exception) {
            self::markTestSkipped('No usable super-user fixture is available: ' . $Exception->getMessage());
        }

        $userId = $User->getId();

        if ($userId === false) {
            self::fail('The Facebook DBAL test user has no numeric ID.');
        }

        $this->userUuid = $User->getUUID();
        $facebookUserId = (string)random_int(1_000_000_000, 2_000_000_000);

        QUI::getDataBaseConnection()->insert(
            QUI\Utils\Doctrine::quoteIdentifier(Facebook::table()),
            [
                QUI\Utils\Doctrine::quoteIdentifier('userId') => $this->userUuid,
                QUI\Utils\Doctrine::quoteIdentifier('fbUserId') => $facebookUserId,
                QUI\Utils\Doctrine::quoteIdentifier('email') => $username . '@example.invalid',
                QUI\Utils\Doctrine::quoteIdentifier('name') => 'Facebook DBAL'
            ]
        );

        $account = Facebook::getConnectedAccountByQuiqqerUserId($userId);

        self::assertIsArray($account);
        self::assertSame($this->userUuid, $account['userId'] ?? null);
        self::assertSame($facebookUserId, (string)($account['fbUserId'] ?? ''));

        Facebook::disconnectAccount($userId, false);

        self::assertFalse(Facebook::getConnectedAccountByQuiqqerUserId($userId));
    }
}
