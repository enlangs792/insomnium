import React, { FC, Fragment, useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router-dom';
import { useRouteLoaderData } from 'react-router-dom';

import { getProductName } from '../../../common/constants';
import { docsImportExport } from '../../../common/documentation';
import { exportAllToFile } from '../../../common/export';
import { getWorkspaceLabel } from '../../../common/get-workspace-label';
import { strings } from '../../../common/strings';
import { t } from '../../../common/i18n';
import { Workspace } from '../../../models/workspace';
import { ProjectLoaderData } from '../../routes/project';
import { WorkspaceLoaderData } from '../../routes/workspace';
import { Dropdown, DropdownButton, DropdownItem, DropdownSection, ItemContent } from '../base/dropdown';
import { Link } from '../base/link';
import { ExportRequestsModal } from '../modals/export-requests-modal';
import { ImportModal } from '../modals/import-modal';
import { Button } from '../themed-button';
interface Props {
  hideSettingsModal: () => void;
}

export const ImportExport: FC<Props> = ({ hideSettingsModal }) => {
  const {
    organizationId,
    projectId,
    workspaceId,
  } = useParams() as { organizationId: string; projectId: string; workspaceId?: string };

  const workspaceData = useRouteLoaderData(':workspaceId') as WorkspaceLoaderData | undefined;
  const activeWorkspaceName = workspaceData?.activeWorkspace.name;
  const projectName = workspaceData?.activeProject.name ?? getProductName();

  const workspacesFetcher = useFetcher();
  useEffect(() => {
    const isIdleAndUninitialized = workspacesFetcher.state === 'idle' && !workspacesFetcher.data;
    if (isIdleAndUninitialized) {
      workspacesFetcher.load(`/organization/${organizationId}/project/${projectId}`);
    }
  }, [organizationId, projectId, workspacesFetcher]);
  const projectLoaderData = workspacesFetcher?.data as ProjectLoaderData;
  const workspacesForActiveProject = projectLoaderData?.workspaces.map(w => w.workspace) || [];
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleExportAllToFile = () => {
    exportAllToFile(projectName, workspacesForActiveProject);
    hideSettingsModal();
  };

  // 获取工作空间类型的中文标签
  const getWorkspaceTypeLabel = (workspace: Workspace | undefined) => {
    if (!workspace) return '';
    const label = getWorkspaceLabel(workspace);
    return label.singular === 'Collection' ? t('workspace.collection') : t('workspace.document');
  };

  // here we should list all the folders which contain insomnia.*.db files
  // and have some big red button to overwrite the current data with the backup
  // and once complete trigger an app restart?
  return (
    <Fragment>
      <div data-testid="import-export-tab">
        <div className="no-margin-top">
          {t('importExport.autoDetectFormat')}
        </div>
        <p>
          {t('importExport.formatNotSupported')} <Link href={docsImportExport}>{t('importExport.addYourOwn')}</Link>.
        </p>
        <div className="pad-top">
          {workspaceData?.activeWorkspace ?
            (<Dropdown
              aria-label={t('importExport.exportData')}
              triggerButton={
                <DropdownButton className="btn btn--clicky">
                  {t('importExport.exportData')} <i className="fa fa-caret-down" />
                </DropdownButton>
              }
            >
              <DropdownSection
                aria-label={t('importExport.chooseExportType')}
                title={t('importExport.chooseExportType')}
              >
                <DropdownItem aria-label={t('importExport.exportWorkspace').replace('{{name}}', activeWorkspaceName || '').replace('{{type}}', getWorkspaceTypeLabel(workspaceData.activeWorkspace))}>
                  <ItemContent
                    icon="home"
                    label={t('importExport.exportWorkspace').replace('{{name}}', activeWorkspaceName || '').replace('{{type}}', getWorkspaceTypeLabel(workspaceData.activeWorkspace))}
                    onClick={() => setIsExportModalOpen(true)}
                  />
                </DropdownItem>
                <DropdownItem aria-label={t('importExport.exportProjectFiles').replace('{{name}}', projectName).replace('{{type}}', t('project.singular'))}>
                  <ItemContent
                    icon="empty"
                    label={t('importExport.exportProjectFiles').replace('{{name}}', projectName).replace('{{type}}', t('project.singular'))}
                    onClick={handleExportAllToFile}
                  />
                </DropdownItem>
              </DropdownSection>
            </Dropdown>) : (<Button onClick={handleExportAllToFile}>{t('importExport.exportProjectFiles').replace('{{name}}', projectName).replace('{{type}}', t('project.singular'))}</Button>)
          }
          &nbsp;&nbsp;
          <Button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--padding-sm)',
            }}
            onClick={() => setIsImportModalOpen(true)}
          >
            <i className="fa fa-file-import" />
            {t('importExport.importToProject').replace('{{name}}', projectName).replace('{{type}}', t('project.singular'))}
          </Button>
          &nbsp;&nbsp;
          <Link href="https://insomnia.rest/create-run-button" className="btn btn--compact" button>
            {t('importExport.createRunButton')}
          </Link>
        </div>
      </div>
      {isImportModalOpen && (
        <ImportModal
          onHide={() => setIsImportModalOpen(false)}
          from={{ type: 'file' }}
          projectName={projectName}
          workspaceName={activeWorkspaceName}
          organizationId={organizationId}
          defaultProjectId={projectId}
          defaultWorkspaceId={workspaceId}
        />
      )}
      {isExportModalOpen && workspaceData?.activeWorkspace && (
        <ExportRequestsModal
          workspace={workspaceData.activeWorkspace}
          onHide={() => setIsExportModalOpen(false)}
        />
      )}
    </Fragment>
  );
};
