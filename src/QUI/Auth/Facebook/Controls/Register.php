<?php

/**
 * This file contains
 */

namespace QUI\Auth\Facebook\Controls;

use QUI;
use QUI\Control;

/**
 * Class Register
 *
 * Facebook Registration Control
 *
 * @package QUI\Auth\Facebook
 */
class Register extends Control
{
    /**
     * @return string
     */
    public function getBody()
    {
        return '<div class="quiqqer-auth-facebook-register"     
                  data-qui="package/quiqqer/authfacebook/bin/controls/Register">
            </div>';
    }
}
