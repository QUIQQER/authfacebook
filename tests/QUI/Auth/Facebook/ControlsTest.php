<?php

namespace QUITests\Auth\Facebook;

use PHPUnit\Framework\TestCase;
use QUI\Auth\Facebook\Controls\Register;
use QUI\Auth\Facebook\Controls\Settings;

class ControlsTest extends TestCase
{
    public function testSettingsControlRendersExpectedMarkup(): void
    {
        $Control = new Settings();
        $body = $Control->getBody();

        $this->assertStringContainsString('quiqqer-auth-facebook-settings', $body);
        $this->assertStringContainsString('package/quiqqer/authfacebook/bin/controls/Settings', $body);
    }

    public function testRegisterControlRendersExpectedMarkup(): void
    {
        $Control = new Register();
        $body = $Control->getBody();

        $this->assertStringContainsString('quiqqer-auth-facebook-register', $body);
        $this->assertStringContainsString('package/quiqqer/authfacebook/bin/controls/Register', $body);
    }
}
