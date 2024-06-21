<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Auth\Facebook\Exception as FacebookException;
use QUI\Control;
use QUI\Database\Exception;
use QUI\ExceptionStack;
use QUI\Locale;
use QUI\Users\AbstractAuthenticator;

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
     */
    protected QUI\Interfaces\Users\User|null $User = null;

    /**
     * Auth Constructor.
     *
     * @param array|integer|string $user - name of the user, or user id
     */
    public function __construct(array|int|string $user = '')
    {
        if (!empty($user) && is_string($user)) {
            try {
                $this->User = QUI::getUsers()->getUserByName($user);
            } catch (\Exception) {
                $this->User = QUI::getUsers()->getNobody();
            }
        }
    }

    /**
     * @param null|Locale $Locale
     * @return string
     */
    public function getTitle(Locale $Locale = null): string
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'authfacebook.title');
    }

    /**
     * @param null|Locale $Locale
     * @return string
     */
    public function getDescription(Locale $Locale = null): string
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'authfacebook.description');
    }

    /**
     * Authenticate the user
     *
     * @param array|integer|string $authParams
     *
     * @throws Exception
     * @throws Exception
     * @throws QUI\Exception
     * @throws ExceptionStack
     */
    public function auth(array|int|string $authParams): void
    {
        if (
            !is_array($authParams)
            || !isset($authParams['token'])
        ) {
            throw new FacebookException([
                'quiqqer/authfacebook',
                'exception.auth.wrong.data'
            ], 401);
        }

        $Token = Facebook::getToken($authParams['token']);

        try {
            Facebook::validateAccessToken($Token);
        } catch (FacebookException) {
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
            $Users = QUI::getUsers();

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
     * @return QUI\Interfaces\Users\User
     */
    public function getUser(): QUI\Interfaces\Users\User
    {
        return $this->User;
    }

    /**
     * Return the quiqqer user id
     */
    public function getUserId(): int
    {
        return $this->User->getId();
    }

    public function getUserUUID(): string
    {
        return $this->User->getUUID();
    }

    /**
     * @return Control|null
     */
    public static function getLoginControl(): ?Control
    {
        return new QUI\Auth\Facebook\Controls\Login();
    }

    /**
     * @return Control|null
     */
    public static function getSettingsControl(): ?Control
    {
        return new QUI\Auth\Facebook\Controls\Settings();
    }

    /**
     * @return Control|null
     */
    public static function getPasswordResetControl(): ?Control
    {
        return null;
    }
}
