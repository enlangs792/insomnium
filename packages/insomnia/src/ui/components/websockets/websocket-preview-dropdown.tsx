import React, { FC } from 'react';

import { getPreviewModeName, PREVIEW_MODES, PreviewMode } from '../../../common/constants';
import { t } from '../../../common/i18n';
import { Dropdown, DropdownButton, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';

interface Props {
  download: () => void;
  copyToClipboard: () => void;
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}

export const WebSocketPreviewModeDropdown: FC<Props> = ({
  download,
  copyToClipboard,
  previewMode,
  setPreviewMode,
}) => {
  return (
    <Dropdown
      aria-label={t('previewMode.websocketDropdown')}
      triggerButton={
        <DropdownButton className="tall">
          {getPreviewModeName(previewMode)}
          <i className="fa fa-caret-down space-left" />
        </DropdownButton>
      }
    >
      <DropdownSection
        aria-label={t('previewMode.previewModeSection')}
        title={t('previewMode.previewMode')}
      >
        {PREVIEW_MODES.map(mode =>
          <DropdownItem
            aria-label={getPreviewModeName(mode, true)}
            key={mode}
          >
            <ItemContent
              icon={previewMode === mode ? 'check' : 'empty'}
              label={getPreviewModeName(mode, true)}
              onClick={() => setPreviewMode(mode)}
            />
          </DropdownItem>
        )}
      </DropdownSection>
      <DropdownSection
        aria-label={t('previewMode.actionsSection')}
        title={t('previewMode.actions')}
      >
        <DropdownItem aria-label={t('previewMode.copyRawResponse')}>
          <ItemContent
            icon="copy"
            label={t('previewMode.copyRawResponse')}
            onClick={copyToClipboard}
          />
        </DropdownItem>
        <DropdownItem aria-label={t('previewMode.exportRawResponse')}>
          <ItemContent
            icon="save"
            label={t('previewMode.exportRawResponse')}
            onClick={download}
          />
        </DropdownItem>
      </DropdownSection>
    </Dropdown>
  );
};
