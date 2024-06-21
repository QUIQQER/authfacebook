<?php

/**
 * This file contains
 */

namespace QUI\Auth\Facebook\Controls;

use QUI\Control;

/**
 * Class Register
 *
 * Facebook Settings Control
 *
 * @package QUI\Auth\Facebook
 */
class Settings extends Control
{
    /**
     * @return string
     */
    public function getBody(): string
    {
        return '<div class="quiqqer-auth-facebook-settings"     
                  data-qui="package/quiqqer/authfacebook/bin/controls/Settings">
            </div>';
    }
}
