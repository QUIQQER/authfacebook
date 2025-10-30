<?php

namespace QUI\Auth\Facebook;

use QUI\Auth\Facebook\Cookies\Act;
use QUI\Auth\Facebook\Cookies\CUser;
use QUI\Auth\Facebook\Cookies\Datr;
use QUI\Auth\Facebook\Cookies\Fblo;
use QUI\Auth\Facebook\Cookies\Fbm;
use QUI\Auth\Facebook\Cookies\Fbp;
use QUI\Auth\Facebook\Cookies\Fr;
use QUI\Auth\Facebook\Cookies\Sb;
use QUI\Auth\Facebook\Cookies\Spin;
use QUI\Auth\Facebook\Cookies\Wd;
use QUI\Auth\Facebook\Cookies\Xs;
use QUI\GDPR\CookieCollection;
use QUI\GDPR\CookieProviderInterface;

/**
 * Class QuiqqerCookieProvider
 *
 * @package QUI\GDPR
 */
class CookieProvider implements CookieProviderInterface
{
    public static function getCookies(): CookieCollection
    {
        return new CookieCollection([
            new Act(),
            new CUser(),
            new Datr(),
            new Fblo(),
            new Fbm(),
            new Fbp(),
            new Fr(),
            new Sb(),
            new Spin(),
            new Wd(),
            new Xs()
        ]);
    }
}
