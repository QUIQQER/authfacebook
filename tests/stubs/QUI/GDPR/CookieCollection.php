<?php

namespace QUI\GDPR;

if (!class_exists(CookieCollection::class)) {
    class CookieCollection
    {
        /**
         * @param array<int, CookieInterface> $cookies
         */
        public function __construct(private array $cookies)
        {
        }

        /**
         * @return array<int, CookieInterface>
         */
        public function toArray(): array
        {
            return $this->cookies;
        }
    }
}
