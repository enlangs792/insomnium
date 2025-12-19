import React, { FC } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import {
  areSameKeyCombinations,
  constructKeyCombinationDisplay,
  getKeyboardShortcutDescription,
  getPlatformKeyCombinations,
  newDefaultRegistry,
} from '../../../common/hotkeys';
import { t } from '../../../common/i18n';
import { HotKeyRegistry, KeyboardShortcut, KeyCombination } from '../../../common/settings';
import { useSettingsPatcher } from '../../hooks/use-request';
import { RootLoaderData } from '../../routes/root';
import { Dropdown, DropdownButton, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';
import { PromptButton } from '../base/prompt-button';
import { Hotkey } from '../hotkey';
import { showModal } from '../modals';
import { AddKeyCombinationModal } from '../modals/add-key-combination-modal';

export const isKeyCombinationInRegistry = (pressedKeyComb: KeyCombination, hotKeyRegistry: Partial<HotKeyRegistry>): boolean =>
  !!Object.values(hotKeyRegistry).find(bindings =>
    getPlatformKeyCombinations(bindings)
      .find(keyComb => areSameKeyCombinations(pressedKeyComb, keyComb)));

export const Shortcuts: FC = () => {
  const {
    settings,
  } = useRouteLoaderData('root') as RootLoaderData;
  const { hotKeyRegistry } = settings;
  const patchSettings = useSettingsPatcher();

  return (
    <div className="shortcuts">
      <div className="row-spaced margin-bottom-xs">
        <div>
          <PromptButton className="btn btn--clicky" onClick={() => patchSettings({ hotKeyRegistry: newDefaultRegistry() })}>
            {t('shortcuts.resetAll')}
          </PromptButton>
        </div>
      </div>
      <table className="table--fancy">
        <tbody>
          {Object.entries(hotKeyRegistry).map(([key, platformCombinations]) => {
            const keyboardShortcut = key as KeyboardShortcut;
            const keyCombosForThisPlatform = getPlatformKeyCombinations(platformCombinations);

            return (
              <tr key={keyboardShortcut}>
                <td style={{ verticalAlign: 'middle' }}>{getKeyboardShortcutDescription(keyboardShortcut)}</td>
                <td className="text-right">
                  {keyCombosForThisPlatform.map((keyComb: KeyCombination, index: number) => {
                    return (
                      <code key={index} className="margin-left-sm" style={{ lineHeight: '1.25em' }}>
                        <Hotkey keyCombination={keyComb} />
                      </code>
                    );
                  })}
                </td>
                <td className="text-right options" style={{ verticalAlign: 'middle' }}>
                  <Dropdown
                    aria-label={t('shortcuts.selectMode')}
                    closeOnSelect={false}
                    triggerButton={
                      <DropdownButton
                        removePaddings={false}
                        removeBorderRadius={false}
                        disableHoverBehavior={false}
                        radius="var(--radius-md)"
                        variant='outlined'
                      >
                        <i className="fa fa-gear" />
                      </DropdownButton>
                    }
                  >
                    <DropdownItem aria-label={t('shortcuts.addKeyboardShortcut')}>
                      <ItemContent
                        icon="plus-circle"
                        label={t('shortcuts.addKeyboardShortcut')}
                        onClick={() =>
                          showModal(
                            AddKeyCombinationModal,
                            {
                              keyboardShortcut,
                              checkKeyCombinationDuplicate: (pressed: KeyCombination) => isKeyCombinationInRegistry(pressed, hotKeyRegistry),
                              addKeyCombination: (keyboardShortcut: KeyboardShortcut, keyComb: KeyCombination) => {
                                const keyCombs = getPlatformKeyCombinations(hotKeyRegistry[keyboardShortcut]);
                                keyCombs.push(keyComb);
                                patchSettings({ hotKeyRegistry });
                              },
                            }
                          )}
                      />
                    </DropdownItem>
                    <DropdownSection
                      aria-label={t('shortcuts.removeSection')}
                      title={t('shortcuts.removeExisting')}
                    >
                      {
                        /* Dropdown items to remove key combinations. */
                        keyCombosForThisPlatform.map((keyComb: KeyCombination) => {
                          const display = constructKeyCombinationDisplay(keyComb, false);
                          return (
                            <DropdownItem
                              key={display}
                              aria-label={display}
                            >
                              <ItemContent
                                icon="trash-o"
                                label={display}
                                withPrompt
                                onClick={() => {
                                  let toBeRemovedIndex = -1;
                                  keyCombosForThisPlatform.forEach((existingKeyComb, index) => {
                                    if (areSameKeyCombinations(existingKeyComb, keyComb)) {
                                      toBeRemovedIndex = index;
                                    }
                                  });
                                  if (toBeRemovedIndex >= 0) {
                                    keyCombosForThisPlatform.splice(toBeRemovedIndex, 1);
                                    patchSettings({ hotKeyRegistry });
                                  }
                                }}
                              />
                            </DropdownItem>
                          );
                        })
                      }
                    </DropdownSection>

                    <DropdownSection aria-label={t('shortcuts.resetSection')}>
                      <DropdownItem aria-label={t('shortcuts.resetKeyboardShortcuts')}>
                        <ItemContent
                          icon="empty"
                          label={t('shortcuts.resetKeyboardShortcuts')}
                          withPrompt
                          onClick={() => {
                            hotKeyRegistry[keyboardShortcut] = newDefaultRegistry()[keyboardShortcut];
                            patchSettings({ hotKeyRegistry });
                          }}
                        />
                      </DropdownItem>
                    </DropdownSection>
                  </Dropdown>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
