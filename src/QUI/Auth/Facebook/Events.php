<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Rewrite;
use QUI\Auth\Facebook\Facebook;
use QUI\Auth\Facebook\Auth as FacebookAuth;

/**
 * Class Events
 *
 * Main class for handling QUIQQER Events
 */
class Events
{
    /**
     * QUIQQER Event: onUserDelete
     *
     * @param \QUI\Users\User $User
     * @return void
     */
    public static function onUserDelete($User)
    {
        // delete connected facebook account
        $connectedAccount = Facebook::getConnectedAccountByQuiqqerUserId($User->getId());

        if (!empty($connectedAccount)) {
            Facebook::disconnectAccount($User->getId(), false);
        }
    }

    /**
     * quiqqer/quiqqer: onRequest
     *
     * Handles authentication of Facebook redirect requests
     *
     * @param Rewrite $Rewrite
     * @param string $requestedUrl
     * @return void
     */
    public static function onRequest(Rewrite $Rewrite, $requestedUrl)
    {
        $QueryParams = QUI::getRequest()->query;

        if (!$QueryParams->has('code')
            || !$QueryParams->has('state')) {
            return;
        }

        $code    = $QueryParams->get('code');
        $state   = $QueryParams->get('state');
        $Session = QUI::getSession();

        // Handle redirect form Facebook login
        $csrfToken = $Session->get('facebook_auth_csrf_token');

        if ($state !== $csrfToken) {
            return;
        }

        try {
            $token = Facebook::getTokenFromAuthRedirectCode($code);
        } catch (\Exception $Exception) {
            QUI\System\Log::writeException($Exception);
            return;
        }

        $connectionProfile = Facebook::getConnectedAccountByFacebookToken($token);

        if (!$connectionProfile) {
            $Session->set('auth-error', 'test');
            return;
        }

        try {
            $FBAuth = new FacebookAuth();
            $FBAuth->auth(['token' => $token]);
            $User = QUI::getUsers()->get($connectionProfile['userId']);

            $Session = QUI::getSession();
            $Session->set('uid', $User->getId());
            $Session->set('username', $User->getUsername());
            $Session->set('auth-globals', 1);
            $Session->set('auth-'.get_class($FBAuth), 1);

            QUI::getUsers()->login();
        } catch (\Exception $Exception) {
            \QUI\System\Log::writeException($Exception);
        }
    }
}
