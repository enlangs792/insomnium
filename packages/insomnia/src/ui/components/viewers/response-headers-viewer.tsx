import React, { FC, Fragment, useMemo } from 'react';
import styled from 'styled-components';
import { URL } from 'url';

import { t } from '../../../common/i18n';
import type { ResponseHeader } from '../../../models/response';
import { CopyButton } from '../base/copy-button';
import { Link } from '../base/link';

interface Props {
  headers: ResponseHeader[];
}

const validateURL = ({ value }: ResponseHeader) => {
  try {
    const parsedUrl = new URL(value);
    return Boolean(parsedUrl.hostname);
  } catch {
    return false;
  }
};

const headerAsString = (header: ResponseHeader) => `${header.name}: ${header.value}`;

const StyledTableDataCell = styled.td.attrs({
  className: 'force-wrap',
})({
  width: '50%',
});

export const ResponseHeadersViewer: FC<Props> = ({ headers }) => {
  const headersString = useMemo(() => headers.map(headerAsString).join('\n'), [headers]);

  return (
    <Fragment>
      <table className="table--fancy table--striped table--compact">
        <thead>
          <tr>
            <th>{t('responseHeaders.name')}</th>
            <th>{t('responseHeaders.value')}</th>
          </tr>
        </thead>
        <tbody>
          {headers.map(header => (
            <tr className="selectable" key={headerAsString(header)}>
              <StyledTableDataCell>
                {header.name}
              </StyledTableDataCell>
              <StyledTableDataCell>
                {validateURL(header) ? <Link href={header.value}>{header.value}</Link> : header.value}
              </StyledTableDataCell>
            </tr>
          ))}
        </tbody>
      </table>
      <p key="copy" className="pad-top">
        <CopyButton className="pull-right" content={headersString} />
      </p>
    </Fragment>
  );
};
