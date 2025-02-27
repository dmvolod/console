import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import * as React from 'react';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  Kebab,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourcePathFromModel,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  NooBaaObjectBucketClaimModel,
  NooBaaObjectBucketModel,
} from '@console/noobaa-storage-plugin/src/models';
import { Status } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { obcStatusFilter } from '../../table-filters';
import { isBound, getPhase } from '../../utils';
import { GetSecret } from './secret';
import { menuActionCreator, menuActions } from './menu-actions';

const kind = referenceForModel(NooBaaObjectBucketClaimModel);

export const OBCStatus: React.FC<OBCStatusProps> = ({ obc }) => <Status status={getPhase(obc)} />;

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const OBCTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  const storageClassName = _.get(obj, 'spec.storageClassName');

  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[2])}>
        <OBCStatus obc={obj} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3])}>
        {isBound(obj) ? (
          <ResourceLink
            kind="Secret"
            name={obj.metadata.name}
            title={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {storageClassName ? <ResourceLink kind="StorageClass" name={storageClassName} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const storageClassName = _.get(obj, 'spec.storageClassName');

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('noobaa-storage-plugin~Object Bucket Claim Details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} />
            {isBound(obj) && (
              <>
                <dt>{t('noobaa-storage-plugin~Secret')}</dt>
                <dd>
                  <ResourceLink
                    kind="Secret"
                    name={obj.metadata.name}
                    title={obj.metadata.name}
                    namespace={obj.metadata.namespace}
                  />
                </dd>
              </>
            )}
          </div>
          <div className="col-sm-6">
            <dt>{t('noobaa-storage-plugin~Status')}</dt>
            <dd>
              <OBCStatus obc={obj} />
            </dd>
            <dt>{t('noobaa-storage-plugin~Storage Class')}</dt>
            <dd>
              {storageClassName ? (
                <ResourceLink kind="StorageClass" name={storageClassName} />
              ) : (
                '-'
              )}
            </dd>
            {isBound(obj) && (
              <>
                <dt>{t('noobaa-storage-plugin~Object Bucket')}</dt>
                <dd>
                  <ResourceLink
                    dataTest="obc-link"
                    kind={referenceForModel(NooBaaObjectBucketModel)}
                    name={obj.spec.ObjectBucketName}
                  />
                </dd>
              </>
            )}
          </div>
        </div>
      </div>
      <GetSecret obj={obj} />
    </>
  );
};

const ObjectBucketClaimsList: React.FC = (props) => {
  const { t } = useTranslation();

  const OBCTableHeader = () => {
    return [
      {
        title: t('noobaa-storage-plugin~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('noobaa-storage-plugin~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('noobaa-storage-plugin~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('noobaa-storage-plugin~Secret'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('noobaa-storage-plugin~Storage Class'),
        sortField: 'spec.storageClassName',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };
  OBCTableHeader.displayName = t('noobaa-storage-plugin~OBCTableHeader');

  return (
    <Table
      {...props}
      aria-label={t('noobaa-storage-plugin~Object Bucket Claims')}
      Header={OBCTableHeader}
      Row={OBCTableRow}
      virtualize
    />
  );
};

export const ObjectBucketClaimsPage: React.FC = (props) => {
  const { t } = useTranslation();

  const createProps = {
    to: `${resourcePathFromModel(
      NooBaaObjectBucketClaimModel,
      null,
      _.get(props, 'namespace', 'default'),
    )}/~new/form`,
  };
  return (
    <ListPage
      {...props}
      title={t('noobaa-storage-plugin~Object Bucket Claims')}
      ListComponent={ObjectBucketClaimsList}
      kind={referenceForModel(NooBaaObjectBucketClaimModel)}
      canCreate
      createProps={createProps}
      rowFilters={[obcStatusFilter(t)]}
    />
  );
};

export const ObjectBucketClaimsDetailsPage = (props) => {
  return (
    <DetailsPage
      {...props}
      menuActions={menuActionCreator}
      pages={[
        navFactory.details(Details),
        navFactory.editYaml(),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

type OBCStatusProps = {
  obc: K8sResourceKind;
};

type DetailsProps = {
  obj: K8sResourceKind;
};
