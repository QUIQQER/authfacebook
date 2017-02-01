<?php

/**
 * This file contains
 */
namespace QUI\Auth\Facebook\Controls;

use QUI;
use QUI\Control;

/**
 * Class QUIQQERLogin
 *
 * @package QUI
 */
class Settings extends Control
{
    /**
     * @return string
     */
    public function getBody()
    {
        return '<div class="quiqqer-auth-facebook-settings"     
                  data-qui="package/quiqqer/authfacebook/bin/controls/Settings">
            </div>';
    }
}
