import React, { FC, useEffect, useRef } from 'react';
import { OverlayContainer } from 'react-aria';
import { useFetcher, useParams } from 'react-router-dom';

import { t } from '../../../common/i18n';
import { strings } from '../../../common/strings';
import { isRemoteProject, Project } from '../../../models/project';
import { Modal, type ModalHandle, ModalProps } from '../base/modal';
import { ModalBody } from '../base/modal-body';
import { ModalHeader } from '../base/modal-header';
import { PromptButton } from '../base/prompt-button';
import { HelpTooltip } from '../help-tooltip';

export interface ProjectSettingsModalProps extends ModalProps {
  project: Project;
}

export const ProjectSettingsModal: FC<ProjectSettingsModalProps> = ({ project, onHide }) => {
  const modalRef = useRef<ModalHandle>(null);
  const { organizationId } = useParams<{organizationId: string}>();
  const { submit } = useFetcher();

  useEffect(() => {
    modalRef.current?.show();
  }, []);

  const isRemote = isRemoteProject(project);

  return (
    <OverlayContainer>
      <Modal onHide={onHide} ref={modalRef}>
        <ModalHeader key={`header::${project._id}`}>
          {strings.project.singular} {t('projectSettings.settings')}{' '}
          <div className="txt-sm selectable faint monospace">{project._id}</div>
        </ModalHeader>
        <ModalBody key={`body::${project._id}`} className="pad">
          <div className="form-control form-control--outlined">
            <label>
              {t('workspaceSettings.name')}
              {isRemote && (
                <>
                  <HelpTooltip className="space-left">
                    {t('projectSettings.renameRemoteProjectHelpPrefix', {
                      remoteProject: strings.remoteProject.singular.toLowerCase(),
                      project: strings.project.singular.toLowerCase(),
                    })}{' '}
                    <a href="https://app.insomnia.rest/app/teams">
                      {t('projectSettings.theInsomniaWebsite')}
                    </a>
                  </HelpTooltip>
                  <input disabled readOnly defaultValue={project.name} />
                </>
              )}
              {!isRemote && (
                <input
                  type="text"
                  placeholder={t('projectSettings.myProject', { project: strings.project.singular })}
                  defaultValue={project.name}
                  onChange={e => {
                    submit(
                      {
                        name: e.currentTarget.value,
                      },
                      {
                        action: `/organization/${organizationId}/project/${project._id}/rename`,
                        method: 'post',
                      }
                    );
                  }}
                />
              )}
            </label>
          </div>
          <h2>{t('workspaceSettings.actions')}</h2>
          <div className="form-control form-control--padded">
            <PromptButton
              onClick={() =>
                submit(
                  {},
                  { method: 'post', action: `/organization/${organizationId}/project/${project._id}/delete` }
                )
              }
              className="width-auto btn btn--clicky inline-block"
            >
              <i className="fa fa-trash-o" /> {t('menu.delete')}
            </PromptButton>
          </div>
        </ModalBody>
      </Modal>
    </OverlayContainer>
  );
};

ProjectSettingsModal.displayName = 'ProjectSettingsModal';

export default ProjectSettingsModal;
