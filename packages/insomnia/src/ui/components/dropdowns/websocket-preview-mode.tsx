import React, { FC } from 'react';

import { CONTENT_TYPE_JSON, CONTENT_TYPE_PLAINTEXT } from '../../../common/constants';
import { t } from '../../../common/i18n';
import { Dropdown, DropdownButton, DropdownItem, ItemContent } from '../base/dropdown';

interface Props {
  previewMode: string;
  onClick: (previewMode: string) => void;
}
export const WebSocketPreviewMode: FC<Props> = ({ previewMode, onClick }) => {
  return (
    <Dropdown
      aria-label={t('previewMode.websocketDropdown')}
      triggerButton={
        <DropdownButton className="tall">
          {{
            [CONTENT_TYPE_JSON]: t('previewMode.json'),
            [CONTENT_TYPE_PLAINTEXT]: t('previewMode.raw'),
          }[previewMode]}
          <i className="fa fa-caret-down space-left" />
        </DropdownButton>
      }
    >
      <DropdownItem aria-label={t('previewMode.json')}>
        <ItemContent
          label={t('previewMode.json')}
          onClick={() => onClick(CONTENT_TYPE_JSON)}
        />
      </DropdownItem>
      <DropdownItem aria-label={t('previewMode.raw')}>
        <ItemContent
          label={t('previewMode.raw')}
          onClick={() => onClick(CONTENT_TYPE_PLAINTEXT)}
        />
      </DropdownItem>
    </Dropdown>
  );
};
