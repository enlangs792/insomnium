import React, { FC } from 'react';

import { t } from '../../../../common/i18n';
import { COOKIE, HEADER, QUERY_PARAMS } from '../../../../network/api-key/constants';
import { AuthInputRow } from './components/auth-input-row';
import { AuthSelectRow } from './components/auth-select-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const options = [
  { name: t('auth.header'), value: HEADER },
  { name: t('auth.queryParams'), value: QUERY_PARAMS },
  { name: t('auth.cookie'), value: COOKIE },
];

export const ApiKeyAuth: FC<{ disabled?: boolean }> = ({ disabled = false }) => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert disabled={disabled} />
    <AuthInputRow label={t('auth.key')} property='key' disabled={disabled} />
    <AuthInputRow label={t('auth.value')} property='value' mask disabled={disabled} />
    <AuthSelectRow label={t('auth.addTo')} property='addTo' options={options} disabled={disabled} />
  </AuthTableBody>
);
