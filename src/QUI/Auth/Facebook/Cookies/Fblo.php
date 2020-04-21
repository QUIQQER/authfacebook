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
class Fblo implements CookieInterface
{
    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return 'fblo_';
    }

    /**
     * @inheritDoc
     */
    public function getOrigin(): string
    {
        return QUI::getRequest()->getHost();
    }

    /**
     * @inheritDoc
     */
    public function getPurpose(): string
    {
        return QUI::getLocale()->get('quiqqer/authfacebook', 'cookie.fblo.purpose');
    }

    /**
     * @inheritDoc
     */
    public function getLifetime(): string
    {
        return \sprintf(
            '%d %s',
            6,
            QUI::getLocale()->get('quiqqer/quiqqer', 'months')
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
