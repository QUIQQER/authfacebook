<?php

namespace QUI\Auth\Facebook;

use QUI;
use QUI\Users\User;
use QUI\Auth\Google2Fa\Exception as Google2FaException;
use QUI\Security;

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

    public function __construct()
    {

    }

    /**
     * Checks if a Facebook API access token is valid and if the user has provided
     * the necessary information (email)
     *
     * @param string $token
     * @return bool - true = valid; false = invalid
     */
    public static function validateAccessToken($token)
    {
        
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
}
