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
     */
    public function getBody()
    {
        $Engine = QUI::getTemplateManager()->getEngine();

        // Handle redirect form Facebook login
        if (!empty($_REQUEST['state']) && !empty($_REQUEST['code'])) {
            $csrfToken = QUI::getSession()->get('facebook_auth_csrf_token');

            if ($_REQUEST['state'] === $csrfToken) {
                $token = Facebook::getTokenFromAuthRedirectCode($_REQUEST['code']);

                if ($token) {
                    $connectionProfile = Facebook::getConnectedAccountByFacebookToken($token);

                    if (!$connectionProfile) {
                        // @todo user does not exist
                    }

                    $FBAuth = new FacebookAuth();
                    $FBAuth->auth(['token' => $token]);
                    $User = QUI::getUsers()->get($connectionProfile['userId']);

                    $Session = QUI::getSession();
                    $Session->set('uid', $User->getId());
                    $Session->set('username', $User->getUsername());
                    $Session->set('auth-globals', 1);
                    $Session->set('auth-'.get_class($FBAuth), 1);

                    QUI::getUsers()->login();

                    header('Location: ' . Facebook::getRedirectURL());
                    exit;
                }
            }
        }

        $isRedirectAuthenticationEnabled = Facebook::isRedirectAuthenticationEnabled();
        $authUrl                         = Facebook::getAuthUrl();

        if (!$authUrl) {
            $isRedirectAuthenticationEnabled = false;
        }

        \QUI\System\Log::writeRecursive($isRedirectAuthenticationEnabled);
        \QUI\System\Log::writeRecursive($authUrl);

        $Engine->assign([
            'isRedirectAuthenticationEnabled' => $isRedirectAuthenticationEnabled,
            'authUrl'                         => $authUrl
        ]);

        return $Engine->fetch(dirname(__FILE__).'/Login.html');
    }
}
