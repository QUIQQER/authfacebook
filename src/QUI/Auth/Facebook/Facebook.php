<?php

namespace QUI\Auth\Facebook;

//use Facebook\Exceptions\FacebookSDKException;
use QUI;

//use Facebook\Facebook as FacebookApi;
use League\OAuth2\Client\Provider\Facebook as FacebookApi;
use League\OAuth2\Client\Token\AccessToken;

use QUI\Utils\Security\Orthos;

/**
 * Class Facebook
 *
 * Facebook Graph API
 */
class Facebook
{
    const TBL_ACCOUNTS = 'quiqqer_auth_facebook';

    /**
     * Currently used version of Facebook API
     *
     * Version list:
     * https://developers.facebook.com/docs/apps/changelog
     *
     * @var string
     */
    const GRAPH_VERSION = 'v12.0';

    /**
     * Facebook API Object
     *
     * @var FacebookApi
     */
    protected static $Api = null;

    /**
     * Create a new QUIQQER account from a Facebook Access Token
     *
     * @param AccessToken $accessToken - Facebook access token
     * @return QUI\Users\User - Newly created user
     *
     * @throws Exception
     * @internal param string $email - Facebook email address
     */
    public static function createQuiqqerAccount(AccessToken $accessToken)
    {
        try {
            $profileData = self::getProfileData($accessToken);
        } catch (\Exception $ex) {
            // Throws error if Access Token is invalid (saves one request when not validating access token)
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.invalid.token'
            ]);
        }

        if (!isset($profileData['email'])) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.email.access.mandatory'
            ]);
        }

        $email = $profileData['email'];

        $Users = QUI::getUsers();

        if ($Users->emailExists($email)) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.email.already.exists',
                [
                    'email' => $email
                ]
            ]);
        }

        $NewUser = $Users->createChild($email, $Users->getSystemUser());
        $NewUser->setAttribute('email', $email);
        $NewUser->save($Users->getSystemUser());
        $NewUser->setPassword(Orthos::getPassword(), $Users->getSystemUser()); // set random password
        $NewUser->activate(false, $Users->getSystemUser());

        // automatically connect new quiqqer account with fb account
        QUI::getSession()->set('uid', $NewUser->getId());
        self::connectQuiqqerAccount($NewUser->getId(), $accessToken);
        QUI::getSession()->set('uid', false);

        return $NewUser;
    }

    /**
     * Connect a QUIQQER account with a Facebook account
     *
     * @param int $uid
     * @param AccessToken $accessToken
     * @param bool $checkPermission (optional) - check permission to edit quiqqer account [default: true]
     * @return void
     *
     * @throws QUI\Auth\Facebook\Exception
     */
    public static function connectQuiqqerAccount($uid, AccessToken $accessToken, $checkPermission = true)
    {
        if ($checkPermission !== false) {
            self::checkEditPermission($uid);
        }

        $User        = QUI::getUsers()->get($uid);
        $profileData = self::getProfileData($accessToken);

        if (self::existsQuiqqerAccount($accessToken)) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.account_already_connected',
                [
                    'email' => $profileData['email']
                ]
            ]);
        }

        self::validateAccessToken($accessToken);

        QUI::getDataBase()->insert(
            QUI::getDBTableName(self::TBL_ACCOUNTS),
            [
                'userId'   => $User->getId(),
                'fbUserId' => $profileData['id'],
                'email'    => $profileData['email'],
                'name'     => $profileData['name']
            ]
        );
    }

    /**
     * Disconnect Facebook account from QUIQQER account
     *
     * @param int $userId - QUIQQER User ID
     * @param bool $checkPermission (optional) [default: true]
     * @return void
     */
    public static function disconnectAccount($userId, $checkPermission = true)
    {
        if ($checkPermission !== false) {
            self::checkEditPermission($userId);
        }

        QUI::getDataBase()->delete(
            QUI::getDBTableName(self::TBL_ACCOUNTS),
            [
                'userId' => (int)$userId,
            ]
        );
    }

    /**
     * Checks if a Facebook API access token is valid and if the user has provided
     * the necessary information (email)
     *
     * @param AccessToken $accessToken
     * @return void
     *
     * @throws QUI\Auth\Facebook\Exception
     */
    public static function validateAccessToken(AccessToken $accessToken)
    {
        $profileData = self::getProfileData($accessToken);

        if (empty($profileData) || !isset($profileData['id'])) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.invalid.token'
            ]);
        }
    }

    /**
     * Get Facebook Profile data
     *
     * @param AccessToken $accessToken - access token
     * @return array
     */
    public static function getProfileData(AccessToken $accessToken): array
    {
//        /me?fields=id,name,first_name,last_name,email'
        $Response = self::getApi()->getResourceOwner($accessToken);
        return $Response->toArray();
    }

    /**
     * Get details of a connected Facebook account
     *
     * @param int $userId - QUIQQER User ID
     * @return array|false - details as array or false if no account connected to given QUIQQER User account ID
     */
    public static function getConnectedAccountByQuiqqerUserId($userId)
    {
        $result = QUI::getDataBase()->fetch([
            'from'  => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => [
                'userId' => (int)$userId
            ]
        ]);

        if (empty($result)) {
            return false;
        }

        return current($result);
    }

    /**
     * Get details of a connected Facebook account
     *
     * @param AccessToken $fbToken - Facebook API token
     * @return array|false - details as array or false if no account connected to given Facebook userID
     */
    public static function getConnectedAccountByFacebookToken(AccessToken $fbToken)
    {
        self::validateAccessToken($fbToken);

        $profile = self::getProfileData($fbToken);

        $result = QUI::getDataBase()->fetch([
            'from'  => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => [
                'fbUserId' => (int)$profile['id']
            ]
        ]);

        if (empty($result)) {
            return false;
        }

        return current($result);
    }

    /**
     * Check if a QUIQQER account exists for a certain access token
     *
     * @param AccessToken $token - Facebook API token
     * @return bool
     *
     * @throws QUI\Exception
     */
    public static function existsQuiqqerAccount(AccessToken $token): bool
    {
        $profile = self::getProfileData($token);

        $result = QUI::getDataBase()->fetch([
            'from'  => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => [
                'fbUserId' => $profile['id']
            ],
            'limit' => 1
        ]);

        return !empty($result);
    }

    /**
     * Get Facebook API Instance
     *
     * @return FacebookApi
     * @throws Exception
     */
    protected static function getApi()
    {
        if (!is_null(self::$Api)) {
            return self::$Api;
        }

        try {
            self::$Api = new FacebookApi([
                'clientId'        => self::getAppId(),
                'clientSecret'    => self::getAppSecret(),
                'graphApiVersion' => self::getApiVersion(),
                'redirectUri'     => 'none' // access tokens are provided via JavaScript SDK
            ]);
        } catch (\Exception $Exception) {
            QUI\System\Log::addError(
                self::class.' :: getApi() -> '.$Exception->getMessage()
            );

            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        return self::$Api;
    }

    /**
     * Get App ID for Facebook API
     *
     * @return string
     */
    public static function getAppId()
    {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'appId');
    }

    /**
     * Get App Secret for Facebook API
     *
     * @return string
     */
    protected static function getAppSecret()
    {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'appSecret');
    }

    /**
     * Get version string for Facebook API
     *
     * @return string
     */
    public static function getApiVersion()
    {
        return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'apiVersion');
    }

    /**
     * Checks if the session user is allowed to edit the Facebook account connection to
     * the given QUIQQER user account ID
     *
     * @param int $userId - QUIQQER User ID
     * @return void
     *
     * @throws QUI\Permissions\Exception
     */
    protected static function checkEditPermission($userId)
    {
        if ((int)QUI::getSession()->get('uid') !== (int)$userId
            || !$userId
        ) {
            throw new QUI\Permissions\Exception(
                QUI::getLocale()->get(
                    'quiqqer/authfacebook',
                    'exception.operation.only.allowed.by.own.user'
                ),
                401
            );
        }
    }

    /**
     * @param string $tokenCode
     * @return AccessToken
     */
    public static function getToken(string $tokenCode)
    {
        return new AccessToken([
            'access_token' => $tokenCode
        ]);
    }
}
