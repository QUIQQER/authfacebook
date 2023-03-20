<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Auth\Facebook\Exception as FacebookException;
use QUI\Users\AbstractAuthenticator;
use QUI\Users\User;
use function is_string;

/**
 * Class Auth
 *
 * Authentication handler for Facebook authentication
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
     */
    public function __construct($user = '')
    {
        if (!empty($user) && is_string($user)) {
            try {
                $this->User = QUI::getUsers()->getUserByName($user);
            } catch (\Exception $Exception) {
                $this->User = QUI::getUsers()->getNobody();
            }
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
            throw new FacebookException([
                'quiqqer/authfacebook',
                'exception.auth.wrong.data'
            ], 401);
        }

        $Token = Facebook::getToken($authData['token']);

        try {
            Facebook::validateAccessToken($Token);
        } catch (FacebookException $Exception) {
            throw new FacebookException([
                'quiqqer/authfacebook',
                'exception.auth.wrong.data'
            ], 401);
        }

        $connectionProfile = Facebook::getConnectedAccountByFacebookToken($Token);

        if (empty($connectionProfile)) {
            /**
             * Check if a user with the Facebook e-mail address already exists and if so
             * automatically connect it to the QUIQQER account.
             */
            $userData = Facebook::getProfileData($Token);
            $Users    = QUI::getUsers();

            if (!empty($userData['email']) && $Users->emailExists($userData['email'])) {
                try {
                    $User = $Users->getUserByMail($userData['email']);

                    Facebook::connectQuiqqerAccount($User->getId(), $Token, false);
                    $connectionProfile = Facebook::getConnectedAccountByFacebookToken($Token);
                } catch (\Exception $Exception) {
                    QUI\System\Log::writeException($Exception);

                    throw new FacebookException([
                        'quiqqer/authfacebook',
                        'exception.auth.no.account.connected'
                    ], 1001);
                }
            } else {
                throw new FacebookException([
                    'quiqqer/authfacebook',
                    'exception.auth.no.account.connected'
                ], 1001);
            }
        }

        // if there is no user set, Facebook is used as primary login
        // and Login user is the user connected to the facebook profile
        // used in the login process.
        if (is_null($this->User)) {
            $this->User = QUI::getUsers()->get($connectionProfile['userId']);
        }

        if ((int)$connectionProfile['userId'] !== (int)$this->User->getId()) {
            throw new FacebookException([
                'quiqqer/authfacebook',
                'exception.auth.wrong.account.for.user'
            ], 401);
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
