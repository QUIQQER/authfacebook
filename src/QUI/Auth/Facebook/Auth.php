<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Users\AbstractAuthenticator;
use QUI\Users\User;
use QUI\Auth\Facebook\Exception as FacebookException;
use QUI\Security;
use QUI\Auth\Facebook\Facebook;

/**
 * Class Auth
 *
 * Authentication handler for Google Authenticator
 *
 * @package QUI\Authe\Google2Fa
 */
class Auth extends AbstractAuthenticator
{
    /**
     * User that is to be authenticated
     *
     * @var User
     */
    protected $User = null;

    /**
     * Auth Constructor.
     *
     * @param string|array|integer $user - name of the user, or user id
     *
     * @throws QUI\Auth\Google2Fa\Exception
     */
    public function __construct($user = '')
    {
        if (!empty($user)) {
            $this->User = QUI::getUsers()->getUserByName($user);
        }
    }

    /**
     * @param null|\QUI\Locale $Locale
     * @return string
     */
    public function getTitle($Locale = null)
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'authfacebook.title');
    }

    /**
     * @param null|\QUI\Locale $Locale
     * @return string
     */
    public function getDescription($Locale = null)
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'authfacebook.description');
    }

    /**
     * Authenticate the user
     *
     * @param string|array|integer $authData
     *
     * @throws QUI\Auth\Facebook\Exception
     */
    public function auth($authData)
    {
        if (!is_array($authData)
            || !isset($authData['token'])
        ) {
            throw new FacebookException(array(
                'quiqqer/authfacebook',
                'exception.auth.wrong.data'
            ), 401);
        }

        $token = $authData['token'];

        try {
            Facebook::validateAccessToken($token);
        } catch (FacebookException $Exception) {
            throw new FacebookException(array(
                'quiqqer/authfacebook',
                'exception.auth.wrong.data'
            ), 401);
        }

        $fbProfile         = Facebook::getProfileData($token);
        $connectionProfile = Facebook::getConnectedAccountByFacebookUserId($fbProfile['id']);

        if (empty($connectionProfile)) {
            throw new FacebookException(array(
                'quiqqer/authfacebook',
                'exception.auth.no.account.connected'
            ), 1001);
        }

        // if there is no user set, Facebook is used as primary login
        // and Login user is the user connected to the facebook profile
        // used in the login process.
        if (is_null($this->User)) {
            $this->User = QUI::getUsers()->get($connectionProfile['userId']);
        }

        if ((int)$connectionProfile['userId'] !== (int)$this->User->getId()) {
            throw new FacebookException(array(
                'quiqqer/authfacebook',
                'exception.auth.wrong.account.for.user'
            ), 401);
        }
    }

    /**
     * Return the user object
     *
     * @return \QUI\Interfaces\Users\User
     */
    public function getUser()
    {
        return $this->User;
    }

    /**
     * Return the quiqqer user id
     *
     * @return integer|boolean
     */
    public function getUserId()
    {
        return $this->User->getId();
    }

    /**
     * @return \QUI\Control
     */
    public static function getLoginControl()
    {
        return new QUI\Auth\Facebook\Controls\Login();
    }

    /**
     * @return \QUI\Control
     */
    public static function getRegisterControl()
    {
        return new QUI\Auth\Facebook\Controls\Register();
    }

    /**
     * @return \QUI\Control
     */
    public static function getSettingsControl()
    {
        return new QUI\Auth\Facebook\Controls\Settings();
    }

    /**
     * @return \QUI\Control
     */
    public static function getPasswordResetControl()
    {
        return null;
    }
}
