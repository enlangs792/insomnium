import React, { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';
import { useFetcher, useRevalidator } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { t } from '../../../common/i18n';
import { database as db } from '../../../common/database';
import { getWorkspaceLabel } from '../../../common/get-workspace-label';
import { CaCertificate } from '../../../models/ca-certificate';
import type { ClientCertificate } from '../../../models/client-certificate';
import * as models from '../../../models/index';
import { isRequest } from '../../../models/request';
import { Workspace } from '../../../models/workspace';
import { WorkspaceMeta } from '../../../models/workspace-meta';
import { guard } from '../../../utils/guard';
import { FileInputButton } from '../base/file-input-button';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { PromptButton } from '../base/prompt-button';
import { PanelContainer, TabItem, Tabs } from '../base/tabs';
import { HelpTooltip } from '../help-tooltip';
import { MarkdownEditor } from '../markdown-editor';
import { PasswordViewer } from '../viewers/password-viewer';
const CertificateFields = styled.div({
  display: 'flex',
  flexDirection: 'column',
  margin: 'var(--padding-sm) 0',
});

const CertificateField: FC<{
  title: string;
  value: string | null;
  privateText?: boolean;
  optional?: boolean;
}> = ({
  title,
  value,
  privateText,
  optional,
}) => {
  if (optional && value === null) {
    return null;
  }

  let display: ReactNode = value;
  if (privateText) {
    display = <PasswordViewer text={value} />;
  } else {
    display = <span className="monospace selectable">{value}</span>;
  }

    return (
      <span className="pad-right no-wrap">
        <strong>{title}:</strong>{' '}{display}
      </span>
    );
  };

interface WorkspaceSettingsModalState {
  showAddCertificateForm: boolean;
  host: string;
  crtPath: string;
  keyPath: string;
  pfxPath: string;
  isPrivate: boolean;
  passphrase: string;
  showDescription: boolean;
  defaultPreviewMode: boolean;
}
interface Props extends ModalProps {
  workspace: Workspace;
  workspaceMeta: WorkspaceMeta;
  clientCertificates: ClientCertificate[];
  caCertificate: CaCertificate | null;
}
export const WorkspaceSettingsModal = ({ workspace, workspaceMeta, clientCertificates, caCertificate, onHide }: Props) => {
  const hasDescription = !!workspace.description;

  const modalRef = useRef<ModalHandle>(null);
  const [state, setState] = useState<WorkspaceSettingsModalState>({
    showAddCertificateForm: false,
    host: '',
    crtPath: '',
    keyPath: '',
    pfxPath: '',
    passphrase: '',
    isPrivate: false,
    showDescription: hasDescription,
    defaultPreviewMode: hasDescription,
  });
  const { revalidate } = useRevalidator();
  const activeWorkspaceName = workspace.name;
  useEffect(() => {
    modalRef.current?.show();
  }, []);

  const { organizationId, projectId } = useParams<{ organizationId: string; projectId: string }>();
  const workspaceFetcher = useFetcher();
  const workspacePatcher = (workspaceId: string, patch: Partial<Workspace>) => {
    workspaceFetcher.submit({ ...patch, workspaceId }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/update`,
      method: 'post',
      encType: 'application/json',
    });
  };

  const _handleClearAllResponses = async () => {
    if (!workspace) {
      return;
    }
    const docs = await db.withDescendants(workspace, models.request.type);
    const requests = docs.filter(isRequest);
    for (const req of requests) {
      await models.response.removeForRequest(req._id);
    }
    modalRef.current?.hide();
  };

  const _handleToggleCertificateForm = () => {
    setState({
      ...state,
      showAddCertificateForm: !state.showAddCertificateForm,
      crtPath: '',
      keyPath: '',
      pfxPath: '',
      host: '',
      passphrase: '',
      isPrivate: false,
    });
  };
  const _handleCreateCertificate = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { pfxPath, crtPath, keyPath, host, passphrase, isPrivate } = state;

    newClientCert({
      host,
      isPrivate,
      parentId: workspace._id,
      passphrase: passphrase || null,
      disabled: false,
      cert: crtPath || null,
      key: keyPath || null,
      pfx: pfxPath || null,
    });
    _handleToggleCertificateForm();
  };
  const _handleRemoveWorkspace = async () => {
    const workspaceId = workspace._id;
    workspaceFetcher.submit({ workspaceId }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/delete`,
      method: 'post',
    });
  };

  const renderCertificate = (certificate: ClientCertificate) => {
    return (
      <div className="row-spaced" key={certificate._id}>
        <CertificateFields>
          <CertificateField title={t('workspaceSettings.host')} value={certificate.host} />
          {certificate.pfx ? (
            <CertificateField title={t('workspaceSettings.pfx')} value={certificate.pfx} />
          ) : (
            <CertificateField title={t('workspaceSettings.crt')} value={certificate.cert} />
          )}
          <CertificateField title={t('workspaceSettings.key')} value={certificate.key} optional />
          <CertificateField title={t('workspaceSettings.passphrase')} value={certificate.passphrase} privateText optional />
        </CertificateFields>

        <div className="no-wrap">
          <button
            className="btn btn--super-compact width-auto"
            title={t('workspaceSettings.enableOrDisableCertificate')}
            onClick={() => toggleClientCert(certificate)}
          >
            {certificate.disabled ? (
              <i className="fa fa-square-o" />
            ) : (
              <i className="fa fa-check-square-o" />
            )}
          </button>
          <PromptButton
            className="btn btn--super-compact width-auto"
            confirmMessage=""
            onClick={() => deleteClientCert(certificate)}
          >
            <i className="fa fa-trash-o" />
          </PromptButton>
        </div>
      </div>
    );
  };
  const sharedCertificates = clientCertificates.filter(c => !c.isPrivate);
  const privateCertificates = clientCertificates.filter(c => c.isPrivate);
  const {
    pfxPath,
    crtPath,
    keyPath,
    isPrivate,
    showAddCertificateForm,
    showDescription,
    defaultPreviewMode,
  } = state;

  const newCaCert = (path: string) => {
    workspaceFetcher.submit({ parentId: workspace._id, path }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/cacert/new`,
      method: 'post',
      encType: 'application/json',
    });
  };
  const deleteCaCert = () => {
    workspaceFetcher.submit({}, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/cacert/delete`,
      method: 'post',
      encType: 'application/json',
    });
  };
  const toggleCaCert = (caCert: CaCertificate) => {
    workspaceFetcher.submit({ _id: caCert._id, disabled: !caCert.disabled }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/cacert/update`,
      method: 'post',
      encType: 'application/json',
    });
  };
  const newClientCert = (certificate: Partial<ClientCertificate>) => {
    workspaceFetcher.submit(certificate, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/clientcert/new`,
      method: 'post',
      encType: 'application/json',
    });
  };
  const deleteClientCert = (certificate: ClientCertificate) => {
    workspaceFetcher.submit({ _id: certificate._id }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/clientcert/delete`,
      method: 'post',
      encType: 'application/json',
    });
  };
  const toggleClientCert = (certificate: ClientCertificate) => {
    workspaceFetcher.submit({ _id: certificate._id, disabled: !certificate.disabled }, {
      action: `/organization/${organizationId}/project/${projectId}/workspace/${workspace._id}/clientcert/update`,
      method: 'post',
      encType: 'application/json',
    });
  };

  return (
    <OverlayContainer>
      <Modal ref={modalRef} onHide={onHide}>
        {workspace ?
          <ModalHeader key={`header::${workspace._id}`}>
            {t('workspaceSettings.settingsTitle', { type: getWorkspaceLabel(workspace).singular })}{' '}
            <div className="txt-sm selectable faint monospace">{workspace ? workspace._id : ''}</div>
          </ModalHeader> : null}
        {workspace ?
          <ModalBody key={`body::${workspace._id}`} noScroll>
            <Tabs aria-label={t('workspaceSettings.tabsAriaLabel')}>
              <TabItem key="overview" title={t('workspaceSettings.overview')}>
                <PanelContainer className="pad pad-top-sm">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('workspaceSettings.name')}
                      <input
                        type="text"
                        placeholder={t('workspaceSettings.namePlaceholder')}
                        defaultValue={activeWorkspaceName}
                        onChange={event => workspacePatcher(workspace._id, { name: event.target.value })}
                      />
                    </label>
                  </div>
                  <div>
                    {showDescription ? (
                      <MarkdownEditor
                        className="margin-top"
                        defaultPreviewMode={defaultPreviewMode}
                        placeholder={t('workspaceSettings.writeDescription')}
                        defaultValue={workspace.description}
                        onChange={(description: string) => {
                          workspacePatcher(workspace._id, { description });
                          if (state.defaultPreviewMode !== false) {
                            setState(state => ({
                              ...state,
                              defaultPreviewMode: false,
                            }));
                          }
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setState({ ...state, showDescription: true });
                        }}
                        className="btn btn--outlined btn--super-duper-compact"
                      >
                        {t('workspaceSettings.addDescription')}
                      </button>
                    )}
                  </div>
                  <h2>{t('workspaceSettings.actions')}</h2>
                  <div className="form-control form-control--padded">
                    <PromptButton
                      onClick={_handleRemoveWorkspace}
                      className="width-auto btn btn--clicky inline-block"
                    >
                      <i className="fa fa-trash-o" /> {t('menu.delete')}
                    </PromptButton>
                    <PromptButton
                      onClick={_handleClearAllResponses}
                      className="width-auto btn btn--clicky inline-block space-left"
                    >
                      <i className="fa fa-trash-o" /> {t('workspaceSettings.clearAllResponses')}
                    </PromptButton>
                  </div>
                </PanelContainer>
              </TabItem>
              <TabItem key="client-certificates" title={t('workspaceSettings.clientCertificates')}>
                <PanelContainer className="pad">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('workspaceSettings.caCertificate')}
                      <HelpTooltip position="right" className="space-left">
                        {t('workspaceSettings.caCertificateHelp')}
                      </HelpTooltip>
                    </label>
                    <div className="row-spaced">
                      <FileInputButton
                        disabled={caCertificate !== null}
                        className="btn btn--clicky"
                        name={t('workspaceSettings.pemFile')}
                        onChange={newCaCert}
                        path={caCertificate?.path || ''}
                        showFileName
                        showFileIcon
                      />
                      <div className="no-wrap">
                        <button
                          disabled={caCertificate === null}
                          className="btn btn--super-compact width-auto"
                          title={t('workspaceSettings.enableOrDisableCertificate')}
                          onClick={() => caCertificate && toggleCaCert(caCertificate)}
                        >
                          {caCertificate?.disabled !== false ? (
                            <i className="fa fa-square-o" />
                          ) : (
                            <i className="fa fa-check-square-o" />
                          )}
                        </button>
                        <PromptButton
                          disabled={caCertificate === null}
                          className="btn btn--super-compact width-auto"
                          confirmMessage=""
                          doneMessage=""
                          onClick={deleteCaCert}
                        >
                          <i className="fa fa-trash-o" />
                        </PromptButton>
                      </div>
                    </div>
                  </div>
                  {!showAddCertificateForm ? (
                    <div>
                      {clientCertificates.length === 0 ? (
                        <p className="notice surprise margin-top">
                          {t('workspaceSettings.noClientCertificates')}
                        </p>
                      ) : null}

                      {!!sharedCertificates.length && (
                        <div className="form-control form-control--outlined margin-top">
                          <label>
                            {t('workspaceSettings.sharedCertificates')}
                            <HelpTooltip position="right" className="space-left">
                              {t('workspaceSettings.sharedCertificatesHelp')}
                            </HelpTooltip>
                          </label>
                          {sharedCertificates.map(renderCertificate)}
                        </div>
                      )}

                      {!!privateCertificates.length && (
                        <div className="form-control form-control--outlined margin-top">
                          <label>
                            {t('workspaceSettings.privateCertificates')}
                            <HelpTooltip position="right" className="space-left">
                              {t('workspaceSettings.privateCertificatesHelp')}
                            </HelpTooltip>
                          </label>
                          {privateCertificates.map(renderCertificate)}
                        </div>
                      )}
                      <hr className="hr--spaced" />
                      <div className="text-center">
                        <button
                          className="btn btn--clicky auto"
                          onClick={_handleToggleCertificateForm}
                        >
                          {t('workspaceSettings.newCertificate')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={_handleCreateCertificate}>
                      <div className="form-control form-control--outlined no-pad-top">
                        <label>
                          {t('workspaceSettings.host')}
                          <HelpTooltip position="right" className="space-left">
                            {t('workspaceSettings.hostHelp')}
                          </HelpTooltip>
                          <input
                            type="text"
                            required
                            placeholder={t('workspaceSettings.hostPlaceholder')}
                            autoFocus
                            onChange={event => setState({ ...state, host: event.currentTarget.value })}
                          />
                        </label>
                      </div>
                      <div className="form-row">
                        <div className="form-control width-auto">
                          <label>
                            {t('workspaceSettings.pfx')} <span className="faint">({t('workspaceSettings.orPkcs12')})</span>
                            <FileInputButton
                              className="btn btn--clicky"
                              onChange={pfxPath => setState({ ...state, pfxPath })}
                              path={pfxPath}
                              showFileName
                            />
                          </label>
                        </div>
                        <div className="text-center">
                          <br />
                          <br />
                          &nbsp;&nbsp;Or&nbsp;&nbsp;
                        </div>
                        <div className="row-fill">
                          <div className="form-control">
                            <label>
                              {t('workspaceSettings.crtFile')}
                              <FileInputButton
                                className="btn btn--clicky"
                                name={t('workspaceSettings.cert')}
                                onChange={crtPath => setState({ ...state, crtPath })}
                                path={crtPath}
                                showFileName
                              />
                            </label>
                          </div>
                          <div className="form-control">
                            <label>
                              {t('workspaceSettings.keyFile')}
                              <FileInputButton
                                className="btn btn--clicky"
                                name={t('workspaceSettings.key')}
                                onChange={keyPath => setState({ ...state, keyPath })}
                                path={keyPath}
                                showFileName
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="form-control form-control--outlined">
                        <label>
                          {t('workspaceSettings.passphrase')}
                          <input
                            type="password"
                            placeholder="•••••••••••"
                            onChange={event => setState({ ...state, passphrase: event.target.value })}
                          />
                        </label>
                      </div>
                      <div className="form-control form-control--slim">
                        <label>
                          {t('workspaceSettings.private')}
                          <HelpTooltip className="space-left">
                            {t('workspaceSettings.privateHelp')}
                          </HelpTooltip>
                          <input
                            type="checkbox"
                            // @ts-expect-error -- TSCONVERSION boolean not valid
                            value={isPrivate}
                            onChange={event => setState({ ...state, isPrivate: event.target.checked })}
                          />
                        </label>
                      </div>
                      <br />
                      <div className="pad-top text-right">
                        <button
                          type="button"
                          className="btn btn--super-compact space-right"
                          onClick={_handleToggleCertificateForm}
                        >
                          {t('root.cancel')}
                        </button>
                        <button className="btn btn--clicky space-right" type="submit">
                          {t('workspaceSettings.createCertificate')}
                        </button>
                      </div>
                    </form>
                  )}
                </PanelContainer>
              </TabItem>
              {/* <TabItem key="git-sybc" title="Git Sync">
                <PanelContainer className="pad">
                  <div className="form-control form-control--outlined">
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--padding-xs)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(workspaceMeta?.gitRepositoryId)}
                        onChange={async () => {
                          if (workspaceMeta?.gitRepositoryId) {
                            await models.workspaceMeta.update(workspaceMeta, {
                              gitRepositoryId: null,
                            });
                          } else {
                            guard(workspaceMeta, 'Workspace meta not found');

                            const repo = await models.gitRepository.create({
                              uri: '',
                            });

                            await models.workspaceMeta.update(workspaceMeta, {
                              gitRepositoryId: repo._id,
                            });
                          }

                          revalidate();
                        }}
                      />
                      Enable Git Sync
                    </label>
                    <p>
                      By enabling Git Sync, you can sync your workspace with a Git repository. This will disable the ability to sync with Insomnium Sync.
                    </p>
                  </div>
                </PanelContainer>
              </TabItem> */}
            </Tabs>
          </ModalBody> : null}
      </Modal>
    </OverlayContainer>
  );
};
WorkspaceSettingsModal.displayName = 'WorkspaceSettingsModal';
