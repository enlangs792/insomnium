import React, { FC, Fragment } from 'react';
import { useRouteLoaderData } from 'react-router-dom';

import {
  EditorKeyMap,
  isMac,
  MAX_EDITOR_FONT_SIZE,
  MAX_INTERFACE_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  MIN_INTERFACE_FONT_SIZE,
  updatesSupported,
} from '../../../common/constants';
import { docsKeyMaps } from '../../../common/documentation';
import { HttpVersion, HttpVersions, UpdateChannel } from '../../../common/settings';
import { strings } from '../../../common/strings';
import { initNewOAuthSession } from '../../../network/o-auth-2/get-token';
import { t, setLocale, type Locale } from '../../../common/i18n';
import { RootLoaderData } from '../../routes/root';
import { useSettingsPatcher } from '../../hooks/use-request';
import { Link } from '../base/link';
import { CheckForUpdatesButton } from '../check-for-updates-button';
import { HelpTooltip } from '../help-tooltip';
import { Tooltip } from '../tooltip';
import { BooleanSetting } from './boolean-setting';
import { EnumSetting } from './enum-setting';
import { MaskedSetting } from './masked-setting';
import { NumberSetting } from './number-setting';
import { TextSetting } from './text-setting';

/**
 * We are attempting to move the app away from needing settings changes to restart the app.
 * For now, this component is a holdover until such a time as we are able to fix the underlying cases. (INS-1245)
 */
const RestartTooltip: FC<{ message: string }> = ({ message }) => (
  <Fragment>
    {message}{' '}
    <Tooltip message={t('tooltip.willRestart')} className="space-left">
      <i className="fa fa-refresh super-duper-faint" />
    </Tooltip>
  </Fragment>
);

export const General: FC = () => {
  const {
    settings,
  } = useRouteLoaderData('root') as RootLoaderData;
  const patchSettings = useSettingsPatcher();

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value as Locale;
    setLocale(newLocale);
    patchSettings({ locale: newLocale });
    // 更新菜单栏
    if (window.main?.updateMenu) {
      window.main.updateMenu();
    }
    // 提示用户刷新页面以应用语言更改
    setTimeout(() => {
      if (window.confirm(t('settings.language.refreshPrompt') || 'Language changed. Refresh page to apply?')) {
        window.location.reload();
      }
    }, 100);
  };

  return (
    <div className="pad-bottom">
      <div className="form-row pad-top-sm">
        <div className="form-control form-control--outlined">
          <label>
            {t('settings.language')}
            <HelpTooltip className="space-left">{t('settings.language.help')}</HelpTooltip>
            <select
              value={settings.locale || 'zh-CN'}
              name="locale"
              onChange={handleLocaleChange}
            >
              <option value="zh-CN">{t('locale.zh-CN')}</option>
              <option value="en">{t('locale.en')}</option>
            </select>
          </label>
        </div>
      </div>

      <hr className="pad-top" />

      <div className="row-fill row-fill--top">
        <div>
          <BooleanSetting
            label={t('settings.general.useBulkHeaderEditor')}
            setting="useBulkHeaderEditor"
          />
          <BooleanSetting
            label={t('settings.general.useVerticalLayout')}
            setting="forceVerticalLayout"
            help={t('settings.general.useVerticalLayout.help')}
          />
          <BooleanSetting
            label={<RestartTooltip message={t('settings.general.showVariableSourceAndValue')} />}
            help={t('settings.general.showVariableSourceAndValue.help')}
            setting="showVariableSourceAndValue"
          />
        </div>
        <div>
          <BooleanSetting
            label={t('settings.general.revealPasswords')}
            setting="showPasswords"
          />
          {!isMac() && (
            <BooleanSetting
              label={t('settings.general.hideMenuBar')}
              setting="autoHideMenuBar"
            />
          )}
          <BooleanSetting
            label={<RestartTooltip message={t('settings.general.rawTemplateSyntax')} />}
            setting="nunjucksPowerUserMode"
          />
        </div>
      </div>

      <div className="row-fill row-fill--top pad-top-sm">
        <NumberSetting
          label={t('settings.general.autocompleteDelay')}
          setting="autocompleteDelay"
          help={t('settings.general.autocompleteDelay.help')}
          min={0}
          max={3000}
          step={100}
        />
      </div>

      <hr className="pad-top" />
      <h2>{t('settings.font')}</h2>

      <div className="row-fill row-fill--top">
        <div>
          <BooleanSetting
            label={t('settings.font.indentWithTabs')}
            setting="editorIndentWithTabs"
          />
          <BooleanSetting
            label={t('settings.font.wrapTextEditorLines')}
            setting="editorLineWrapping"
          />
        </div>
        <div>
          <BooleanSetting
            label={t('settings.font.fontLigatures')}
            setting="fontVariantLigatures"
          />
        </div>
      </div>

      <div className="form-row pad-top-sm">
        <div className="form-row">
          <TextSetting
            label={t('settings.font.interfaceFont')}
            setting="fontInterface"
            help={t('settings.font.interfaceFont.help')}
            placeholder={t('settings.font.systemDefault')}
          />
          <NumberSetting
            label={t('settings.font.interfaceFontSize')}
            setting="fontSize"
            min={MIN_INTERFACE_FONT_SIZE}
            max={MAX_INTERFACE_FONT_SIZE}
          />
        </div>
      </div>

      <div className="form-row">
        <TextSetting
          label={t('settings.font.textEditorFont')}
          setting="fontMonospace"
          help={t('settings.font.textEditorFont.help')}
          placeholder={t('settings.font.systemDefault')}
        />
        <NumberSetting
          label={t('settings.font.editorFontSize')}
          setting="editorFontSize"
          min={MIN_EDITOR_FONT_SIZE}
          max={MAX_EDITOR_FONT_SIZE}
        />
      </div>

      <div className="form-row">
        <NumberSetting
          label={t('settings.font.editorIndentSize')}
          setting="editorIndentSize"
          help=""
          min={1}
          max={16}
        />

        <EnumSetting<EditorKeyMap>
          label={t('settings.font.textEditorKeyMap')}
          setting="editorKeyMap"
          help={isMac() && settings.editorKeyMap === EditorKeyMap.vim && (
            <Fragment>
              To enable key-repeating with Vim on macOS, see <Link href={docsKeyMaps}>
                {t('tooltip.documentation')} <i className="fa fa-external-link-square" /></Link>
            </Fragment>
          )}
          values={[
            { value: EditorKeyMap.default, name: t('editorKeyMap.default') },
            { value: EditorKeyMap.vim, name: t('editorKeyMap.vim') },
            { value: EditorKeyMap.emacs, name: t('editorKeyMap.emacs') },
            { value: EditorKeyMap.sublime, name: t('editorKeyMap.sublime') },
          ]}
        />
      </div>

      <hr className="pad-top" />

      <h2>{t('settings.requestResponse')}</h2>

      <div className="row-fill row-fill--top">
        <div>
          <BooleanSetting
            label={t('settings.requestResponse.validateCertificates')}
            setting="validateSSL"
            help={t('settings.requestResponse.validateCertificates.help')}
          />
          <BooleanSetting
            label={t('settings.requestResponse.followRedirects')}
            setting="followRedirects"
          />
          <BooleanSetting
            label={t('settings.requestResponse.filterResponsesByEnv')}
            setting="filterResponsesByEnv"
            help={t('settings.requestResponse.filterResponsesByEnv.help')}
          />
        </div>
        <div>
          <BooleanSetting
            label={t('settings.requestResponse.disableJsInHtmlPreview')}
            setting="disableHtmlPreviewJs"
          />
          <BooleanSetting
            label={t('settings.requestResponse.disableLinksInResponseViewer')}
            setting="disableResponsePreviewLinks"
          />
        </div>
      </div>

      <div className="form-row pad-top-sm">
        <EnumSetting<HttpVersion>
          label={t('settings.requestResponse.preferredHttpVersion')}
          setting="preferredHttpVersion"
          values={[
            { value: HttpVersions.default, name: t('httpVersion.default') },
            { value: HttpVersions.V1_0, name: t('httpVersion.v1_0') },
            { value: HttpVersions.V1_1, name: t('httpVersion.v1_1') },
            { value: HttpVersions.V2PriorKnowledge, name: t('httpVersion.v2PriorKnowledge') },
            { value: HttpVersions.V2_0, name: t('httpVersion.v2_0') },
            // Enable when our version of libcurl supports HTTP/3
            // see: https://github.com/JCMais/node-libcurl/issues/233
            // { value: HttpVersions.v3, name: 'HTTP/3' },
          ]}
          help={t('settings.requestResponse.preferredHttpVersion.help')}
        />
      </div>

      <div className="form-row pad-top-sm">
        <NumberSetting
          label={t('settings.requestResponse.maxRedirects')}
          setting="maxRedirects"
          help={t('settings.requestResponse.maxRedirects.help')}
          min={-1}
        />
        <NumberSetting
          label={t('settings.requestResponse.requestTimeout')}
          setting="timeout"
          help={t('settings.requestResponse.requestTimeout.help')}
          min={0}
          step={100}
        />
      </div>

      <div className="form-row pad-top-sm">
        <NumberSetting
          label={t('settings.requestResponse.responseHistoryLimit')}
          setting="maxHistoryResponses"
          help={t('settings.requestResponse.responseHistoryLimit.help')}
          min={-1}
        />
        <NumberSetting
          label={t('settings.requestResponse.maxTimelineChunkSize')}
          setting="maxTimelineDataSizeKB"
          help={t('settings.requestResponse.maxTimelineChunkSize.help')}
          min={0}
        />
      </div>

      <hr className="pad-top" />

      <h2>{t('settings.security')}</h2>
      <div className="form-row pad-top-sm">
        <BooleanSetting
          label={t('settings.security.clearOAuth2SessionOnStart')}
          setting="clearOAuth2SessionOnRestart"
          help={t('settings.security.clearOAuth2SessionOnStart.help')}
        />
        <button
          className="btn btn--clicky pointer"
          style={{
            padding: 0,
          }}
          onClick={initNewOAuthSession}
        >
          {t('settings.security.clearOAuth2Session')}
        </button>
      </div>
      <div className="form-row pad-top-sm">
        <BooleanSetting
          label={t('settings.security.validateCertificatesDuringAuth')}
          setting="validateAuthSSL"
          help={t('settings.security.validateCertificatesDuringAuth.help')}
        />
      </div>

      <hr className="pad-top" />

      <h2>{t('settings.networkProxy')}</h2>

      <BooleanSetting
        label={t('settings.networkProxy.enableProxy')}
        setting="proxyEnabled"
        help={t('settings.networkProxy.enableProxy.help')}
      />

      <div className="form-row pad-top-sm">
        <MaskedSetting
          label={t('settings.networkProxy.proxyForHttp')}
          setting='httpProxy'
          help={t('settings.networkProxy.proxyForHttp.help')}
          placeholder={t('placeholder.proxy')}
          disabled={!settings.proxyEnabled}
        />
        <MaskedSetting
          label={t('settings.networkProxy.proxyForHttps')}
          setting='httpsProxy'
          help={t('settings.networkProxy.proxyForHttps.help')}
          placeholder={t('placeholder.proxy')}
          disabled={!settings.proxyEnabled}
        />
        <TextSetting
          label={t('settings.networkProxy.noProxy')}
          setting="noProxy"
          help={t('settings.networkProxy.noProxy.help')}
          placeholder={t('placeholder.localhost')}
          disabled={!settings.proxyEnabled}
        />
      </div>

      {/* {updatesSupported() && (
        <Fragment>
          <hr className="pad-top" />
          <div>
            <div className="pull-right">
              <CheckForUpdatesButton className="btn btn--outlined btn--super-duper-compact">
                Check now
              </CheckForUpdatesButton>
            </div>
            <h2>Software Updates</h2>
          </div>
          <BooleanSetting
            label="Automatically download and install updates"
            setting="updateAutomatically"
            help="If disabled, receive a notification in-app when a new update is available."
          />

          <div className="for-row pad-top-sm">
            <EnumSetting<UpdateChannel>
              label="Update channel"
              setting="updateChannel"
              values={[
                { value: UpdateChannel.stable, name: 'Release (recommended)' },
                { value: UpdateChannel.beta, name: 'Early access (beta)' },
              ]}
            />
          </div>
        </Fragment>
      )}

      {!updatesSupported() && (
        <><hr className="pad-top" />
          <h2>Notifications</h2>
          <BooleanSetting
            label="Do not notify of new releases"
            setting="disableUpdateNotification"
          /></>
      )} */}

      <hr className="pad-top" />

    </div>
  );
};
