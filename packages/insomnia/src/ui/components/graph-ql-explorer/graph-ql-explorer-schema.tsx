import type { GraphQLSchema, GraphQLType } from 'graphql';
import React, { Fragment, PureComponent } from 'react';

import { t } from '../../../common/i18n';
import { GraphQLExplorerTypeLink } from './graph-ql-explorer-type-link';

interface Props {
  onNavigateType: (type: GraphQLType) => void;
  schema: GraphQLSchema;
}

export class GraphQLExplorerSchema extends PureComponent<Props> {
  renderQueryType() {
    const { schema, onNavigateType } = this.props;
    const type = schema.getQueryType();

    if (!type) {
      return null;
    }

    return (
      <Fragment>
        <span className="success">query</span>:{' '}
        <GraphQLExplorerTypeLink onNavigate={onNavigateType} type={type} />
      </Fragment>
    );
  }

  renderMutationType() {
    const { schema, onNavigateType } = this.props;
    const type = schema.getMutationType();

    if (!type) {
      return null;
    }

    return (
      <Fragment>
        <span className="success">mutation</span>:{' '}
        <GraphQLExplorerTypeLink onNavigate={onNavigateType} type={type} />
      </Fragment>
    );
  }

  renderSubscriptionType() {
    const { schema, onNavigateType } = this.props;
    const type = schema.getSubscriptionType();

    if (!type) {
      return null;
    }

    return (
      <Fragment>
        <span className="success">subscription</span>:{' '}
        <GraphQLExplorerTypeLink onNavigate={onNavigateType} type={type} />
      </Fragment>
    );
  }

  render() {
    return (
      <div className="graphql-explorer__schema">
        <p>{t('graphqlExplorer.schemaDescription')}</p>
        <h2 className="graphql-explorer__subheading">{t('graphqlExplorer.rootTypes')}</h2>
        <ul className="graphql-explorer__defs">
          <li>{this.renderQueryType()}</li>
          <li>{this.renderMutationType()}</li>
          <li>{this.renderSubscriptionType()}</li>
        </ul>
      </div>
    );
  }
}
