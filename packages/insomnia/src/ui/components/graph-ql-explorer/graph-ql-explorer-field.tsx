import { GraphQLType } from 'graphql';
import React, { Fragment, PureComponent } from 'react';

import { t } from '../../../common/i18n';
import { MarkdownPreview } from '../markdown-preview';
import { GraphQLDefaultValue } from './graph-ql-default-value';
import { GraphQLExplorerTypeLink } from './graph-ql-explorer-type-link';
import { GraphQLFieldWithParentName } from './graph-ql-types';

interface Props {
  onNavigateType: (type: GraphQLType) => void;
  field: GraphQLFieldWithParentName;
}

export class GraphQLExplorerField extends PureComponent<Props> {
  renderDescription() {
    const { field } = this.props;
    return <MarkdownPreview markdown={field.description || t('graphqlExplorer.noDescriptionMarkdown')} />;
  }

  renderType() {
    const { field, onNavigateType } = this.props;
    return (
      <Fragment>
        <h2 className="graphql-explorer__subheading">{t('graphqlExplorer.type')}</h2>
        <GraphQLExplorerTypeLink type={field.type} onNavigate={onNavigateType} />
      </Fragment>
    );
  }

  renderArgumentsMaybe() {
    const { field, onNavigateType } = this.props;

    if (!field.args || field.args.length === 0) {
      return null;
    }

    return (
      <Fragment>
        <h2 className="graphql-explorer__subheading">{t('graphqlExplorer.arguments')}</h2>
        <ul className="graphql-explorer__defs">
          {field.args.map(a => {
            return (
              <li key={a.name}>
                <span className="info">{a.name}</span>:{' '}
                <GraphQLExplorerTypeLink onNavigate={onNavigateType} type={a.type} />
                <GraphQLDefaultValue
                  // @ts-expect-error -- TSCONVERSION
                  field={a}
                />
                {a.description && <MarkdownPreview markdown={a.description} />}
              </li>
            );
          })}
        </ul>
      </Fragment>
    );
  }

  render() {
    return (
      <div className="graphql-explorer__field">
        {this.renderDescription()}
        {this.renderType()}
        {this.renderArgumentsMaybe()}
      </div>
    );
  }
}
