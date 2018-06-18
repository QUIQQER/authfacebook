<?php

/**
 * This file contains QUI\Auth\Google2Fa\Controls\Login
 */

namespace QUI\Auth\Facebook\Controls;

use QUI;
use QUI\Control;
use QUI\Auth\Facebook\Facebook;
use QUI\Auth\Facebook\Auth as FacebookAuth;

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

        $this->addCSSFile(dirname(__FILE__).'/Login.css');
    }

    /**
     * @return string
     * @throws \QUI\Exception
     */
    public function getBody()
    {
        $Engine                          = QUI::getTemplateManager()->getEngine();
        $isRedirectAuthenticationEnabled = Facebook::isRedirectAuthenticationEnabled();
        $authUrl                         = Facebook::getAuthUrl();

        if (!$authUrl) {
            $isRedirectAuthenticationEnabled = false;
        }

        $Engine->assign([
            'isRedirectAuthenticationEnabled' => $isRedirectAuthenticationEnabled,
            'authUrl'                         => $authUrl
        ]);

        return $Engine->fetch(dirname(__FILE__).'/Login.html');
    }
}
