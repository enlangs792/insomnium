import React, { useEffect, useRef, useState } from 'react';
import { OverlayContainer } from 'react-aria';
import { useFetcher, useNavigate, useParams } from 'react-router-dom';

import { t } from '../../../common/i18n';
import * as models from '../../../models';
import { GrpcRequest, isGrpcRequest } from '../../../models/grpc-request';
import { isRequest, Request } from '../../../models/request';
import { isWebSocketRequest, WebSocketRequest } from '../../../models/websocket-request';
import { guard } from '../../../utils/guard';
import { useRequestSetter } from '../../hooks/use-request';
import { ProjectLoaderData } from '../../routes/project';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { CodeEditorHandle } from '../codemirror/code-editor';
import { HelpTooltip } from '../help-tooltip';
import { MarkdownEditor } from '../markdown-editor';

export interface RequestSettingsModalOptions {
  request: Request | GrpcRequest | WebSocketRequest;
}
interface State {
  defaultPreviewMode: boolean;
  activeWorkspaceIdToCopyTo: string;
}

export const RequestSettingsModal = ({ request, onHide }: ModalProps & RequestSettingsModalOptions) => {
  const modalRef = useRef<ModalHandle>(null);
  const editorRef = useRef<CodeEditorHandle>(null);
  const { organizationId, projectId, workspaceId } = useParams() as { organizationId: string; projectId: string; workspaceId: string };
  const workspacesFetcher = useFetcher();
  useEffect(() => {
    const isIdleAndUninitialized = workspacesFetcher.state === 'idle' && !workspacesFetcher.data;
    if (isIdleAndUninitialized) {
      workspacesFetcher.load(`/organization/${organizationId}/project/${projectId}`);
    }
  }, [organizationId, projectId, workspacesFetcher]);
  const projectLoaderData = workspacesFetcher?.data as ProjectLoaderData;
  const workspacesForActiveProject = projectLoaderData?.workspaces.map(w => w.workspace) || [];
  const [state, setState] = useState<State>({
    defaultPreviewMode: !!request?.description,
    activeWorkspaceIdToCopyTo: '',
  });
  useEffect(() => {
    modalRef.current?.show();
  }, []);

  const requestFetcher = useFetcher();
  const patchRequest = useRequestSetter();
  const navigate = useNavigate();
  const duplicateRequest = (r: Partial<Request>) => {
    requestFetcher.submit(JSON.stringify(r),
      {
        action: `/organization/${organizationId}/project/${projectId}/workspace/${workspaceId}/debug/request/${request._id}/duplicate`,
        method: 'post',
        encType: 'application/json',
      });
  };
  async function handleMoveToWorkspace() {
    guard(state.activeWorkspaceIdToCopyTo, 'Workspace ID is required');
    patchRequest(request._id, { parentId: state.activeWorkspaceIdToCopyTo });
    modalRef.current?.hide();
    navigate(`/organization/${organizationId}/project/${projectId}/workspace/${state.activeWorkspaceIdToCopyTo}/debug`);
  }

  async function handleCopyToWorkspace() {
    guard(state.activeWorkspaceIdToCopyTo, 'Workspace ID is required');
    duplicateRequest({ parentId: state.activeWorkspaceIdToCopyTo });
  }
  const { defaultPreviewMode, activeWorkspaceIdToCopyTo } = state;
  const toggleCheckBox = async (event: any) => {
    patchRequest(request._id, { [event.currentTarget.name]: event.currentTarget.checked ? true : false });
  };
  const updateDescription = (description: string) => {
    patchRequest(request._id, { description });
    setState({
      ...state,
      defaultPreviewMode: false,
    });
  };

  return (
    <OverlayContainer>
      <Modal ref={modalRef} onHide={onHide}>
        <ModalHeader>
          {t('requestSettings.title')}{' '}
          <span className="txt-sm selectable faint monospace">{request ? request._id : ''}</span>
        </ModalHeader>
        <ModalBody className="pad">
          <div>
            <div className="form-control form-control--outlined">
              <label>
                {t('requestSettings.name')}{' '}
                <span className="txt-sm faint italic">{t('requestSettings.nameHelp')}</span>
                <input
                  type="text"
                  placeholder={request?.url || t('requestSettings.namePlaceholder')}
                  defaultValue={request?.name}
                  onChange={event => patchRequest(request._id, { name: event.target.value })}
                />
              </label>
            </div>
            {request && isWebSocketRequest(request) && (
              <>
                <MarkdownEditor
                  ref={editorRef}
                  className="margin-top"
                  defaultPreviewMode={defaultPreviewMode}
                  placeholder={t('requestSettings.writeDescription')}
                  defaultValue={request.description}
                  onChange={updateDescription}
                />
                <>
                  <div className="pad-top pad-bottom">
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.sendCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingSendCookies"
                          checked={request.settingSendCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.storeCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingStoreCookies"
                          checked={request.settingStoreCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('requestSettings.followRedirects')} <span className="txt-sm faint italic">{t('requestSettings.followRedirectsHelp')}</span>
                      <select
                        defaultValue={request.settingFollowRedirects}
                        name="settingFollowRedirects"
                        onChange={toggleCheckBox}
                      >
                        <option value={'global'}>{t('requestSettings.useGlobalSetting')}</option>
                        <option value={'off'}>{t('requestSettings.dontFollowRedirects')}</option>
                        <option value={'on'}>{t('requestSettings.followRedirectsOption')}</option>
                      </select>
                    </label>
                  </div>
                </>
                <hr />
                <div className="form-row">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('requestSettings.moveCopyToWorkspace')}
                      <HelpTooltip position="top" className="space-left">
                        {t('requestSettings.moveCopyToWorkspaceHelp')}
                      </HelpTooltip>
                      <select
                        value={activeWorkspaceIdToCopyTo}
                        onChange={event => {
                          const activeWorkspaceIdToCopyTo = event.currentTarget.value;
                          setState(state => ({ ...state, activeWorkspaceIdToCopyTo }));
                        }}
                      >
                        <option value="">{t('requestSettings.selectWorkspace')}</option>
                        {workspacesForActiveProject.map(w => {
                          if (workspaceId === w._id) {
                            return null;
                          }

                          return (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!activeWorkspaceIdToCopyTo}
                      className="btn btn--clicky"
                      onClick={handleCopyToWorkspace}
                    >
                      {t('requestSettings.copy')}
                    </button>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!activeWorkspaceIdToCopyTo}
                      className="btn btn--clicky"
                      onClick={handleMoveToWorkspace}
                    >
                      {t('requestSettings.move')}
                    </button>
                  </div>
                </div>
              </>)}
            {request && isGrpcRequest(request) && (
              <p className="faint italic">
                {t('requestSettings.grpcFeatureRequest')}{' '}
                <a href={'https://github.com/ArchGPT/insomnium/issues/new/choose'}>{t('requestSettings.featureRequest')}</a>!
              </p>
            )}
            {request && isRequest(request) && (
              <>
                <MarkdownEditor
                  ref={editorRef}
                  className="margin-top"
                  defaultPreviewMode={defaultPreviewMode}
                  placeholder={t('requestSettings.writeDescription')}
                  defaultValue={request.description}
                  onChange={updateDescription}
                />
                <>
                  <div className="pad-top pad-bottom">
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.sendCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingSendCookies"
                          checked={request.settingSendCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.storeCookiesAutomatically')}
                        <input
                          type="checkbox"
                          name="settingStoreCookies"
                          checked={request.settingStoreCookies}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.automaticallyEncodeUrl')}
                        <input
                          type="checkbox"
                          name="settingEncodeUrl"
                          checked={request.settingEncodeUrl}
                          onChange={toggleCheckBox}
                        />
                        <HelpTooltip position="top" className="space-left">
                          {t('requestSettings.automaticallyEncodeUrlHelp')}
                        </HelpTooltip>
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.skipRenderingRequestBody')}
                        <input
                          type="checkbox"
                          name="settingDisableRenderRequestBody"
                          checked={request.settingDisableRenderRequestBody}
                          onChange={toggleCheckBox}
                        />
                        <HelpTooltip position="top" className="space-left">
                          {t('requestSettings.skipRenderingRequestBodyHelp')}
                        </HelpTooltip>
                      </label>
                    </div>
                    <div className="form-control form-control--thin">
                      <label>
                        {t('requestSettings.rebuildPathDotSequences')}
                        <HelpTooltip position="top" className="space-left">
                          {t('requestSettings.rebuildPathDotSequencesHelp')}
                        </HelpTooltip>
                        <input
                          type="checkbox"
                          name="settingRebuildPath"
                          checked={request['settingRebuildPath']}
                          onChange={toggleCheckBox}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('requestSettings.followRedirects')} <span className="txt-sm faint italic">{t('requestSettings.followRedirectsHelp')}</span>
                      <select
                        defaultValue={request.settingFollowRedirects}
                        name="settingFollowRedirects"
                        onChange={async event => {
                          const updated = await models.request.update(request, {
                            [event.currentTarget.name]: event.currentTarget.value,
                          });
                          setState(state => ({ ...state, request: updated }));
                        }}
                      >
                        <option value={'global'}>{t('requestSettings.useGlobalSetting')}</option>
                        <option value={'off'}>{t('requestSettings.dontFollowRedirects')}</option>
                        <option value={'on'}>{t('requestSettings.followRedirectsOption')}</option>
                      </select>
                    </label>
                  </div>
                </>
                <hr />
                <div className="form-row">
                  <div className="form-control form-control--outlined">
                    <label>
                      {t('requestSettings.moveCopyToWorkspace')}
                      <HelpTooltip position="top" className="space-left">
                        {t('requestSettings.moveCopyToWorkspaceHelp')}
                      </HelpTooltip>
                      <select
                        value={activeWorkspaceIdToCopyTo}
                        onChange={event => {
                          const activeWorkspaceIdToCopyTo = event.currentTarget.value;
                          setState(state => ({ ...state, activeWorkspaceIdToCopyTo }));
                        }}
                      >
                        <option value="">{t('requestSettings.selectWorkspace')}</option>
                        {workspacesForActiveProject.map(w => {
                          if (workspaceId === w._id) {
                            return null;
                          }

                          return (
                            <option key={w._id} value={w._id}>
                              {w.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!activeWorkspaceIdToCopyTo}
                      className="btn btn--clicky"
                      onClick={handleCopyToWorkspace}
                    >
                      {t('requestSettings.copy')}
                    </button>
                  </div>
                  <div className="form-control form-control--no-label width-auto">
                    <button
                      disabled={!activeWorkspaceIdToCopyTo}
                      className="btn btn--clicky"
                      onClick={handleMoveToWorkspace}
                    >
                      {t('requestSettings.move')}
                    </button>
                  </div>
                </div>
              </>)
            }
          </div>
        </ModalBody>
      </Modal>
    </OverlayContainer>
  );
};
