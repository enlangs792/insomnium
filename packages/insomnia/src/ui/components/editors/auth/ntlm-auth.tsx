import React, { FC } from 'react';

import { t } from '../../../../common/i18n';
import { AuthInputRow } from './components/auth-input-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const NTLMAuth: FC = () => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
    <AuthInputRow label={t('auth.username')} property="username" />
    <AuthInputRow label={t('auth.password')} property="password" mask />
  </AuthTableBody>
);
