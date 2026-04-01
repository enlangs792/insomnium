import fs from 'fs';
import React, { FC, useCallback } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import { getPreviewModeName, PREVIEW_MODE_SOURCE, PREVIEW_MODES } from '../../../common/constants';
import { exportHarCurrentRequest } from '../../../common/har';
import { t } from '../../../common/i18n';
import * as models from '../../../models';
import { isRequest } from '../../../models/request';
import { isResponse } from '../../../models/response';
import { useRequestMetaPatcher } from '../../hooks/use-request';
import { RequestLoaderData } from '../../routes/request';
import { Dropdown, DropdownButton, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';

interface Props {
  download: (pretty: boolean) => any;
  copyToClipboard: () => any;
}

export const PreviewModeDropdown: FC<Props> = ({
  download,
  copyToClipboard,
}) => {
  const { activeRequest, activeRequestMeta, activeResponse } = useRouteLoaderData('request/:requestId') as RequestLoaderData;
  const previewMode = activeRequestMeta.previewMode || PREVIEW_MODE_SOURCE;
  const patchRequestMeta = useRequestMetaPatcher();
  const handleDownloadPrettify = useCallback(() => download(true), [download]);

  const handleDownloadNormal = useCallback(() => download(false), [download]);

  const exportAsHAR = useCallback(async () => {
    if (!activeResponse || !activeRequest || !isRequest(activeRequest) || !isResponse(activeResponse)) {
      console.warn('Nothing to download');
      return;
    }

    const data = await exportHarCurrentRequest(activeRequest, activeResponse);
    const har = JSON.stringify(data, null, '\t');

    const { filePath } = await window.dialog.showSaveDialog({
      title: t('previewMode.exportAsHar'),
      buttonLabel: t('responsePane.save'),
      defaultPath: `${activeRequest.name.replace(/ +/g, '_')}-${Date.now()}.har`,
    });

    if (!filePath) {
      return;
    }
    const to = fs.createWriteStream(filePath);
    to.on('error', err => {
      console.warn('Failed to export har', err);
    });
    to.end(har);
  }, [activeRequest, activeResponse]);

  const exportDebugFile = useCallback(async () => {
    if (!activeResponse || !activeRequest || !isResponse(activeResponse)) {
      console.warn('Nothing to download');
      return;
    }

    const timeline = models.response.getTimeline(activeResponse);
    const headers = timeline
      .filter(v => v.name === 'HeaderIn')
      .map(v => v.value)
      .join('');

    const { canceled, filePath } = await window.dialog.showSaveDialog({
      title: t('previewMode.saveFullResponse'),
      buttonLabel: t('responsePane.save'),
      defaultPath: `${activeRequest.name.replace(/ +/g, '_')}-${Date.now()}.txt`,
    });

    if (canceled) {
      return;
    }
    const readStream = models.response.getBodyStream(activeResponse);

    if (readStream && filePath && typeof readStream !== 'string') {
      const to = fs.createWriteStream(filePath);
      to.write(headers);
      readStream.pipe(to);
      to.on('error', err => {
        console.warn('Failed to save full response', err);
      });
    }
  }, [activeRequest, activeResponse]);
  const shouldPrettifyOption = activeResponse?.contentType.includes('json');

  return (
    <Dropdown
      aria-label={t('previewMode.dropdown')}
      triggerButton={
        <DropdownButton className="tall">
          {getPreviewModeName(previewMode)}
          <i className="fa fa-caret-down space-left" />
        </DropdownButton>
      }
    >
      <DropdownSection
        aria-label={t('previewMode.previewModeSection')}
        title={t('previewMode.previewMode')}
      >
        {PREVIEW_MODES.map(mode =>
          <DropdownItem
            key={mode}
            aria-label={getPreviewModeName(mode, true)}
          >
            <ItemContent
              icon={previewMode === mode ? 'check' : 'empty'}
              label={getPreviewModeName(mode, true)}
              onClick={() => patchRequestMeta(activeRequest._id, { previewMode: mode })}
            />
          </DropdownItem>
        )}
      </DropdownSection>
      <DropdownSection
        aria-label={t('previewMode.actionSection')}
        title={t('previewMode.action')}
      >
        <DropdownItem aria-label={t('previewMode.copyRawResponse')}>
          <ItemContent
            icon="copy"
            label={t('previewMode.copyRawResponse')}
            onClick={copyToClipboard}
          />
        </DropdownItem>
        <DropdownItem aria-label={t('previewMode.exportRawResponse')}>
          <ItemContent
            icon="save"
            label={t('previewMode.exportRawResponse')}
            onClick={handleDownloadNormal}
          />
        </DropdownItem>
        <DropdownItem aria-label={t('previewMode.exportPrettifiedResponse')}>
          {shouldPrettifyOption &&
            <ItemContent
              icon="save"
              label={t('previewMode.exportPrettifiedResponse')}
              onClick={handleDownloadPrettify}
            />
          }
        </DropdownItem>
        <DropdownItem aria-label={t('previewMode.exportHttpDebug')}>
          <ItemContent
            icon="bug"
            label={t('previewMode.exportHttpDebug')}
            onClick={exportDebugFile}
          />
        </DropdownItem>
        <DropdownItem aria-label={t('previewMode.exportAsHar')}>
          <ItemContent
            icon="save"
            label={t('previewMode.exportAsHar')}
            onClick={exportAsHAR}
          />
        </DropdownItem>
      </DropdownSection>
    </Dropdown>
  );
};
