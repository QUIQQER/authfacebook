<?php

/**
 * This file contains QUI\Registration\Facebook\Registrar
 */

namespace QUI\Registration\Facebook;

use QUI;
use QUI\FrontendUsers;
use QUI\FrontendUsers\InvalidFormField;
use QUI\Auth\Facebook\Facebook;
use QUI\FrontendUsers\Handler as FrontendUsersHandler;

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
     * @param QUI\Interfaces\Users\User $User
     * @return int
     */
    public function onRegistered(QUI\Interfaces\Users\User $User)
    {
        $Handler    = FrontendUsers\Handler::getInstance();
        $settings   = $Handler->getRegistrarSettings($this->getType());
        $SystemUser = QUI::getUsers()->getSystemUser();
        $token      = $this->getAttribute('token');

        // set user data
        $profileData = Facebook::getProfileData($token);

        $User->setAttributes(array(
            'email'     => $profileData['email'],
            'firstname' => empty($profileData['first_name']) ? null : $profileData['first_name'],
            'lastname'  => empty($profileData['last_name']) ? null : $profileData['last_name'],
        ));

        $User->setAttribute(FrontendUsersHandler::USER_ATTR_EMAIL_VERIFIED, boolval($profileData['verified']));

        $User->setPassword(QUI\Security\Password::generateRandom(), $SystemUser);
        $User->save($SystemUser);

        // connect Facebook account with QUIQQER account
        Facebook::connectQuiqqerAccount($User->getId(), $token, false);

        $returnStatus = $Handler::REGISTRATION_STATUS_SUCCESS;

        switch ($settings['activationMode']) {
            case $Handler::ACTIVATION_MODE_MAIL:
                $Handler->sendActivationMail($User, $this);
                $returnStatus = $Handler::REGISTRATION_STATUS_PENDING;
                break;

            case $Handler::ACTIVATION_MODE_AUTO:
                $User->activate(false, $SystemUser);
                break;
        }

        return $returnStatus;
    }

    /**
     * Return the success message
     * @return string
     */
    public function getSuccessMessage()
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
    public function getPendingMessage()
    {
        return QUI::getLocale()->get(
            'quiqqer/authfacebook',
            'message.registrar.registration_pending'
        );
    }

    /**
     * @throws FrontendUsers\Exception
     */
    public function validate()
    {
        $lg       = 'quiqqer/authfacebook';
        $lgPrefix = 'exception.registrar.';

        $token = $this->getAttribute('token');

        if (empty($token)) {
            throw new FrontendUsers\Exception(array(
                $lg,
                $lgPrefix . 'token_invalid'
            ));
        }

        try {
            Facebook::validateAccessToken($token);
        } catch (\Exception $Exception) {
            throw new FrontendUsers\Exception(array(
                $lg,
                $lgPrefix . 'token_invalid'
            ));
        }

        $email = $this->getUsername();

        if (empty($email)) {
            throw new FrontendUsers\Exception(array(
                $lg,
                $lgPrefix . 'email_address_empty'
            ));
        }

        if (QUI::getUsers()->usernameExists($email)) {
            throw new FrontendUsers\Exception(array(
                $lg,
                $lgPrefix . 'email_already_exists'
            ));
        }

        $settings    = $this->getRegistrationSettings();
        $profileData = Facebook::getProfileData($token);

        if (!(int)$settings['allowUnverifiedEmailAddresses']
            && !(int)$profileData['verified']) {
            throw new FrontendUsers\Exception(array(
                $lg,
                $lgPrefix . 'email_not_verified'
            ));
        }
    }

    /**
     * Get all invalid registration form fields
     *
     * @return InvalidFormField[]
     */
    public function getInvalidFields()
    {
        // Registration via Facebook account does not use form fields
        return array();
    }

    /**
     * @return string
     */
    public function getUsername()
    {
        $userData = Facebook::getProfileData($this->getAttribute('token'));

        if (!empty($userData['email'])) {
            return $userData['email'];
        }

        return '';
    }

    /**
     * @return Control
     */
    public function getControl()
    {
        return new Control();
    }

    /**
     * Get title
     *
     * @param QUI\Locale $Locale (optional) - If omitted use QUI::getLocale()
     * @return string
     */
    public function getTitle($Locale = null)
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'registrar.title');
    }

    /**
     * Get description
     *
     * @param QUI\Locale $Locale (optional) - If omitted use QUI::getLocale()
     * @return string
     */
    public function getDescription($Locale = null)
    {
        if (is_null($Locale)) {
            $Locale = QUI::getLocale();
        }

        return $Locale->get('quiqqer/authfacebook', 'registrar.description');
    }

    /**
     * Get registration settings for this plugin
     *
     * @return array
     */
    protected function getRegistrationSettings()
    {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->getSection('registration');
    }

    /**
     * Check if this Registrar can send passwords
     *
     * @return bool
     */
    public function canSendPassword()
    {
        return true;
    }
}
