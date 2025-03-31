/**
 * Main controller for Facebook JavaScript API
 */
define('package/quiqqer/authfacebook/bin/Facebook', [
    'package/quiqqer/authfacebook/bin/classes/Facebook'
], function(FacebookClass) {
    'use strict';
    return new FacebookClass();
});