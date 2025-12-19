import React, { FC, useState } from 'react';
import { Cookie } from 'tough-cookie';

import { t } from '../../../common/i18n';
import { CookiesModal } from '../modals/cookies-modal';

interface Props {
  cookiesSent?: boolean | null;
  cookiesStored?: boolean | null;
  headers: any[];
}

export const ResponseCookiesViewer: FC<Props> = props => {
  const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
  const renderRow = (h: any, i: number) => {
    let cookie: Cookie | undefined | null = null;

    try {
      cookie = h ? Cookie.parse(h.value || '') : null;
    } catch (err) {
      console.warn('Failed to parse set-cookie header', h);
    }

    const blank = <span className="super-duper-faint italic">--</span>;
    return <tr className="selectable" key={i}>
      <td>{cookie ? cookie.key : blank}</td>
      <td className="force-wrap">{cookie ? cookie.value : blank}</td>
    </tr>;
  };

  const {
    headers,
    cookiesSent,
    cookiesStored,
  } = props;
  const notifyNotStored = !cookiesStored && headers.length;
  let noticeMessage: string | null = null;
  let noticeMessageKey: string | null = null;

  if (!cookiesSent && notifyNotStored) {
    noticeMessage = t('responseCookiesViewer.sendingAndStoring');
    noticeMessageKey = 'sendingAndStoring';
  } else if (!cookiesSent) {
    noticeMessage = t('responseCookiesViewer.sending');
    noticeMessageKey = 'sending';
  } else if (notifyNotStored) {
    noticeMessage = t('responseCookiesViewer.storing');
    noticeMessageKey = 'storing';
  }

  return <div>
    {noticeMessage && <div className="notice info margin-bottom no-margin-top">
      <p>
        {t('responseCookiesViewer.automaticDisabled').replace('{{action}}', noticeMessage)}
      </p>
    </div>}

    <table className="table--fancy table--striped table--compact">
      <thead>
        <tr>
          <th>{t('responseCookiesViewer.name')}</th>
          <th>{t('responseCookiesViewer.value')}</th>
        </tr>
      </thead>
      <tbody>{!headers.length ? renderRow(null, -1) : headers.map(renderRow)}</tbody>
    </table>
    <p className="pad-top">
      <button className="pull-right btn btn--clicky" onClick={() => setIsCookieModalOpen(true)}>
        {t('responseCookiesViewer.manageCookies')}
      </button>
    </p>
    {isCookieModalOpen && (
      <CookiesModal
        onHide={() => setIsCookieModalOpen(false)}
      />
    )}
  </div>;
};
