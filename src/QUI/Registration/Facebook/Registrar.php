<?php

/**
 * This file contains QUI\Registration\Facebook\Registrar
 */

namespace QUI\Registration\Facebook;

use QUI;
use QUI\Auth\Facebook\Facebook;
use QUI\Database\Exception;
use QUI\ExceptionStack;
use QUI\FrontendUsers;
use QUI\FrontendUsers\Handler as FrontendUsersHandler;
use QUI\FrontendUsers\InvalidFormField;
use QUI\Interfaces\Users\User;

/**
 * Class Registrar
 *
 * Registration via Facebook account
 *
 * @package QUI\Registration\Facebook
 */
class Registrar extends FrontendUsers\AbstractRegistrar
{
    /**
     * Registrar constructor.
     */
    public function __construct()
    {
        $this->setAttribute('icon-css-class', 'facebook-registrar');
    }

    /**
     * @param User $User
     * @return void
     *
     * @throws Exception
     * @throws QUI\Exception
     * @throws ExceptionStack
     * @throws QUI\Permissions\Exception
     */
    public function onRegistered(QUI\Interfaces\Users\User $User): void
    {
        $SystemUser = QUI::getUsers()->getSystemUser();
        $token = Facebook::getToken($this->getAttribute('token'));

        // set user data
        $profileData = Facebook::getProfileData($token);

        $User->setAttributes([
            'email' => $profileData['email'],
            'firstname' => empty($profileData['first_name']) ? null : $profileData['first_name'],
            'lastname' => empty($profileData['last_name']) ? null : $profileData['last_name'],
        ]);

        $User->setAttribute(FrontendUsersHandler::USER_ATTR_EMAIL_VERIFIED, true);

        $User->setPassword(QUI\Security\Password::generateRandom(), $SystemUser);
        $User->save($SystemUser);

        // connect Facebook account with QUIQQER account
        Facebook::connectQuiqqerAccount($User->getUUID(), $token, false);
    }

    /**
     * Return the success message
     * @return string
     */
    public function getSuccessMessage(): string
    {
        $registrarSettings = $this->getSettings();

        switch ($registrarSettings['activationMode']) {
            case FrontendUsers\Handler::ACTIVATION_MODE_MANUAL:
                $msg = QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.registrar.registration_success_manual'
                );
                break;

            case FrontendUsers\Handler::ACTIVATION_MODE_AUTO:
                $msg = QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.registrar.registration_success_auto'
                );
                break;

            case FrontendUsers\Handler::ACTIVATION_MODE_MAIL:
                $msg = QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'message.registrar.registration_success_mail'
                );
                break;

            default:
                return parent::getPendingMessage();
        }

        return $msg;
    }

    /**
     * Return pending message
     * @return string
     */
    public function getPendingMessage(): string
    {
        return QUI::getLocale()->get(
            'quiqqer/authfacebook',
            'message.registrar.registration_pending'
        );
    }

    /**
     * @throws FrontendUsers\Exception|QUI\Auth\Facebook\Exception
     */
    public function validate(): array
    {
        $lg = 'quiqqer/authfacebook';
        $lgPrefix = 'exception.registrar.';

        $token = Facebook::getToken($this->getAttribute('token'));

        try {
            Facebook::validateAccessToken($token);
        } catch (\Throwable) {
            throw new FrontendUsers\Exception([
                $lg,
                $lgPrefix . 'token_invalid'
            ]);
        }

        $email = $this->getUsername();

        if (empty($email)) {
            throw new FrontendUsers\Exception([
                $lg,
                $lgPrefix . 'email_address_empty'
            ]);
        }

        if (QUI::getUsers()->usernameExists($email)) {
            throw new FrontendUsers\Exception([
                $lg,
                $lgPrefix . 'email_already_exists'
            ]);
        }

        return [];
    }

    /**
     * Get all invalid registration form fields
     *
     * @return InvalidFormField[]
     */
    public function getInvalidFields(): array
    {
        // Registration via Facebook account does not use form fields
        return [];
    }

    /**
     * @return string
     * @throws QUI\Auth\Facebook\Exception
     */
    public function getUsername(): string
    {
        $userData = Facebook::getProfileData(Facebook::getToken($this->getAttribute('token')));

        if (!empty($userData['email'])) {
            return $userData['email'];
        }

        return '';
    }

    /**
     * @return Control
     */
    public function getControl(): QUI\Control
    {
        return new Control();
    }

    /**
     * Get title
     *
     * @param QUI\Locale|null $Locale (optional) - If omitted use QUI::getLocale()
     * @return string
     */
    public function getTitle(null|QUI\Locale $Locale = null): string
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'registrar.title');
    }

    /**
     * Get description
     *
     * @param QUI\Locale|null $Locale (optional) - If omitted use QUI::getLocale()
     * @return string
     */
    public function getDescription(null|QUI\Locale $Locale = null): string
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'registrar.description');
    }

    /**
     * @return string
     */
    public function getIcon(): string
    {
        return 'fa fa-facebook';
    }

    /**
     * Get registration settings for this plugin
     *
     * @return array
     * @throws QUI\Exception
     */
    protected function getRegistrationSettings(): array
    {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->getSection('registration');
    }

    /**
     * Check if this Registrar can send passwords
     *
     * @return bool
     */
    public function canSendPassword(): bool
    {
        return true;
    }
}
