<?php

namespace QUI\Auth\Facebook;

use QUI;
use PragmaRX\Google2FA\Google2FA;
use QUI\Users\AuthInterface;
use QUI\Users\User;
use QUI\Auth\Google2Fa\Exception as Google2FaException;
use QUI\Security;

/**
 * Class Auth
 *
 * Authentication handler for Google Authenticator
 *
 * @package QUI\Authe\Google2Fa
 */
class Auth implements AuthInterface
{
    /**
     * Google2FA class
     *
     * @var Google2FA
     */
    protected $Google2FA = null;

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
        $this->User      = QUI::getUsers()->getUserByName($user);
        $this->Google2FA = new Google2FA();
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

        return $Locale->get('quiqqer/authgoogle2fa', 'google2fa.title');
    }

    /**
     * Authenticate the user
     *
     * @param string|array|integer $authData
     *
     * @throws QUI\Auth\Google2Fa\Exception
     */
    public function auth($authData)
    {
        if (!is_array($authData)
            || !isset($authData['code'])
        ) {
            throw new Google2FaException(array(
                'quiqqer/authgoogle2fa',
                'exception.auth.wrong.auth.code'
            ));
        }

        $authCode    = $authData['code'];
        $authSecrets = json_decode($this->User->getAttribute('quiqqer.auth.google2fa.secrets'), true);

        // if no secret keys have been generated -> automatically authenticate the user
        if (empty($authSecrets)) {
            return;
        }

        foreach ($authSecrets as $k => $secretData) {
            $key = trim(Security::decrypt($secretData['key']));

            if ($this->Google2FA->verifyKey($key, $authCode)) {
                return;
            }

            // if key did not work check for recovery keys
            foreach ($secretData['recoveryKeys'] as $k2 => $recoveryKeyData) {
                if ($recoveryKeyData['used']) {
                    continue;
                }

                $recoveryKey = trim(Security::decrypt($recoveryKeyData['key']));

                if ($recoveryKey != $authCode) {
                    continue;
                }

                // set used status of recovery key to true
                $recoveryKeyData['used']     = true;
                $recoveryKeyData['usedDate'] = date('Y-m-d H:i:s');

                $secretData['recoveryKeys'][$k2] = $recoveryKeyData;
                $authSecrets[$k]                 = $secretData;

                $this->User->setAttribute('quiqqer.auth.google2fa.secrets', json_encode($authSecrets));
                $this->User->save(QUI::getUsers()->getSystemUser());

                return;
            }
        }

        throw new Google2FaException(array(
            'quiqqer/authgoogle2fa',
            'exception.auth.wrong.auth.code'
        ));
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
     * Generate 16-bit (encrypted) recovery keys as alternative logins
     *
     * @param int $count (optional) - number of key [default: 10]
     * @return array
     */
    public static function generateRecoveryKeys($count = 10)
    {
        $recoveryKeys = array();
        $Google2FA    = new Google2FA();

        for ($i = 0; $i < $count; $i++) {
            $recoveryKeys[] = array(
                'key'      => Security::encrypt(md5($Google2FA->generateSecretKey(16))),
                'used'     => false,
                'usedDate' => false
            );
        }

        return $recoveryKeys;
    }

    /**
     * @return \QUI\Control
     */
    public static function getLoginControl()
    {
        return new QUI\Auth\Google2Fa\Controls\Login();
    }

    /**
     * @return \QUI\Control
     */
    public static function getRegisterControl()
    {
        return null;
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
