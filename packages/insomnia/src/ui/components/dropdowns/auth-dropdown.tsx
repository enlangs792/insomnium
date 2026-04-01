import React, { FC, useCallback } from 'react';
import { useParams, useRouteLoaderData } from 'react-router-dom';

import {
  AuthType,
  getAuthTypeName,
  HAWK_ALGORITHM_SHA256,
} from '../../../common/constants';
import { t } from '../../../common/i18n';
import { RequestAuthentication } from '../../../models/request';
import { SIGNATURE_METHOD_HMAC_SHA1 } from '../../../network/o-auth-1/constants';
import { GRANT_TYPE_AUTHORIZATION_CODE } from '../../../network/o-auth-2/constants';
import { useRequestSetter } from '../../hooks/use-request';
import { RequestLoaderData } from '../../routes/request';
import { Dropdown, DropdownButton, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';
import { showModal } from '../modals';
import { AlertModal } from '../modals/alert-modal';

const defaultTypes: AuthType[] = [
  'apikey',
  'basic',
  'digest',
  'oauth1',
  'oauth2',
  'ntlm',
  'iam',
  'bearer',
  'hawk',
  'asap',
  'netrc',
];

function makeNewAuth(type: string, oldAuth: RequestAuthentication = {}): RequestAuthentication {
  switch (type) {
    // No Auth
    case 'none':
      return {};

    // API Key Authentication
    case 'apikey':
      return {
        type,
        disabled: oldAuth.disabled || false,
        key: oldAuth.key || '',
        value: oldAuth.value || '',
        addTo: oldAuth.addTo || 'header',
      };

    // HTTP Basic Authentication
    case 'basic':
      return {
        type,
        useISO88591: oldAuth.useISO88591 || false,
        disabled: oldAuth.disabled || false,
        username: oldAuth.username || '',
        password: oldAuth.password || '',
      };

    case 'digest':
    case 'ntlm':
      return {
        type,
        disabled: oldAuth.disabled || false,
        username: oldAuth.username || '',
        password: oldAuth.password || '',
      };

    case 'oauth1':
      return {
        type,
        disabled: false,
        signatureMethod: SIGNATURE_METHOD_HMAC_SHA1,
        consumerKey: '',
        consumerSecret: '',
        tokenKey: '',
        tokenSecret: '',
        privateKey: '',
        version: '1.0',
        nonce: '',
        timestamp: '',
        callback: '',
      };

    // OAuth 2.0
    case 'oauth2':
      return {
        type,
        grantType: GRANT_TYPE_AUTHORIZATION_CODE,
      };

    // Aws IAM
    case 'iam':
      return {
        type,
        disabled: oldAuth.disabled || false,
        accessKeyId: oldAuth.accessKeyId || '',
        secretAccessKey: oldAuth.secretAccessKey || '',
        sessionToken: oldAuth.sessionToken || '',
      };

    // Hawk
    case 'hawk':
      return {
        type,
        algorithm: HAWK_ALGORITHM_SHA256,
      };

    // Atlassian ASAP
    case 'asap':
      return {
        type,
        issuer: '',
        subject: '',
        audience: '',
        additionalClaims: '',
        keyId: '',
        privateKey: '',
      };

    // Types needing no defaults
    case 'netrc':
    default:
      return {
        type,
      };
  }
}
interface Props {
  authTypes?: AuthType[];
  disabled?: boolean;
}
export const AuthDropdown: FC<Props> = ({ authTypes = defaultTypes, disabled = false }) => {
  const { activeRequest } = useRouteLoaderData('request/:requestId') as RequestLoaderData;
  const { requestId } = useParams() as { organizationId: string; projectId: string; workspaceId: string; requestId: string };
  const patchRequest = useRequestSetter();
  const onClick = useCallback(async (type: AuthType) => {
    if (!activeRequest || !('authentication' in activeRequest)) {
      return;
    }

    const { authentication } = activeRequest;

    if (type === authentication.type) {
      // Type didn't change
      return;
    }

    const newAuthentication = makeNewAuth(type, authentication);
    const defaultAuthentication = makeNewAuth(authentication.type);

    // Prompt the user if fields will change between new and old
    for (const key of Object.keys(authentication)) {
      if (key === 'type') {
        continue;
      }

      const value = authentication[key];
      const changedSinceDefault = defaultAuthentication[key] !== value;
      const willChange = newAuthentication[key] !== value;

      if (changedSinceDefault && willChange) {
        await showModal(AlertModal, {
          title: t('authDropdown.switchAuthentication'),
          message: t('authDropdown.currentAuthenticationWillBeLost'),
          addCancel: true,
        });
        break;
      }
    }
    patchRequest(requestId, { authentication: newAuthentication });
  }, [activeRequest, patchRequest, requestId]);
  const isCurrent = useCallback((type: AuthType) => {
    if (!activeRequest || !('authentication' in activeRequest)) {
      return false;
    }
    return type === (activeRequest.authentication.type || 'none');
  }, [activeRequest]);

  if (!activeRequest) {
    return null;
  }

  return (
    <Dropdown
      aria-label={t('authDropdown.authenticationDropdown')}
      isDisabled={disabled}
      triggerButton={
        <DropdownButton className="tall">
          {'authentication' in activeRequest ? getAuthTypeName(activeRequest.authentication.type) || t('authDropdown.auth') : t('authDropdown.auth')}
          <i className="fa fa-caret-down space-left" />
        </DropdownButton>
      }
    >
      <DropdownSection
        aria-label={t('authDropdown.authTypesSection')}
        title={t('authDropdown.authTypes')}
      >
        {authTypes.map(authType =>
          <DropdownItem
            key={authType}
            aria-label={getAuthTypeName(authType, true)}
          >
            <ItemContent
              icon={isCurrent(authType) ? 'check' : 'empty'}
              label={getAuthTypeName(authType, true)}
              onClick={() => onClick(authType)}
            />
          </DropdownItem>
        )}
      </DropdownSection>
      <DropdownSection
        aria-label={t('authDropdown.otherTypesSection')}
        title={t('contentTypeDropdown.other')}
      >
        <DropdownItem aria-label={t('authDropdown.none')} key="none">
          <ItemContent
            icon={isCurrent('none') ? 'check' : 'empty'}
            label={t('authDropdown.noAuthentication')}
            onClick={() => onClick('none')}
          />
        </DropdownItem>
      </DropdownSection>
    </Dropdown>
  );
};
