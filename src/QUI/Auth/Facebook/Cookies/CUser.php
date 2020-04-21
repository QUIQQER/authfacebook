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
class CUser implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'c_user';
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
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.cuser.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return \sprintf(
            '%d %s',
            90,
            QUI::getLocale()->get('quiqqer/quiqqer', 'days')
        );
    }

    /**
     * @inheritDoc
     */
    public function getCategory(): string
    {
        return static::COOKIE_CATEGORY_ESSENTIAL;
    }
}
