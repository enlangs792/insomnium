import React, { FC } from 'react';

import { t } from '../../../../../common/i18n';
import { AuthToggleRow } from './auth-toggle-row';

export const AuthEnabledRow: FC = () => <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />;
