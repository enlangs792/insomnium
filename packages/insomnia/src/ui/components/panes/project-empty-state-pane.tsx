import React, { FC } from 'react';
import styled from 'styled-components';

import { t } from '../../../common/i18n';
import { Button } from '../themed-button';

const Wrapper = styled.div({
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  opacity: 'calc(var(--opacity-subtle) * 0.8)',
});

const Divider = styled.div({
  color: 'var(--color-font)',
  maxWidth: 500,
  width: '100%',
  margin: 'var(--padding-md) 0',
  display: 'flex',
  alignItems: 'center',
  fontSize: 'var(--text-sm)',
  '&::before': {
    content: '""',
    height: '1px',
    backgroundColor: 'var(--color-font)',
    flexGrow: '1',
    opacity: 'calc(var(--opacity-subtle) * 0.8)',
    marginRight: '1rem',
  },
  '&::after': {
    content: '""',
    height: '1px',
    backgroundColor: 'var(--color-font)',
    flexGrow: '1',
    opacity: 'calc(var(--opacity-subtle) * 0.8)',
    marginLeft: '1rem',
  },
});

const Title = styled.div({
  fontWeight: 'bold',
});

interface Props {
  createRequestCollection: () => void;
  createDesignDocument: () => void;
  importFrom: () => void;
  cloneFromGit: () => void;
}

export const EmptyStatePane: FC<Props> = ({ createRequestCollection, createDesignDocument, importFrom, cloneFromGit }) => {
  return (
    <Wrapper>
      <Title>{t('projectEmptyState.title')}</Title>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--padding-md)' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'var(--padding-md)', gap: 'var(--padding-md)' }}>
          <Button
            style={{
              gap: 'var(--padding-xs)',
              flex: 1,
            }}
            onClick={createRequestCollection}
          >
            <i className='fa fa-bars' /> {t('projectEmptyState.newCollection')}
          </Button>
          <Button
            style={{
              gap: 'var(--padding-xs)',
              flex: 1,
            }}
            onClick={createDesignDocument}
          >
            <i className='fa fa-file-o' /> {t('projectEmptyState.newDocument')}
          </Button>
        </div>
        <Divider>{t('projectEmptyState.or')}</Divider>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 'var(--padding-md)' }}>
          <Button
            style={{
              gap: 'var(--padding-xs)',
              flex: 1,
            }}
            onClick={importFrom}
          >
            <i className='fa fa-file-import' /> {t('projectEmptyState.import')}
          </Button>
          <Button
            style={{
              gap: 'var(--padding-xs)',
              flex: 1,
            }}
            onClick={cloneFromGit}
          >
            <i className='fa fa-code-fork' /> {t('projectEmptyState.gitClone')}
          </Button>
        </div>
      </div>
    </Wrapper>
  );
};
