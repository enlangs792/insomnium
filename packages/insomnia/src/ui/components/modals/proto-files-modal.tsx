import React, { FC, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { ChangeBufferEvent, database as db } from "../../../common/database";
import { t } from "../../../common/i18n";
import { selectFileOrFolder } from "../../../common/select-file-or-folder";
import * as models from "../../../models";
import { isProtoDirectory, ProtoDirectory } from "../../../models/proto-directory";
import { isProtoFile, ProtoFile } from "../../../models/proto-file";

import { Modal, ModalHandle } from "../base/modal";
import { ModalBody } from "../base/modal-body";
import { ModalFooter } from "../base/modal-footer";
import { ModalHeader } from "../base/modal-header";
import { ExpandedProtoDirectory, ProtoFileList } from "../proto-file/proto-file-list";
import { AsyncButton } from "../themed-button";
import { showAlert, showError } from ".";
import * as protoLoader from "../../../network/grpc/proto-loader";

const tryToSelectFilePath = async () => {
  try {
    const { filePath, canceled } = await selectFileOrFolder({
      itemTypes: ["file"],
      extensions: ["proto"],
    });
    if (!canceled && filePath) {
      return filePath;
    }
  } catch (error) {
    showError({ error });
  }
  return;
};
const tryToSelectFolderPath = async () => {
  try {
    const { filePath, canceled } = await selectFileOrFolder({
      itemTypes: ["directory"],
      extensions: ["proto"],
    });
    if (!canceled && filePath) {
      return filePath;
    }
  } catch (error) {
    showError({ error });
  }
  return;
};

const traverseDirectory = (dir: ProtoDirectory, files: ProtoFile[], directories: ProtoDirectory[]): ExpandedProtoDirectory => ({
  dir,
  files: files.filter(pf => pf.parentId === dir._id),
  subDirs: directories.filter(pd => pd.parentId === dir._id).map(subDir => traverseDirectory(subDir, files, directories)),
});

const getProtoDirectories = async (workspaceId: string) => {
  const allFiles = await models.protoFile.all();
  const allDirs = await models.protoDirectory.all();

  // Get directories where the parent is the workspace
  const rootDirs = await models.protoDirectory.findByParentId(workspaceId);
  // Expand each directory
  const expandedDirs = rootDirs.map(dir => traverseDirectory(dir, allFiles, allDirs));
  // Get files where the parent is the workspace
  const individualFiles = await models.protoFile.findByParentId(workspaceId);
  if (individualFiles.length) {
    return [
      {
        files: individualFiles,
        dir: null,
        subDirs: [],
      },
      ...expandedDirs,
    ];
  }

  return expandedDirs;
};

export interface Props {
  defaultId?: string;
  onSave?: (arg0: string) => Promise<void>;
  onHide: () => void;
  reloadRequests: (requestIds: string[]) => void;
}

export const ProtoFilesModal: FC<Props> = ({ defaultId, onHide, onSave, reloadRequests }) => {
  const modalRef = useRef<ModalHandle>(null);
  const { workspaceId } = useParams() as { workspaceId: string };

  const [selectedId, setSelectedId] = useState(defaultId);
  const [protoDirectories, setProtoDirectories] = useState<ExpandedProtoDirectory[]>([]);

  useEffect(() => modalRef.current?.show(), []);

  useEffect(() => {
    const fn = async () => {
      setProtoDirectories(await getProtoDirectories(workspaceId));
    };
    fn();
  }, [workspaceId]);

  useEffect(() => {
    db.onChange(async (changes: ChangeBufferEvent[]) => {
      for (const change of changes) {
        const [, doc] = change;
        if (isProtoFile(doc) || isProtoDirectory(doc)) {
          setProtoDirectories(await getProtoDirectories(workspaceId));
        }
      }
    });
  }, [workspaceId]);

  const handleAddFile = async () => {
    const filePath = await tryToSelectFilePath();
    if (!filePath) {
      return;
    }

    const workspace = await models.workspace.getById(workspaceId);
    const addResult = await protoLoader.addFileFromPath(filePath, workspace!);
    if (addResult.success) {
      setSelectedId(addResult.loaded[0]._id);
    }

    if (addResult.errors.length > 0) {
      showError({
        title: t('protoFiles.failedToAddFile'),
        message: t('protoFiles.couldNotAddFile', { filePath }) + `\n${addResult.errors.join("\n")}`,
      });
    }
  };

  const handleAddDirectory = async () => {
    const filePath = await tryToSelectFolderPath();
    if (!filePath) {
      return;
    }
    const workspace = await models.workspace.getById(workspaceId);
    const addResult = await protoLoader.addDirectoryFromPath(filePath, workspace!);

    if (addResult.errors.length > 0) {
      showError({
        title: t('protoFiles.issuesAddingDirectory'),
        message: t('protoFiles.someProtoFilesCouldNotBeAdded') + `\n${addResult.errors.join("\n")}`,
      });
    }
  };

  const handleUpdate = async (protoFileOrDir: ProtoFile | ProtoDirectory) => {
    if (isProtoFile(protoFileOrDir)) {
      await handleUpdateProtoFile(protoFileOrDir);
    } else {
      await handleUpdateProtoDirectory(protoFileOrDir);
    }
  };

  const handleUpdateProtoFile = async (protoFile: ProtoFile) => {
    const filePath = await tryToSelectFilePath();
    if (!filePath) {
      return;
    }
    const updateResult = await protoLoader.updateFileFromPath(protoFile, filePath);

    if (updateResult.success) {
      const updatedFile = updateResult.loaded[0];

      const impacted = await models.grpcRequest.findByProtoFileId(updatedFile._id);
      const requestIds = impacted.map(g => g._id);
      if (requestIds?.length) {
        requestIds.forEach(requestId => window.main.grpc.cancel(requestId));
        reloadRequests(requestIds);
      }
    }

    if (updateResult.errors.length > 0) {
      showError({
        title: t('protoFiles.failedToUpdateFile'),
        message: t('protoFiles.couldNotUpdateFile', { filePath }) + `\n${updateResult.errors.join("\n")}`,
      });
    }
  };

  const handleUpdateProtoDirectory = async (rootProtoDir: ProtoDirectory) => {
    const dirPath = await tryToSelectFolderPath();
    if (!dirPath) return;

    const updateResult = await protoLoader.updateDirectoryFromPath(dirPath, rootProtoDir);

    if (updateResult.errors.length > 0) {
      showError({
        title: t('protoFiles.issuesUpdatingDirectory'),
        message: t('protoFiles.someProtoFilesFailedToUpdate') + `\n${updateResult.errors.join("\n")}`,
      });
    }
  };

  const handleDeleteDirectory = (protoDirectory: ProtoDirectory) => {
    showAlert({
      title: t('protoFiles.deleteItem', { name: protoDirectory.name }),
      message: (
        <span>
          {t('protoFiles.deleteDirectoryMessagePrefix')} <strong>{protoDirectory.name}</strong> {t('protoFiles.deleteDirectoryMessageSuffix')}
        </span>
      ),
      addCancel: true,
      onConfirm: async () => {
        models.protoDirectory.remove(protoDirectory);
        setSelectedId("");
      },
    });
  };
  const handleDeleteFile = (protoFile: ProtoFile) => {
    showAlert({
      title: t('protoFiles.deleteItem', { name: protoFile.name }),
      message: (
        <span>
          {t('protoFiles.deleteFileMessagePrefix')} <strong>{protoFile.name}</strong>? {t('protoFiles.deleteFileMessageSuffix')}
        </span>
      ),
      addCancel: true,
      onConfirm: () => {
        models.protoFile.remove(protoFile);
        if (selectedId === protoFile._id) {
          setSelectedId("");
        }
      },
    });
  };

  return (
    <Modal ref={modalRef} onHide={onHide}>
      <ModalHeader>{t('protoFiles.selectProtoFile')}</ModalHeader>
      <ModalBody className="wide pad">
        <div className="row-spaced margin-bottom bold">
          {t('protoFiles.files')}
          <span>
            <AsyncButton className="margin-right-sm" onClick={handleAddDirectory} loadingNode={<i className="fa fa-spin fa-refresh" />}>
              {t('protoFiles.addDirectory')}
            </AsyncButton>
            <AsyncButton onClick={handleAddFile} loadingNode={<i className="fa fa-spin fa-refresh" />}>
              {t('protoFiles.addProtoFile')}
            </AsyncButton>
          </span>
        </div>
        <ProtoFileList
          protoDirectories={protoDirectories}
          selectedId={selectedId}
          handleSelect={id => setSelectedId(id)}
          handleUpdate={handleUpdate}
          handleDelete={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
        />
      </ModalBody>
      <ModalFooter>
        <div>
          <button
            className="btn"
            onClick={event => {
              event.preventDefault();
              if (typeof onSave === "function" && selectedId) {
                onSave(selectedId);
              }
            }}
            disabled={!selectedId}
          >
            {t('request.save')}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
