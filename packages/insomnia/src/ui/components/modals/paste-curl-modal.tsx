import React, { useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';

import { t } from '../../../common/i18n';
import { Request } from '../../../models/request';
import { convert } from '../../../utils/importers/convert';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalFooter } from '../base/modal-footer';
import { ModalHeader } from '../base/modal-header';
import { CodeEditor } from '../codemirror/code-editor';

export const PasteCurlModal = ({ onHide, onImport, defaultValue }: ModalProps & { onImport: (req: Partial<Request>) => void; defaultValue?: string }) => {
  const modalRef = useRef<ModalHandle>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [req, setReq] = useState<any>({});

  useEffect(() => {
    async function parseCurlToRequest() {
      try {
        const { data } = await convert(defaultValue || '');
        const { resources } = data;
        const importedRequest = resources[0];
        setIsValid(true);
        setReq(importedRequest);

      } catch (error) {
        console.log('error', error);
        setIsValid(false);
        setReq({});
      } finally {
        modalRef.current?.show();
      }
    }
    parseCurlToRequest();

  }, [defaultValue]);

  return (
    <OverlayContainer onClick={e => e.stopPropagation()}>
      <Modal ref={modalRef} tall onHide={onHide}>
        <ModalHeader>{t('importModal.pasteCurlToImportRequest')}</ModalHeader>
        <ModalBody className="">
          <CodeEditor
            id="paste-curl-content"
            placeholder={t('importModal.pasteCurlRequestHere')}
            className=" border-top"
            mode="text"
            dynamicHeight
            defaultValue={defaultValue}
            onChange={async value => {
              if (!value) {
                return;
              }
              try {
                const { data } = await convert(value);
                const { resources } = data;
                const importedRequest = resources[0];
                setIsValid(true);
                setReq(importedRequest);

              } catch (error) {
                console.log('error', error);
                setIsValid(false);
                setReq({});
              }
            }}
          />
        </ModalBody>
        <ModalFooter>
          <div className="margin-left italic txt-sm truncate">
            {isValid
              ? t('importModal.detectedRequestTo', { method: req.method, url: req.url })
              : t('importModal.invalidInput')}
          </div>
          <div>
            <button className="btn" onClick={() => modalRef.current?.hide()}>
              {t('root.cancel')}
            </button>
            <button
              className="btn"
              onClick={() => {
                onImport(req);
                modalRef.current?.hide();
              }}
              disabled={!isValid}
            >
              {t('importModal.import')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    </OverlayContainer>
  );
};
