import React, { FC } from 'react';

import {
  HAWK_ALGORITHM_SHA1,
  HAWK_ALGORITHM_SHA256,
} from '../../../../common/constants';
import { t } from '../../../../common/i18n';
import { AuthInputRow } from './components/auth-input-row';
import { AuthSelectRow } from './components/auth-select-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

export const HawkAuth: FC = () => (
  <AuthTableBody>
    <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
    <AuthInputRow label={t('auth.authId')} property='id' />
    <AuthInputRow label={t('auth.authKey')} property='key' />
    <AuthSelectRow
      label={t('auth.algorithm')}
      property='algorithm'
      options={[
        {
          name: HAWK_ALGORITHM_SHA256,
          value: HAWK_ALGORITHM_SHA256,
        },
        {
          name: HAWK_ALGORITHM_SHA1,
          value: HAWK_ALGORITHM_SHA1,
        },
      ]}
    />
    <AuthInputRow label={t('auth.ext')} property='ext' />
    <AuthToggleRow label={t('auth.validatePayload')} property='validatePayload' />
  </AuthTableBody>
);
