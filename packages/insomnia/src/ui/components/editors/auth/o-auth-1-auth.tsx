import React, { FC } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import { t } from '../../../../common/i18n';
import {
  OAuth1SignatureMethod,
  SIGNATURE_METHOD_HMAC_SHA1,
  SIGNATURE_METHOD_HMAC_SHA256,
  SIGNATURE_METHOD_PLAINTEXT,
  SIGNATURE_METHOD_RSA_SHA1,
} from '../../../../network/o-auth-1/constants';
import { RequestLoaderData } from '../../../routes/request';
import { AuthInputRow } from './components/auth-input-row';
import { AuthPrivateKeyRow } from './components/auth-private-key-row';
import { AuthSelectRow } from './components/auth-select-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';

const blankForDefault = t('auth.leaveBlankForDefault');
const signatureMethodOptions: {name: string; value: OAuth1SignatureMethod}[] = [{
  name: 'HMAC-SHA1',
  value: SIGNATURE_METHOD_HMAC_SHA1,
},
{
  name: 'HMAC-SHA256',
  value: SIGNATURE_METHOD_HMAC_SHA256,
},
{
  name: 'RSA-SHA1',
  value: SIGNATURE_METHOD_RSA_SHA1,
},
{
  name: 'PLAINTEXT',
  value: SIGNATURE_METHOD_PLAINTEXT,
}];

export const OAuth1Auth: FC = () => {
  const { activeRequest: { authentication: { signatureMethod } } } = useRouteLoaderData('request/:requestId') as RequestLoaderData;

  return (
    <AuthTableBody>
      <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
      <AuthInputRow label={t('auth.consumerKey')} property='consumerKey' />
      <AuthInputRow label={t('auth.consumerSecret')} property='consumerSecret' />
      <AuthInputRow label={t('auth.tokenKey')} property='tokenKey' />
      <AuthInputRow label={t('auth.tokenSecret')} property='tokenSecret' />
      <AuthSelectRow label={t('auth.signatureMethod')} property='signatureMethod' options={signatureMethodOptions} />
      {signatureMethod === SIGNATURE_METHOD_RSA_SHA1 && <AuthPrivateKeyRow label={t('auth.privateKey')} property='privateKey' />}
      <AuthInputRow label={t('auth.callbackUrl')} property='callback' />
      <AuthInputRow label={t('auth.version')} property='version' />
      <AuthInputRow label={t('auth.timestamp')} property='timestamp' help={blankForDefault} />
      <AuthInputRow label={t('auth.realm')} property='realm' help={blankForDefault} />
      <AuthInputRow label={t('auth.nonce')} property='nonce' help={blankForDefault} />
      <AuthInputRow label={t('auth.verifier')} property='verifier' help={blankForDefault} />
      <AuthToggleRow
        label={t('auth.hashBody')}
        property='includeBodyHash'
        help={t('auth.hashBodyHelp')}
      />
    </AuthTableBody>
  );
};
