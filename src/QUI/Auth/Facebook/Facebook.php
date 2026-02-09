<?php

namespace QUI\Auth\Facebook;

use GuzzleHttp\Exception\GuzzleException;
use League\OAuth2\Client\Provider\Exception\IdentityProviderException;
use League\OAuth2\Client\Provider\Facebook as FacebookApi;
use League\OAuth2\Client\Token\AccessToken;
use QUI;
use QUI\Database\Exception;
use QUI\ExceptionStack;
use QUI\Interfaces\Users\User;
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
     * @var ?FacebookApi
     */
    protected static ?FacebookApi $Api = null;

    /**
     * Create a new QUIQQER account from a Facebook Access Token
     *
     * @param AccessToken $accessToken - Facebook access token
     * @return User - Newly created user
     *
     * @throws Exception
     * @throws ExceptionStack
     * @throws QUI\Exception
     * @throws QUI\Permissions\Exception
     * @throws QUI\Users\Exception
     * @internal param string $email - Facebook email address
     */
    public static function createQuiqqerAccount(AccessToken $accessToken): QUI\Interfaces\Users\User
    {
        try {
            $profileData = self::getProfileData($accessToken);
        } catch (\Exception) {
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
        $NewUser->activate('', $Users->getSystemUser());

        // automatically connect new quiqqer account with fb account
        QUI::getSession()->set('uid', $NewUser->getUUID());
        self::connectQuiqqerAccount($NewUser->getUUID(), $accessToken);
        QUI::getSession()->set('uid', false);

        return $NewUser;
    }

    /**
     * Connect a QUIQQER account with a Facebook account
     *
     * @param int|string $uid
     * @param AccessToken $accessToken
     * @param bool $checkPermission (optional) - check permission to edit quiqqer account [default: true]
     * @return void
     *
     * @throws Exception
     * @throws QUI\Exception
     * @throws ExceptionStack
     * @throws QUI\Permissions\Exception
     * @throws Exception
     */
    public static function connectQuiqqerAccount(
        int | string $uid,
        AccessToken $accessToken,
        bool $checkPermission = true
    ): void {
        if ($checkPermission !== false) {
            self::checkEditPermission($uid);
        }

        $User = QUI::getUsers()->get($uid);
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
                'userId' => $User->getUUID(),
                'fbUserId' => $profileData['id'],
                'email' => $profileData['email'],
                'name' => $profileData['name']
            ]
        );
    }

    /**
     * Disconnect Facebook account from QUIQQER account
     *
     * @param int|string $userId - QUIQQER User ID
     * @param bool $checkPermission (optional) [default: true]
     * @return void
     *
     * @throws QUI\Exception
     * @throws QUI\Permissions\Exception
     */
    public static function disconnectAccount(int | string $userId, bool $checkPermission = true): void
    {
        if ($checkPermission !== false) {
            self::checkEditPermission($userId);
        }

        QUI::getDataBase()->delete(
            QUI::getDBTableName(self::TBL_ACCOUNTS),
            ['userId' => $userId]
        );
    }

    /**
     * Checks if a Facebook API access token is valid and if the user has provided
     * the necessary information (email)
     *
     * @param AccessToken $accessToken
     * @return void
     *
     * @throws Exception
     * @throws GuzzleException
     * @throws IdentityProviderException
     */
    public static function validateAccessToken(AccessToken $accessToken): void
    {
        $profileData = self::getProfileData($accessToken);

        if (empty($profileData) || !isset($profileData['id'])) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.invalid.token'
            ]);
        }

        // Validate token against Facebook debug endpoint and ensure it belongs to this app
        $debugData = self::getDebugTokenData($accessToken);

        if (empty($debugData) || empty($debugData['is_valid'])) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.invalid.token'
            ]);
        }

        if (empty($debugData['app_id']) || (string)$debugData['app_id'] !== (string)self::getAppId()) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.token.app_mismatch'
            ]);
        }

        if (!empty($debugData['user_id']) && (string)$debugData['user_id'] !== (string)$profileData['id']) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.token.user_mismatch'
            ]);
        }

        if (!empty($debugData['expires_at']) && (int)$debugData['expires_at'] > 0) {
            if ((int)$debugData['expires_at'] < time()) {
                throw new Exception([
                    'quiqqer/authfacebook',
                    'exception.facebook.token.expired'
                ]);
            }
        }
    }

    /**
     * Get Facebook Profile data
     *
     * @param AccessToken $accessToken - access token
     * @return array
     * @throws Exception
     * @throws GuzzleException
     * @throws IdentityProviderException
     */
    public static function getProfileData(AccessToken $accessToken): array
    {
        $version = self::getApiVersion() ?: self::GRAPH_VERSION;
        $appSecretProof = self::getAppSecretProof($accessToken);

        try {
            $Response = self::getApi()->getHttpClient()->request(
                'GET',
                'https://graph.facebook.com/' . $version . '/me',
                [
                    'query' => [
                        'fields' => 'id,name,first_name,last_name,email',
                        'access_token' => $accessToken->getToken(),
                        'appsecret_proof' => $appSecretProof
                    ]
                ]
            );
        } catch (GuzzleException $Exception) {
            throw $Exception;
        } catch (\Throwable) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        $body = (string)$Response->getBody();
        $data = json_decode($body, true);

        if (empty($data) || !is_array($data)) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        return $data;
    }

    /**
     * Get details of a connected Facebook account
     *
     * @param int|string $userId - QUIQQER User ID
     * @return array|false - details as array or false if no account connected to given QUIQQER User account ID
     *
     * @throws QUI\Exception
     */
    public static function getConnectedAccountByQuiqqerUserId(int | string $userId): bool | array
    {
        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => [
                'userId' => $userId
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
     *
     * @throws Exception
     * @throws GuzzleException
     * @throws IdentityProviderException
     * @throws Exception
     */
    public static function getConnectedAccountByFacebookToken(AccessToken $fbToken): bool | array
    {
        self::validateAccessToken($fbToken);

        $profile = self::getProfileData($fbToken);

        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBTableName(self::TBL_ACCOUNTS),
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
     * @throws Exception
     * @throws GuzzleException
     * @throws IdentityProviderException
     */
    public static function existsQuiqqerAccount(AccessToken $token): bool
    {
        $profile = self::getProfileData($token);

        $result = QUI::getDataBase()->fetch([
            'from' => QUI::getDBTableName(self::TBL_ACCOUNTS),
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
     * @return ?FacebookApi
     * @throws Exception
     */
    protected static function getApi(): ?FacebookApi
    {
        if (!is_null(self::$Api)) {
            return self::$Api;
        }

        try {
            self::$Api = new FacebookApi([
                'clientId' => self::getAppId(),
                'clientSecret' => self::getAppSecret(),
                'graphApiVersion' => self::getApiVersion(),
                'redirectUri' => 'none' // access tokens are provided via JavaScript SDK
            ]);
        } catch (\Exception $Exception) {
            QUI\System\Log::addError(
                self::class . ' :: getApi() -> ' . $Exception->getMessage()
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
    public static function getAppId(): string
    {
        try {
            return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'appId');
        } catch (QUI\Exception) {
            return '';
        }
    }

    /**
     * Get App Secret for Facebook API
     *
     * @return string
     */
    protected static function getAppSecret(): string
    {
        try {
            return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'appSecret');
        } catch (QUI\Exception) {
            return '';
        }
    }

    /**
     * Get version string for Facebook API
     *
     * @return string
     */
    public static function getApiVersion(): string
    {
        try {
            return QUI::getPackage('quiqqer/authfacebook')->getConfig()->get('apiSettings', 'apiVersion');
        } catch (QUI\Exception) {
            return '';
        }
    }

    /**
     * Checks if the session user is allowed to edit the Facebook account connection to
     * the given QUIQQER user account ID
     *
     * @param int|string $userId - QUIQQER User ID
     * @return void
     *
     * @throws QUI\Permissions\Exception
     */
    protected static function checkEditPermission(int | string $userId): void
    {
        if (QUI::getSession()->get('uid') !== $userId || !$userId) {
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
    public static function getToken(string $tokenCode): AccessToken
    {
        return new AccessToken([
            'access_token' => $tokenCode
        ]);
    }

    /**
     * Fetch debug info for a Facebook access token
     *
     * @param AccessToken $accessToken
     * @return array
     * @throws Exception
     * @throws GuzzleException
     */
    protected static function getDebugTokenData(AccessToken $accessToken): array
    {
        $appId = self::getAppId();
        $appSecret = self::getAppSecret();

        if (empty($appId) || empty($appSecret)) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        $appAccessToken = $appId . '|' . $appSecret;
        $version = self::getApiVersion() ?: self::GRAPH_VERSION;

        try {
            $Response = self::getApi()->getHttpClient()->request(
                'GET',
                'https://graph.facebook.com/' . $version . '/debug_token',
                [
                    'query' => [
                        'input_token' => $accessToken->getToken(),
                        'access_token' => $appAccessToken
                    ]
                ]
            );
        } catch (GuzzleException $Exception) {
            throw $Exception;
        } catch (\Throwable) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        $body = (string)$Response->getBody();
        $data = json_decode($body, true);

        if (empty($data) || empty($data['data']) || !is_array($data['data'])) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        return $data['data'];
    }

    /**
     * Create appsecret_proof for Graph requests
     *
     * @param AccessToken $accessToken
     * @return string
     * @throws Exception
     */
    protected static function getAppSecretProof(AccessToken $accessToken): string
    {
        $appSecret = self::getAppSecret();

        if (empty($appSecret)) {
            throw new Exception([
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ]);
        }

        return hash_hmac('sha256', $accessToken->getToken(), $appSecret);
    }
}
