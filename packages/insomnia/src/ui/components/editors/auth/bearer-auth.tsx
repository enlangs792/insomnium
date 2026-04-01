import React, { FC } from 'react';

import { t } from '../../../../common/i18n';
import { AuthInputRow } from './components/auth-input-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const BearerAuth: FC<{ disabled?: boolean }> = ({ disabled = false }) => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert disabled={disabled} />
    <AuthInputRow label={t('auth.token')} property='token' disabled={disabled} />
    <AuthInputRow label={t('auth.prefix')} property='prefix' disabled={disabled} />
  </AuthTableBody>
);
