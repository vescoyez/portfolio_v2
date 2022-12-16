<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\i18n;

use Craft;
use yii\base\Exception;

/**
 * Class PhpMessageSource
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.0.0
 */
class PhpMessageSource extends \yii\i18n\PhpMessageSource
{
    /**
     * @var bool Whether the messages can be overridden by translations in the site’s translations folder
     */
    public $allowOverrides = false;

    /**
     * @inheritdoc
     */
    protected function loadMessages($category, $language)
    {
        $messages = parent::loadMessages($category, $language);

        if ($this->allowOverrides) {
            $overrideMessages = $this->_loadOverrideMessages($category, $language);
            $messages = array_merge($messages, $overrideMessages);
        }

        return $messages;
    }

    /**
     * @inheritdoc
     */
    protected function getMessageFilePath($category, $language): string
    {
        if ($category === 'yii') {
            // Map Craft’s language IDs to Yii’s when necessary
            switch ($language) {
                case 'de-CH':
                    $language = 'de';
                    break;
                case 'fr-CA':
                    $language = 'fr';
                    break;
                case 'nb':
                case 'nn':
                    $language = 'nb-NO';
                    break;
                case 'zh':
                    $language = 'zh-CN';
                    break;
            }
        }

        return parent::getMessageFilePath($category, $language);
    }

    /**
     * @inheritdoc
     */
    protected function loadMessagesFromFile($messageFile)
    {
        $messages = parent::loadMessagesFromFile($messageFile);

        if ($messages === null && !YII_DEBUG) {
            // avoid logs about missing translation files
            $messages = [];
        }

        return $messages;
    }

    /**
     * Returns the override methods defined in the site’s translations folder.
     *
     * @param string $category
     * @param string $language
     * @return array
     * @throws Exception
     */
    private function _loadOverrideMessages(string $category, string $language): array
    {
        // Save the current base path to restore later.
        $oldBasePath = $this->basePath;
        $newBasePath = Craft::getAlias('@translations');

        if ($newBasePath === false) {
            throw new Exception('There was a problem getting the translations path.');
        }

        $this->basePath = $newBasePath;

        // Code adapted from yii\i18n\PhpMessageSource, minus the error logging
        $messageFile = $this->getMessageFilePath($category, $language);
        $messages = $this->loadMessagesFromFile($messageFile);

        $fallbackLanguage = substr($language, 0, 2);
        if ($fallbackLanguage !== $language) {
            $fallbackMessageFile = $this->getMessageFilePath($category, $fallbackLanguage);
            $fallbackMessages = $this->loadMessagesFromFile($fallbackMessageFile);

            if (empty($messages)) {
                $messages = $fallbackMessages;
            } elseif (!empty($fallbackMessages)) {
                foreach ($fallbackMessages as $key => $value) {
                    if (!empty($value) && empty($messages[$key])) {
                        $messages[$key] = $fallbackMessages[$key];
                    }
                }
            }
        }

        $this->basePath = $oldBasePath;

        return (array)$messages;
    }
}
