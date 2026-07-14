<?php

namespace QUI\GDPR;

if (!interface_exists(CookieInterface::class)) {
    interface CookieInterface
    {
        public const COOKIE_CATEGORY_ESSENTIAL = 'essential';
        public const COOKIE_CATEGORY_MARKETING = 'marketing';
        public const COOKIE_CATEGORY_PREFERENCES = 'preferences';
        public const COOKIE_CATEGORY_STATISTICS = 'statistics';

        public function getCategory(): string;

        public function getOrigin(): string;

        public function getPurpose(): string;

        public function getLifetime(): string;

        public function getName(): string;
    }
}
