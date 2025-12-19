import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { t } from '../../../common/i18n';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';
// NOTE: this is only used by the plugin api
export interface ErrorModalOptions {
  title?: string;
  error?: Error | null;
  addCancel?: boolean;
  message?: string;
}
export interface ErrorModalHandle {
  show: (options: ErrorModalOptions) => void;
  hide: () => void;
}
export const ErrorModal = forwardRef<ErrorModalHandle, ModalProps>((_, ref) => {
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<ErrorModalOptions>({
    title: '',
    error: null,
    message: '',
    addCancel: false,
  });

  useImperativeHandle(ref, () => ({
    hide: () => {
      modalRef.current?.hide();
    },
    show: options => {
      setState(options);
      modalRef.current?.show();
    },
  }), []);
  const { error, title, addCancel } = state;
  const message = state.message || error?.message;
  return (
    <Modal ref={modalRef}>
      <ModalHeader>{title || t('modal.uhOh')}</ModalHeader>
      <ModalBody className="wide pad">
        {message ? <div className="notice error pre">{message}</div> : null}
        {error && (
          <details>
            <summary>{t('modal.stackTrace')}</summary>
            <pre className="pad-top-sm force-wrap selectable">
              <code className="wide">{error.stack}</code>
            </pre>
          </details>
        )}
      </ModalBody>
      <ModalFooter>
        <div>
          {addCancel ? (
            <button className="btn" onClick={() => modalRef.current?.hide()}>
              {t('modal.cancel')}
            </button>
          ) : null}
          <button className="btn" onClick={() => modalRef.current?.hide()}>
            {t('modal.ok')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
});
ErrorModal.displayName = 'ErrorModal';
