import React, { ChangeEvent, FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import { t } from '../../../../common/i18n';
import { toKebabCase } from '../../../../common/misc';
import accessTokenUrls from '../../../../datasets/access-token-urls';
import authorizationUrls from '../../../../datasets/authorization-urls';
import * as models from '../../../../models';
import type { OAuth2Token } from '../../../../models/o-auth-2-token';
import type { AuthTypeOAuth2, OAuth2ResponseType, Request } from '../../../../models/request';
import {
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_CLIENT_CREDENTIALS,
  GRANT_TYPE_IMPLICIT,
  GRANT_TYPE_PASSWORD,
  PKCE_CHALLENGE_PLAIN,
  PKCE_CHALLENGE_S256,
} from '../../../../network/o-auth-2/constants';
import { getOAuth2Token } from '../../../../network/o-auth-2/get-token';
import { initNewOAuthSession } from '../../../../network/o-auth-2/get-token';
import { useNunjucks } from '../../../context/nunjucks/use-nunjucks';
import { RequestLoaderData } from '../../../routes/request';
import { Link } from '../../base/link';
import { showModal } from '../../modals';
import { ResponseDebugModal } from '../../modals/response-debug-modal';
import { Button } from '../../themed-button';
import { TimeFromNow } from '../../time-from-now';
import { AuthAccordion } from './components/auth-accordion';
import { AuthInputRow } from './components/auth-input-row';
import { AuthSelectRow } from './components/auth-select-row';
import { AuthTableBody } from './components/auth-table-body';
import { AuthToggleRow } from './components/auth-toggle-row';
const getAuthorizationUrls = () => authorizationUrls;
const getAccessTokenUrls = () => accessTokenUrls;

const grantTypeOptions = [
  {
    name: t('auth.authorizationCode'),
    value: GRANT_TYPE_AUTHORIZATION_CODE,
  },
  {
    name: t('auth.implicit'),
    value: GRANT_TYPE_IMPLICIT,
  },
  {
    name: t('auth.resourceOwnerPasswordCredentials'),
    value: GRANT_TYPE_PASSWORD,
  },
  {
    name: t('auth.clientCredentials'),
    value: GRANT_TYPE_CLIENT_CREDENTIALS,
  },
];

const pkceMethodOptions = [
  {
    name: 'SHA-256',
    value: PKCE_CHALLENGE_S256,
  },
  {
    name: t('auth.plain'),
    value: PKCE_CHALLENGE_PLAIN,
  },
];

const responseTypeOptions: { name: string; value: OAuth2ResponseType }[] = [
  {
    name: t('auth.accessToken'),
    value: 'token',
  },
  {
    name: t('auth.identityToken'),
    value: 'id_token',
  },
  {
    name: t('auth.idAndAccessToken'),
    value: 'id_token token',
  },
];

const credentialsInBodyOptions = [
  {
    name: t('auth.asBasicAuthHeaderDefault'),
    value: 'false',
  },
  {
    name: t('auth.inRequestBody'),
    value: 'true',
  },
];

const getFields = (authentication: Request['authentication']) => {
  const clientId = <AuthInputRow label={t('auth.clientId')} property='clientId' key='clientId' />;
  const clientSecret = <AuthInputRow label={t('auth.clientSecret')} property='clientSecret' key='clientSecret' />;
  const usePkce = <AuthToggleRow label={t('auth.usePkce')} property='usePkce' key='usePkce' onTitle={t('auth.disablePkce')} offTitle={t('auth.enablePkce')} />;
  const pkceMethod = <AuthSelectRow
    label={t('auth.codeChallengeMethod')}
    property='pkceMethod'
    key='pkceMethod'
    disabled={!authentication.usePkce}
    options={pkceMethodOptions}
  />;
  const authorizationUrl = <AuthInputRow label={t('auth.authorizationUrl')} property='authorizationUrl' key='authorizationUrl' getAutocompleteConstants={getAuthorizationUrls} />;
  const accessTokenUrl = <AuthInputRow label={t('auth.accessTokenUrl')} property='accessTokenUrl' key='accessTokenUrl' getAutocompleteConstants={getAccessTokenUrls} />;
  const redirectUri = <AuthInputRow label={t('auth.redirectUrl')} property='redirectUrl' key='redirectUrl' help={t('auth.redirectUrlHelp')} />;
  const state = <AuthInputRow label={t('auth.state')} property='state' key='state' />;
  const scope = <AuthInputRow label={t('auth.scope')} property='scope' key='scope' />;
  const username = <AuthInputRow label={t('auth.username')} property='username' key='username' />;
  const password = <AuthInputRow label={t('auth.password')} property='password' key='password' mask />;
  const tokenPrefix = <AuthInputRow label={t('auth.headerPrefix')} property='tokenPrefix' key='tokenPrefix' help={t('auth.headerPrefixHelp')} />;
  const responseType = <AuthSelectRow
    label={t('auth.responseType')}
    property='responseType'
    key='responseType'
    options={responseTypeOptions}
    help={t('auth.responseTypeHelp')}
  />;
  const audience = <AuthInputRow label={t('auth.audience')} property='audience' key='audience' help={t('auth.audienceHelp')} />;
  const resource = <AuthInputRow label={t('auth.resource')} property='resource' key='resource' help={t('auth.resourceHelp')} />;
  const origin = <AuthInputRow label={t('auth.origin')} property='origin' key='origin' help={t('auth.originHelp')} />;
  const credentialsInBody = <AuthSelectRow
    label={t('auth.credentials')}
    property='credentialsInBody'
    key='credentialsInBody'
    options={credentialsInBodyOptions}
    help={t('auth.credentialsHelp')}
  />;

  return {
    clientId,
    clientSecret,
    usePkce,
    pkceMethod,
    authorizationUrl,
    accessTokenUrl,
    redirectUri,
    state,
    scope,
    username,
    password,
    tokenPrefix,
    responseType,
    audience,
    resource,
    origin,
    credentialsInBody,
  };
};

const getFieldsForGrantType = (authentication: Request['authentication']) => {
  const {
    clientId,
    clientSecret,
    usePkce,
    pkceMethod,
    authorizationUrl,
    accessTokenUrl,
    redirectUri,
    state,
    scope,
    username,
    password,
    tokenPrefix,
    responseType,
    audience,
    resource,
    origin,
    credentialsInBody,
  } = getFields(authentication);

  const { grantType } = authentication;

  let basic: ReactNode[] = [];
  let advanced: ReactNode[] = [];

  if (grantType === GRANT_TYPE_AUTHORIZATION_CODE) {
    basic = [
      authorizationUrl,
      accessTokenUrl,
      clientId,
      clientSecret,
      usePkce,
      pkceMethod,
      redirectUri,
    ];

    advanced = [
      scope,
      state,
      credentialsInBody,
      tokenPrefix,
      audience,
      resource,
      origin,
    ];
  } else if (grantType === GRANT_TYPE_CLIENT_CREDENTIALS) {
    basic = [
      accessTokenUrl,
      clientId,
      clientSecret,
    ];

    advanced = [
      scope,
      credentialsInBody,
      tokenPrefix,
      audience,
      resource,
    ];
  } else if (grantType === GRANT_TYPE_PASSWORD) {
    basic = [
      username,
      password,
      accessTokenUrl,
      clientId,
      clientSecret,
    ];

    advanced = [
      scope,
      credentialsInBody,
      tokenPrefix,
      audience,
    ];
  } else if (grantType === GRANT_TYPE_IMPLICIT) {
    basic = [
      authorizationUrl,
      clientId,
      redirectUri,
    ];

    advanced = [
      responseType,
      scope,
      state,
      tokenPrefix,
      audience,
    ];
  }

  return {
    basic,
    advanced,
  };
};

export const OAuth2Auth: FC = () => {
  const { activeRequest: { authentication } } = useRouteLoaderData('request/:requestId') as RequestLoaderData;

  const { basic, advanced } = getFieldsForGrantType(authentication);

  return (
    <>
      <AuthTableBody>
        <AuthToggleRow label={t('auth.enabled')} property="disabled" invert />
        <AuthSelectRow
          label={t('auth.grantType')}
          property='grantType'
          options={grantTypeOptions}
        />
        {basic}
        <AuthAccordion accordionKey='OAuth2AdvancedOptions' label={t('auth.advancedOptions')}>
          {advanced}
          {
            <tr>
              <td />
              <td className="wide">
                <div className="pad-top text-right">
                  <button className="btn btn--clicky" onClick={initNewOAuthSession}>
                    {t('auth.clearOAuth2Session')}
                  </button>
                </div>
              </td>
            </tr>
          }
        </AuthAccordion>
      </AuthTableBody>
      <div className='pad'>
        <OAuth2Tokens />
      </div>
    </>
  );
};
/**
  Finds epoch's digit count and converts it to make it exactly 13 digits.
  Which is the epoch millisecond representation. (trims last 2 digits)
*/
export function convertEpochToMilliseconds(epoch: number) {
  const expDigitCount = epoch.toString().length;
  return parseInt(String(epoch * 10 ** (13 - expDigitCount)), 10);
}
const renderIdentityTokenExpiry = (token?: Pick<OAuth2Token, 'identityToken'>) => {
  if (!token || !token.identityToken) {
    return;
  }

  const base64Url = token.identityToken.split('.')[1];
  let decodedString = '';

  try {
    decodedString = window.atob(base64Url);
  } catch (error) {
    return;
  }

  try {
    const { exp } = JSON.parse(decodedString);
    if (!exp) {
      return `(${t('auth.neverExpires')})`;
    }
    const convertedExp = convertEpochToMilliseconds(exp);
    return (
      <span>
        &#x28;{t('auth.expires')} <TimeFromNow timestamp={convertedExp} />
        &#x29;
      </span>
    );
  } catch (error) {
    console.error(error);
    return '';
  }
};

const renderAccessTokenExpiry = (token?: Pick<OAuth2Token, 'accessToken' | 'expiresAt'>) => {
  if (!token || !token.accessToken) {
    return null;
  }

  if (!token.expiresAt) {
    return `(${t('auth.neverExpires')})`;
  }

  return (
    <span>
      &#x28;{t('auth.expires')} <TimeFromNow timestamp={token.expiresAt} />
      &#x29;
    </span>
  );
};

const OAuth2TokenInput: FC<{ token: OAuth2Token | null; label: string; property: keyof Pick<OAuth2Token, 'accessToken' | 'refreshToken' | 'identityToken'> }> = ({ token, label, property }) => {
  const { activeRequest } = useRouteLoaderData('request/:requestId') as RequestLoaderData;

  const onChange = async ({ currentTarget: { value } }: ChangeEvent<HTMLInputElement>) => {
    if (token) {
      await models.oAuth2Token.update(token, { [property]: value });
    } else {
      await models.oAuth2Token.create({ [property]: value, parentId: activeRequest._id });
    }
  };

  const expiryLabel = useMemo(() => {
    if (property === 'identityToken') {
      return token && renderIdentityTokenExpiry(token);
    } else if (property === 'accessToken') {
      return token && renderAccessTokenExpiry(token);
    } else {
      return null;
    }
  }, [property, token]);

  const id = toKebabCase(label);

  return (
    <div className='form-control form-control--outlined'>
      <label htmlFor={id}>
        <small>{label}{expiryLabel ? <em> {expiryLabel}</em> : null}</small>
        <input
          value={token?.[property] || ''}
          placeholder={t('auth.notAvailable')}
          onChange={onChange}
        />
      </label>
    </div>
  );
};

const OAuth2Error: FC<{ token: OAuth2Token | null }> = ({ token }) => {
  const debug = () => {
    if (!token || !token.xResponseId) {
      return;
    }

    showModal(ResponseDebugModal, {
      responseId: token.xResponseId,
      showBody: true,
    });
  };

  const debugButton = token?.xResponseId ? (
    <Button
      onClick={debug}
      className="margin-top-sm"
      title={t('auth.viewResponseTimeline')}
    >
      <i className="fa fa-bug space-right" /> {t('auth.responseTimeline')}
    </Button>
  ) : null;

  const errorUriButton = token?.errorUri ? (
    <Link href={token.errorUri} title={token.errorUri} className="space-left icon">
      <i className="fa fa-question-circle" />
    </Link>
  ) : null;

  const error = token ? token.error || token.xError : null;

  if (token && error) {
    const { errorDescription } = token;
    return (
      <div className="notice error margin-bottom">
        <h2 className="no-margin-top txt-lg force-wrap">{error}</h2>
        <p>
          {errorDescription || t('auth.noDescriptionProvided')}
          {errorUriButton}
        </p>
        {debugButton}
      </div>
    );
  }
  return debugButton;
};

const OAuth2Tokens: FC = () => {
  const { activeRequest: { authentication, _id: requestId } } = useRouteLoaderData('request/:requestId') as RequestLoaderData;
  const [token, setToken] = useState<OAuth2Token | null>(null);
  useEffect(() => {
    const fn = async () => {
      const token = await models.oAuth2Token.getByParentId(requestId);
      setToken(token);
    };
    fn();
  }, [requestId]);
  const { handleRender } = useNunjucks();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className='notice subtle text-left'>
      {error && (
        <p className="selectable notice warning margin-bottom">
          {error}
        </p>
      )}
      <OAuth2Error token={token} />
      <OAuth2TokenInput token={token} label={t('auth.refreshToken')} property='refreshToken' />
      <OAuth2TokenInput token={token} label={t('auth.identityToken')} property='identityToken' />
      <OAuth2TokenInput token={token} label={t('auth.accessToken')} property='accessToken' />
      <div className='pad-top text-right'>
        {token ? (
          <button
            className="btn btn--clicky"
            disabled={!token}
            onClick={() => {
              if (token) {
                setToken(null);
                models.oAuth2Token.remove(token);
              }
            }}
          >
            {t('modal.clear')}
          </button>
        ) : null}
        &nbsp;&nbsp;
        <button
          className="btn btn--clicky"
          onClick={async () => {
            setError('');
            setLoading(true);

            try {
              const renderedAuthentication = await handleRender(authentication) as AuthTypeOAuth2;
              const t = await getOAuth2Token(requestId, renderedAuthentication, true);
              setToken(t);
              setLoading(false);
            } catch (err) {
              // Clear existing tokens if there's an error
              if (token) {
                setToken(null);
                models.oAuth2Token.remove(token);
              }
              setError(err.message);
              setLoading(false);
            }
          }}
          disabled={loading}
        >
          {loading
            ? token
              ? t('auth.refreshing')
              : t('auth.fetching')
            : token
              ? t('auth.refreshTokenAction')
              : t('auth.fetchTokens')}
        </button>
      </div>
    </div>
  );
};
