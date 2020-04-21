<?php

/**
 * @author PCSG (Jan Wennrich)
 */

namespace QUI\Auth\Facebook\Cookies;

use QUI;
use QUI\GDPR\CookieInterface;

/**
 * Class QuiqqerSessionCookie
 *
 * @package QUI\GDPR\Cookies
 */
class Wd implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'wd';
    }

    /**
     * @inheritDoc
     */
    public function getOrigin(): string
    {
        return '.facebook.com';
    }

    /**
     * @inheritDoc
     */
    public function getPurpose(): string
    {
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.wd.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return \sprintf(
            '%d %s',
            7,
            QUI::getLocale()->get('quiqqer/quiqqer', 'days')
        );
    }

    /**
     * @inheritDoc
     */
    public function getCategory(): string
    {
        return static::COOKIE_CATEGORY_STATISTICS;
    }
}
