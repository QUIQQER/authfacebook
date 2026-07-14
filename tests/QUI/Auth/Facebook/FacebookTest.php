<?php

namespace QUITests\Auth\Facebook;

use League\OAuth2\Client\Token\AccessToken;
use PHPUnit\Framework\TestCase;
use QUI;
use QUI\Auth\Facebook\Facebook;

class FacebookTest extends TestCase
{
    public function testTableReturnsResolvedDatabaseTableName(): void
    {
        $this->assertSame(
            QUI::getDBTableName(Facebook::TBL_ACCOUNTS),
            Facebook::table()
        );
    }

    public function testGetTokenReturnsAccessTokenWithGivenValue(): void
    {
        $Token = Facebook::getToken('test-token');

        $this->assertInstanceOf(AccessToken::class, $Token);
        $this->assertSame('test-token', $Token->getToken());
    }
}
