<?php

/**
 * This file contains QUI\Registration\Facebook\Registrar
 */

namespace QUI\Registration\Facebook;

use QUI;

/**
 * Class Control
 *
 * @package QUI\Registration\Facebook
 */
class Control extends QUI\Control
{
    /**
     * Control constructor.
     *
     * @param array $attributes
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);

        $this->addCSSFile(dirname(__FILE__) . '/Control.css');
        $this->addCSSClass('quiqqer-authfacebook-registrar');

        $this->setJavaScriptControl('package/quiqqer/authfacebook/bin/frontend/controls/Registrar');
    }

    /**
     * @return string
     */
    public function getBody()
    {
        $Engine = QUI::getTemplateManager()->getEngine();

        $Engine->assign('isAuth', boolval(QUI::getUserBySession()->getId()));

        return $Engine->fetch(dirname(__FILE__) . '/Control.html');
    }
}
