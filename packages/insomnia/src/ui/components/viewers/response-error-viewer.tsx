import React, { FC, memo } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import { t } from '../../../common/i18n';
import { docsBase } from '../../../common/documentation';
import { RootLoaderData } from '../../routes/root';
import { Link } from '../base/link';
import { showModal } from '../modals/index';
import { SettingsModal } from '../modals/settings-modal';
interface Props {
  error: string;
  url: string;
}
export const ResponseErrorViewer: FC<Props> = memo(({ error }) => {
  let msg: React.ReactNode = null;
  const {
    settings,
  } = useRouteLoaderData('root') as RootLoaderData;
  const { editorFontSize } = settings;

  if (error?.toLowerCase().indexOf('certificate') !== -1) {
    msg = (
      <button className="btn btn--clicky" onClick={() => showModal(SettingsModal)}>
        {t('responseError.disableSslValidation')}
      </button>
    );
  } else if (error?.toLowerCase().indexOf('getaddrinfo') !== -1) {
    msg = (
      <button className="btn btn--clicky" onClick={() => showModal(SettingsModal)}>
        {t('responseError.setupNetworkProxy')}
      </button>
    );
  } else {
    msg = (
      <Link button className="btn btn--clicky" href={docsBase}>
        {t('responseError.documentation')}
      </Link>
    );
  }

  return (
    <div>
      <pre
        className="selectable pad force-pre-wrap"
        style={{
          fontSize: `${editorFontSize}px`,
        }}
      >
        {error}
      </pre>
      <hr />
      <div className="text-center pad">
        <p className="faint pad-left pad-right">{t('responseError.additionalHelp')}</p>
        {msg}
        &nbsp;&nbsp;
        <Link
          button
          className="btn btn--clicky margin-top-sm"
          href="https://github.com/ArchGPT/insomnium#bugs-and-feature-requests"
        >
          {t('responseError.submitIssue')}
        </Link>
      </div>
    </div>
  );
});

ResponseErrorViewer.displayName = 'ResponseError';
