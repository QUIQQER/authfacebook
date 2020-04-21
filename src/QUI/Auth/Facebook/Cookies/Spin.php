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
class Spin implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'spin';
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
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.spin.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return \sprintf(
            '%d %s',
            25,
            QUI::getLocale()->get('quiqqer/quiqqer', 'hours')
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
