<?php
/**
 * @link https://craftcms.com/
 * @copyright Copyright (c) Pixel & Tonic, Inc.
 * @license https://craftcms.github.io/license/
 */

namespace craft\elements\actions;

use Craft;
use craft\base\Element;
use craft\base\ElementAction;
use craft\base\ElementInterface;
use craft\db\Table;
use craft\elements\db\ElementQueryInterface;
use craft\helpers\Db;
use craft\helpers\Json;

/**
 * Delete represents a “Delete for site” element action.
 *
 * Element types that make this action available should implement [[ElementInterface::getIsDeletable()]] to explicitly state whether they can be
 * deleted by the current user.
 *
 * @author Pixel & Tonic, Inc. <support@pixelandtonic.com>
 * @since 3.7.0
 */
class DeleteForSite extends ElementAction
{
    /**
     * @var string|null The confirmation message that should be shown before the elements get deleted
     */
    public $confirmationMessage;

    /**
     * @var string|null The message that should be shown after the elements get deleted
     */
    public $successMessage;

    /**
     * @inheritdoc
     */
    public function getTriggerHtml(): ?string
    {
        // Only enable for deletable elements, per getIsDeletable()
        $type = Json::encode(static::class);
        $js = <<<JS
(() => {
    new Craft.ElementActionTrigger({
        type: $type,
        validateSelection: function(\$selectedItems)
        {
            for (let i = 0; i < \$selectedItems.length; i++) {
                if (!Garnish.hasAttr(\$selectedItems.eq(i).find('.element'), 'data-deletable')) {
                    return false;
                }
            }
            return true;
        },
    });
})();
JS;
        Craft::$app->getView()->registerJs($js);

        return null;
    }

    /**
     * @inheritdoc
     */
    public function getTriggerLabel(): string
    {
        return Craft::t('app', 'Delete for site');
    }

    /**
     * @inheritdoc
     */
    public static function isDestructive(): bool
    {
        return true;
    }

    /**
     * @inheritdoc
     */
    public function getConfirmationMessage()
    {
        if ($this->confirmationMessage !== null) {
            return $this->confirmationMessage;
        }

        /** @var ElementInterface|string $elementType */
        $elementType = $this->elementType;

        return Craft::t('app', 'Are you sure you want to delete the selected {type} for this site?', [
            'type' => $elementType::pluralLowerDisplayName(),
        ]);
    }

    /**
     * @inheritdoc
     */
    public function performAction(ElementQueryInterface $query): bool
    {
        $elementsService = Craft::$app->getElements();

        // Fetch the elements in some other site than the selected one
        $otherSiteElements = (clone $query)
            ->siteId(['not', $query->siteId])
            ->unique()
            ->indexBy('id')
            ->all();
        $multiSiteElementIds = array_keys($otherSiteElements);

        if (!empty($otherSiteElements)) {
            // Delete their rows in elements_sites
            Db::delete(Table::ELEMENTS_SITES, [
                'elementId' => $multiSiteElementIds,
                'siteId' => $query->siteId,
            ]);

            // Resave the elements
            foreach ($otherSiteElements as $element) {
                if (!$element->getIsDeletable()) {
                    continue;
                }

                $element->setScenario(Element::SCENARIO_ESSENTIALS);
                $element->resaving = true;
                $elementsService->saveElement($element, true, true, false);
            }
        }

        // If any selected elements are *only* available in the selected site, fully delete them
        $singleSiteElements = (clone $query)
            ->andWhere(['not', ['elements.id' => $multiSiteElementIds]])
            ->all();

        foreach ($singleSiteElements as $element) {
            if (!$element->getIsDeletable()) {
                continue;
            }

            $elementsService->deleteElement($element);
        }

        if ($this->successMessage !== null) {
            $this->setMessage($this->successMessage);
        } else {
            /** @var ElementInterface|string $elementType */
            $elementType = $this->elementType;
            $this->setMessage(Craft::t('app', '{type} deleted for site.', [
                'type' => $elementType::pluralDisplayName(),
            ]));
        }

        return true;
    }
}
