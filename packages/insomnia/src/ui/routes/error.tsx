import React from 'react';
import { FC } from 'react';
import {
  isRouteErrorResponse,
  useNavigate,
  useNavigation,
  useRouteError,
} from 'react-router-dom';
import styled from 'styled-components';

import { t } from '../../common/i18n';
import { DEFAULT_ORGANIZATION_ID } from '../../models/organization';
import { Button } from '../components/themed-button';

const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
});

const Spinner = () => <i className="fa fa-spin fa-refresh" />;

export const ErrorRoute: FC = () => {
  const error = useRouteError();
  const getErrorMessage = (err: any) => {
    if (isRouteErrorResponse(err)) {
      return err.data;
    }
    if (err instanceof Error) {
      return err.message;
    }

    return err?.message || t('error.unknownError');
  };
  const getErrorStack = (err: any) => {
    if (isRouteErrorResponse(err)) {
      return err.error?.stack;
    }
    return err?.stack;
  };

  const navigate = useNavigate();
  const navigation = useNavigation();
  const errorMessage = getErrorMessage(error);

  return (
    <Container>
      <h1 style={{ color: 'var(--color-font)' }}>{t('error.applicationError')}</h1>
      <p style={{ color: 'var(--color-font)' }}>
        {t('error.failedToRender')} <a href="https://github.com/ArchGPT/insomnium/issues">{t('error.githubIssues')}</a>
      </p>
      <span style={{ color: 'var(--color-font)' }}>
        <code className="selectable" style={{ wordBreak: 'break-word', margin: 'var(--padding-sm)' }}>{errorMessage}</code>
      </span>
      <Button onClick={() => navigate(`/organization/${DEFAULT_ORGANIZATION_ID}`)}>
        {t('error.tryToReloadApp')}{' '}
        <span>{navigation.state === 'loading' ? <Spinner /> : null}</span>
      </Button>
      <code className="selectable" style={{ wordBreak: 'break-word', margin: 'var(--padding-sm)' }}>{getErrorStack(error)}</code>
    </Container>
  );
};
