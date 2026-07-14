<?php

namespace QUI\GDPR;

if (!interface_exists(CookieProviderInterface::class)) {
    interface CookieProviderInterface
    {
        public static function getCookies(): CookieCollection;
    }
}
