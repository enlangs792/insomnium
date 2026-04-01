import { JSONPath } from 'jsonpath-plus';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { docsTemplateTags } from '../../../common/documentation';
import { t } from '../../../common/i18n';
import { GrpcRequest } from '../../../models/grpc-request';
import { Request } from '../../../models/request';
import { WebSocketRequest } from '../../../models/websocket-request';
import { RenderError } from '../../../templating';
import { Link } from '../base/link';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
export interface RequestRenderErrorModalOptions {
  error: RenderError | null;
  request: Request | WebSocketRequest | GrpcRequest | null;
}
export interface RequestRenderErrorModalHandle {
  show: (options: RequestRenderErrorModalOptions) => void;
  hide: () => void;
}

export const RequestRenderErrorModal = forwardRef<RequestRenderErrorModalHandle, ModalProps>((_, ref) => {
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<RequestRenderErrorModalOptions>({
    error: null,
    request: null,
  });
  const { request, error } = state;

  useImperativeHandle(ref, () => ({
    hide: () => {
      modalRef.current?.hide();
    },
    show: options => {
      setState(options);
      modalRef.current?.show();
    },
  }), []);

  const fullPath = `Request.${error?.path}`;
  const result = JSONPath({ json: request, path: `$.${error?.path}` });
  const template = result && result.length ? result[0] : null;
  const locationLabel = template?.includes('\n')
    ? t('requestRenderError.lineOf', { line: error?.location.line || 0 })
    : null;

  return (
    <Modal ref={modalRef}>
      <ModalHeader>{t('requestRenderError.failedToRenderRequest')}</ModalHeader>
      <ModalBody>{request && error ? (
        <div className="pad">
          <div className="notice warning">
            <p>
              {t('requestRenderError.failedToRenderBeforeSending', { path: fullPath })}
            </p>
            <div className="pad-top-sm">
              <Link button href={docsTemplateTags} className="btn btn--clicky">
                {t('requestRenderError.templatingDocumentation')} <i className="fa fa-external-link" />
              </Link>
            </div>
          </div>

          <p>
            <strong>{t('requestRenderError.renderError')}</strong>
            <code className="block selectable">{error.message}</code>
          </p>

          <p>
            <strong>{t('requestRenderError.causedByField')}</strong>
            <code className="block">
              {locationLabel} {fullPath}
            </code>
          </p>
        </div>
      ) : null}</ModalBody>
    </Modal>
  );
});

RequestRenderErrorModal.displayName = 'RequestRenderErrorModal';
