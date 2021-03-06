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
class Sb implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'sb';
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
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.sb.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return \sprintf(
            '%d %s',
            2,
            QUI::getLocale()->get('quiqqer/quiqqer', 'years')
        );
    }

    /**
     * @inheritDoc
     */
    public function getCategory(): string
    {
        return static::COOKIE_CATEGORY_MARKETING;
    }
}
