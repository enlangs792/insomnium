import React, { FC } from 'react';

import { t } from '../../../../common/i18n';
import { AuthInputRow } from './components/auth-input-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const AWSAuth: FC = () => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
    <AuthInputRow
      label={t('auth.accessKeyId')}
      property="accessKeyId"
    />
    <AuthInputRow
      label={t('auth.secretAccessKey')}
      property="secretAccessKey"
    />
    <AuthInputRow
      label={t('auth.region')}
      property="region"
      help={t('auth.regionHelp')}
    />
    <AuthInputRow
      label={t('auth.service')}
      property="service"
      help={t('auth.serviceHelp')}
    />
    <AuthInputRow
      label={t('auth.sessionToken')}
      property="sessionToken"
      help={t('auth.sessionTokenHelp')}
    />
  </AuthTableBody>
);
