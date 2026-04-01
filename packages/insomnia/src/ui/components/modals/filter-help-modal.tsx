import React, { FC, forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { t } from '../../../common/i18n';
import { Link } from '../base/link';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';

interface HelpExample {
  code: string;
  description: string;
}

const HelpExamples: FC<{ helpExamples: HelpExample[] }> = ({ helpExamples }) => (
  <table className="table--fancy pad-top-sm">
    <tbody>
      {helpExamples.map(({ code, description }) => (
        <tr key={code}>
          <td><code className="selectable">{code}</code></td>
          {description}
        </tr>
      ))}
    </tbody>
  </table>
);

const JSONPathHelp: FC = () => (
  <ModalBody className="pad">
    <p>
      {t('filterHelp.useJsonPathPrefix')} <Link href="http://goessner.net/articles/JsonPath/">JSONPath</Link> {t('filterHelp.useJsonPathSuffix')}
    </p>
    <HelpExamples
      helpExamples={[
        { code: '$.store.books[*].title', description: t('filterHelp.getTitlesOfAllBooks') },
        { code: '$.store.books[?(@.price < 10)].title', description: t('filterHelp.getBooksLessThan10') },
        { code: '$.store.books[-1:]', description: t('filterHelp.getLastBook') },
        { code: '$.store.books.length', description: t('filterHelp.getNumberOfBooks') },
        { code: '$.store.books[?(@.title.match(/lord.*rings/i))]', description: t('filterHelp.getBookByTitleRegex') },
      ]}
    />
    <p className="notice info">
      {t('filterHelp.noStandardPrefix')} <Link href="https://cburgmer.github.io/json-path-comparison/">{t('filterHelp.noStandard')}</Link> {t('filterHelp.noStandardSuffix')} <Link href="https://www.npmjs.com/package/jsonpath-plus">jsonpath-plus</Link>.
    </p>
  </ModalBody>
);

const XPathHelp: FC = () => (
  <ModalBody className="pad">
    <p>
      {t('filterHelp.useXPathPrefix')} <Link href="https://www.w3.org/TR/xpath/">XPath</Link> {t('filterHelp.useXPathSuffix')}
    </p>
    <HelpExamples
      helpExamples={[
        { code: '/store/books/title', description: t('filterHelp.getTitlesOfAllBooks') },
        { code: '/store/books[price < 10]', description: t('filterHelp.getBooksLessThan10') },
        { code: '/store/books[last()]', description: t('filterHelp.getLastBook') },
        { code: 'count(/store/books)', description: t('filterHelp.getNumberOfBooks') },
      ]}
    />
  </ModalBody>
);
interface FilterHelpModalOptions {
  isJSON: boolean;
}
export interface FilterHelpModalHandle {
  show: (options: FilterHelpModalOptions) => void;
  hide: () => void;
}

export const FilterHelpModal = forwardRef<FilterHelpModalHandle, ModalProps>((_, ref) => {
  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<FilterHelpModalOptions>({
    isJSON: true,
  });

  useImperativeHandle(ref, () => ({
    hide: () => {
      modalRef.current?.hide();
    },
    show: options => {
      const { isJSON } = options;
      setState({ isJSON });
      modalRef.current?.show();
    },
  }), []);
  const { isJSON } = state;
  const isXPath = !isJSON;
  return (
    <Modal ref={modalRef}>
      <ModalHeader>{t('filterHelp.responseFilteringHelp')}</ModalHeader>
      {isJSON ? <JSONPathHelp /> : null}
      {isXPath ? <XPathHelp /> : null}
    </Modal>
  );
});
FilterHelpModal.displayName = 'FilterHelpModal';
