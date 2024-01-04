<?php

/**
 * This file contains QUI\Auth\Facebook\Controls\Login
 */

namespace QUI\Auth\Facebook\Controls;

use QUI;
use QUI\Control;

/**
 * Class Register
 *
 * Facebook Login Control
 *
 * @package QUI\Auth\Facebook
 */
class Login extends Control
{
    /**
     * Login constructor.
     *
     * @param array $attributes
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        $this->addCSSClass('quiqqer-facebook-login');
        $this->addCSSFile(dirname(__FILE__) . '/Login.css');
        $this->setAttribute('icon', 'fa fa-facebook');
    }

    /**
     * @return string
     */
    public function getBody()
    {
        try {
            $Engine = QUI::getTemplateManager()->getEngine();
        } catch (QUI\Exception $Exception) {
            return '';
        }

        return $Engine->fetch(dirname(__FILE__) . '/Login.html');
    }
}
