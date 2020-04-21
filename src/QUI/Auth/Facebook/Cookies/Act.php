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
class Act implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'act';
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
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.act.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return QUI::getLocale()->get('quiqqer/gdpr', 'cookie.lifetime.session');
    }

    /**
     * @inheritDoc
     */
    public function getCategory(): string
    {
        return static::COOKIE_CATEGORY_ESSENTIAL;
    }
}
