import React, { FunctionComponent } from 'react';

import { t } from '../../../../common/i18n';
import { docsGitAccessToken } from '../../../../common/documentation';
import { GitRepository } from '../../../../models/git-repository';
import { Link } from '../../base/link';
import { HelpTooltip } from '../../help-tooltip';

export interface Props {
  gitRepository?: GitRepository | null;
  onSubmit: (args: Partial<GitRepository>) => void;
}

export const CustomRepositorySettingsFormGroup: FunctionComponent<Props> = ({
  gitRepository,
  onSubmit,
}) => {
  const linkIcon = <i className="fa fa-external-link-square" />;
  const defaultValues = gitRepository || { uri: '', credentials: { username: '', token: '' }, author: { name: '', email: '' } };

  const uri = defaultValues.uri;
  const author = defaultValues.author;
  const credentials = defaultValues?.credentials || { username: '', token: '' };

  return (
    <form
      id="custom"
      className='form-group'
      onSubmit={event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          uri: formData.get('uri') as string || '',
          credentials: {
            username: formData.get('username') as string || '',
            token: formData.get('token') as string || '',
          },
          author: {
            name: formData.get('authorName') as string || '',
            email: formData.get('authorEmail') as string || '',
          },
        });
      }}
    >
      <div className="form-control form-control--outlined">
        <label>
          {t('gitCustomRepository.gitUri')}
          <input
            type="url"
            required
            autoFocus
            name="uri"
            defaultValue={uri}
            disabled={Boolean(uri)}
            placeholder={t('gitCustomRepository.gitUriPlaceholder')}
          />
        </label>
      </div>
      <div className="form-row">
        <div className="form-control form-control--outlined">
          <label>
            {t('gitCustomRepository.authorName')}
            <input
              required
              type="text"
              name="authorName"
              placeholder={t('gitCustomRepository.authorNamePlaceholder')}
              disabled={Boolean(uri)}
              defaultValue={author.name}
            />
          </label>
        </div>
        <div className="form-control form-control--outlined">
          <label>
            {t('gitCustomRepository.authorEmail')}
            <input
              required
              type="text"
              name="authorEmail"
              placeholder={t('gitCustomRepository.authorEmailPlaceholder')}
              disabled={Boolean(uri)}
              defaultValue={author.email}
            />
          </label>
        </div>
      </div>
      <div className="form-row">
        <div className="form-control form-control--outlined">
          <label>
            {t('gitCustomRepository.username')}
            <input
              required
              type="text"
              name="username"
              placeholder={t('gitCustomRepository.usernamePlaceholder')}
              disabled={Boolean(uri)}
              defaultValue={credentials?.username}
            />
          </label>
        </div>
        <div className="form-control form-control--outlined">
          <label>
            {t('gitCustomRepository.authenticationToken')}
            <HelpTooltip className="space-left">
              {t('gitCustomRepository.createPersonalAccessToken')}
              <br />
              <Link href={docsGitAccessToken.github}>GitHub {linkIcon}</Link>
              {' | '}
              <Link href={docsGitAccessToken.gitlab}>GitLab {linkIcon}</Link>
              {' | '}
              <Link href={docsGitAccessToken.bitbucket}>Bitbucket {linkIcon}</Link>
              {' | '}
              <Link href={docsGitAccessToken.bitbucketServer}>
                Bitbucket Server {linkIcon}
              </Link>
              {' | '}
              <Link href={docsGitAccessToken.azureDevOps}>
                Azure DevOps {linkIcon}
              </Link>
            </HelpTooltip>
            <input
              required
              type="password"
              name="token"
              disabled={Boolean(uri)}
              defaultValue={'token' in credentials ? credentials?.token : ''}
              placeholder={t('gitCustomRepository.tokenPlaceholder')}
            />
          </label>
        </div>
      </div>
    </form>
  );
};
