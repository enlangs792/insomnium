import React, { FC } from 'react';

import { t } from '../../../../common/i18n';
import { AuthInputRow } from './components/auth-input-row';
import { AuthPrivateKeyRow } from './components/auth-private-key-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const AsapAuth: FC = () => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
    <AuthInputRow label={t('auth.issuer')} property='issuer' />
    <AuthInputRow label={t('auth.subject')} property='subject' />
    <AuthInputRow label={t('auth.audience')} property='audience' />
    <AuthInputRow label={t('auth.additionalClaims')} property='additionalClaims' />
    <AuthInputRow label={t('auth.keyId')} property='keyId' />
    <AuthPrivateKeyRow
      label={t('auth.privateKey')}
      property='privateKey'
      help={t('auth.privateKeyDataUriHelp')}
    />
  </AuthTableBody>
);
