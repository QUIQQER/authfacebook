<?php

namespace QUI\Auth\Facebook;

use QUI;
use Facebook\Facebook as FacebookApi;

/**
 * Class Facebook
 *
 * Facebook Graph API
 *
 * @package QUI\Authe\Google2Fa
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
    const GRAPH_VERSION = 'v2.8';

    /**
     * Facebook API Object
     *
     * @var FacebookApi
     */
    protected static $Api = null;

    /**
     * Connect a QUIQQER account with a Facebook account
     *
     * @param int $uid
     * @param string $accessToken
     * @return void
     *
     * @throws QUI\Auth\Facebook\Exception
     */
    public static function connectQuiqqerAccount($uid, $accessToken)
    {
        self::checkEditPermission($uid);

        $accountData = self::getConnectedAccountByQuiqqerUserId($uid);
        $User        = QUI::getUsers()->get($uid);

        if (!empty($accountData)) {
            throw new Exception(array(
                'quiqqer/authfacebook',
                'exception.facebook.account.already.connected',
                array(
                    'userId'   => $uid,
                    'userName' => $User->getUsername()
                )
            ));
        }

        self::validateAccessToken($accessToken);

        $profileData = self::getProfileData($accessToken);

        QUI::getDataBase()->insert(
            QUI::getDBTableName(self::TBL_ACCOUNTS),
            array(
                'userId'   => $User->getId(),
                'fbUserId' => $profileData['id'],
                'email'    => $profileData['email'],
                'name'     => $profileData['name']
            )
        );
    }

    /**
     * Disconnect Facebook account from QUIQQER account
     *
     * @param int $userId - QUIQQER User ID
     */
    public static function disconnectAccount($userId)
    {
        self::checkEditPermission($userId);

        QUI::getDataBase()->delete(
            QUI::getDBTableName(self::TBL_ACCOUNTS),
            array(
                'userId' => (int)$userId,
            )
        );
    }

    /**
     * Checks if a Facebook API access token is valid and if the user has provided
     * the necessary information (email)
     *
     * @param string $accessToken
     * @return void
     *
     * @throws QUI\Auth\Facebook\Exception
     */
    public static function validateAccessToken($accessToken)
    {
        $profileData = self::getProfileData($accessToken);

        if (empty($profileData) || !isset($profileData['id'])) {
            throw new Exception(array(
                'quiqqer/authfacebook',
                'exception.facebook.invalid.token'
            ));
        }
    }

    /**
     * Get Facebook Profile data
     *
     * @param string $accessToken - access token
     * @return array
     */
    public static function getProfileData($accessToken)
    {
        $Response = self::getApi()->get('/me?fields=id,name,email', $accessToken);
        $UserData = $Response->getGraphNode();

        return $UserData->asArray();
    }

    /**
     * Get details of a connected Facebook account
     *
     * @param int $userId - QUIQQER User ID
     * @return array|false - details as array or false if no account connected to given QUIQQER User account ID
     */
    public static function getConnectedAccountByQuiqqerUserId($userId)
    {
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => array(
                'userId' => (int)$userId
            )
        ));

        if (empty($result)) {
            return false;
        }

        return current($result);
    }

    /**
     * Get details of a connected Facebook account
     *
     * @param int $userId - Facebook User ID
     * @return array|false - details as array or false if no account connected to given Facebook userID
     */
    public static function getConnectedAccountByFacebookUserId($userId)
    {
        $result = QUI::getDataBase()->fetch(array(
            'from'  => QUI::getDBTableName(self::TBL_ACCOUNTS),
            'where' => array(
                'fbUserId' => (int)$userId
            )
        ));

        if (empty($result)) {
            return false;
        }

        return current($result);
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
            self::$Api = new FacebookApi(array(
                'app_id'                => self::getAppId(),
                'app_secret'            => self::getAppSecret(),
                'default_graph_version' => self::GRAPH_VERSION
            ));
        } catch (\Exception $Exception) {
            QUI\System\Log::addError(
                self::class . ' :: getApi() -> ' . $Exception->getMessage()
            );

            throw new Exception(array(
                'quiqqer/authfacebook',
                'exception.facebook.api.error'
            ));
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
        if ((int)QUI::getUserBySession()->getId() !== (int)$userId
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
}
