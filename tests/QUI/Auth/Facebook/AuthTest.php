<?php

namespace QUITests\Auth\Facebook;

use PHPUnit\Framework\TestCase;
use QUI\Auth\Facebook\Auth;
use QUI\Auth\Facebook\Controls\Login;
use QUI\Auth\Facebook\Controls\Settings;
use QUI\Interfaces\Users\User;

class AuthTest extends TestCase
{
    public function testConstructorAcceptsUserInstance(): void
    {
        $User = $this->createConfiguredMock(User::class, [
            'getId' => 12,
            'getUUID' => 'user-12'
        ]);

        $Auth = new Auth($User);

        $this->assertSame($User, $Auth->getUser());
        $this->assertSame(12, $Auth->getUserId());
        $this->assertSame('user-12', $Auth->getUserUUID());
    }

    public function testGetUserThrowsIfUserIsNotSet(): void
    {
        $Auth = new Auth();

        $this->expectException(\RuntimeException::class);

        $Auth->getUser();
    }

    public function testGetUserIdThrowsIfUnderlyingIdIsFalse(): void
    {
        $User = $this->createConfiguredMock(User::class, [
            'getId' => false,
            'getUUID' => 'user-12'
        ]);

        $Auth = new Auth($User);

        $this->expectException(\RuntimeException::class);

        $Auth->getUserId();
    }

    public function testGetUserUuidCastsScalarToString(): void
    {
        $User = $this->createConfiguredMock(User::class, [
            'getId' => 12,
            'getUUID' => 12345
        ]);

        $Auth = new Auth($User);

        $this->assertSame('12345', $Auth->getUserUUID());
    }

    public function testAuthenticatorMetadataAndControls(): void
    {
        $Auth = new Auth();

        $this->assertFalse($Auth->isSecondaryAuthentication());
        $this->assertSame('fa fa-brands fa-facebook', $Auth->getIcon());
        $this->assertInstanceOf(Login::class, Auth::getLoginControl());
        $this->assertInstanceOf(Settings::class, $Auth->getSettingsControl());
        $this->assertNull($Auth->getPasswordResetControl());
    }
}
