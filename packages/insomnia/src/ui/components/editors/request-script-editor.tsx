import React from 'react';

import { t } from '../../../common/i18n';
import { normalizeScriptConfig, type ScriptConfig, type ScriptLanguage } from '../../../models/script';
import { CodeEditor } from '../codemirror/code-editor';
import { CodePromptModal } from '../modals/code-prompt-modal';
import { showModal } from '../modals/index';

interface Props {
  script?: ScriptConfig | null;
  title: string;
  help: string;
  editorId: string;
  placeholder: string;
  onChange: (patch: Partial<ScriptConfig>) => void;
}

const getEditorMode = (language: ScriptLanguage) => {
  if (language === 'python') {
    return 'python';
  }

  if (language === 'typescript') {
    return 'text/typescript';
  }

  return 'javascript';
};

const getModalMode = (language: ScriptLanguage) => {
  if (language === 'python') {
    return 'python';
  }

  if (language === 'typescript') {
    return 'text/typescript';
  }

  return 'javascript';
};

export const RequestScriptEditor = ({
  script,
  title,
  help,
  editorId,
  placeholder,
  onChange,
}: Props) => {
  const normalizedScript = normalizeScriptConfig(script);
  const isExecutable = normalizedScript.language === 'javascript';
  const contentPreview = normalizedScript.content.trim().split('\n')[0] || t('scriptEditor.emptyContent');

  return (
    <div className="form-control form-control--outlined">
      <label>{title}</label>
      <p className="txt-sm faint no-margin-top">{help}</p>

      <div className="form-row">
        <div className="form-control form-control--outlined">
          <label>
            {t('scriptEditor.language')}
            <select
              value={normalizedScript.language}
              onChange={event => onChange({ language: event.currentTarget.value as ScriptLanguage })}
            >
              <option value="javascript">{t('scriptEditor.languageJavascript')}</option>
              <option value="typescript">{t('scriptEditor.languageTypescript')}</option>
              <option value="python">{t('scriptEditor.languagePython')}</option>
            </select>
          </label>
        </div>

        <div className="form-control form-control--thin width-auto">
          <label>
            {t('scriptEditor.enabled')}
            <input
              type="checkbox"
              checked={normalizedScript.enabled}
              onChange={event => onChange({ enabled: event.currentTarget.checked })}
            />
          </label>
        </div>
      </div>

      <div className="form-control form-control--outlined margin-top">
        <label>
          {t('scriptEditor.description')}
          <input
            type="text"
            value={normalizedScript.description}
            placeholder={t('scriptEditor.descriptionPlaceholder')}
            onChange={event => onChange({ description: event.currentTarget.value })}
          />
        </label>
      </div>

      {!isExecutable && (
        <p className="notice warning margin-top no-margin-bottom">
          {t('scriptEditor.nonExecutableWarning')}
        </p>
      )}

      <div className="form-control form-control--outlined margin-top">
        <label>{t('scriptEditor.content')}</label>
        <button
          type="button"
          className="btn btn--outlined btn--super-duper-compact wide ellipsis"
          onClick={() => showModal(CodePromptModal, {
            submitName: t('modal.done'),
            title,
            defaultValue: normalizedScript.content,
            placeholder,
            onChange: content => onChange({ content }),
            enableRender: false,
            mode: getModalMode(normalizedScript.language),
            hideMode: true,
          })}
        >
          <i className="fa fa-pencil-square-o space-right" />
          {t('scriptEditor.openEditor')}
        </button>
        <div className="form-control form-control--outlined margin-top">
          <CodeEditor
            key={`${editorId}-${normalizedScript.language}`}
            id={editorId}
            defaultValue={normalizedScript.content}
            dynamicHeight
            mode={getEditorMode(normalizedScript.language)}
            noLint
            readOnly
            placeholder={placeholder}
          />
        </div>
        <p className="txt-sm faint no-margin-bottom">
          {contentPreview}
        </p>
      </div>
    </div>
  );
};
