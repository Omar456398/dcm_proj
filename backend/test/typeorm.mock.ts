import { Inject, Type } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';

export const DEFAULT_DATA_SOURCE_NAME = 'default';

export function getRepositoryToken(entity: any, dataSource = DEFAULT_DATA_SOURCE_NAME) {
  if (!entity) return 'EntityRepository';
  return typeof entity === 'function' ? `${entity.name}Repository` : `${entity}Repository`;
}

export function getDataSourceToken(dataSource = DEFAULT_DATA_SOURCE_NAME) {
  return dataSource === DEFAULT_DATA_SOURCE_NAME ? DataSource : `${dataSource}DataSource`;
}

export const InjectRepository = (entity: any, dataSource = DEFAULT_DATA_SOURCE_NAME) =>
  Inject(getRepositoryToken(entity, dataSource));

export const InjectDataSource = (dataSource = DEFAULT_DATA_SOURCE_NAME) =>
  Inject(getDataSourceToken(dataSource));

export const InjectEntityManager = (dataSource = DEFAULT_DATA_SOURCE_NAME) =>
  Inject('EntityManager');

export const InjectConnection = InjectDataSource;

export class TypeOrmModule {
  static forRoot(options?: any) {
    return {
      module: TypeOrmModule,
      providers: [],
      exports: [],
    };
  }

  static forFeature(entities: any[] = [], dataSource = DEFAULT_DATA_SOURCE_NAME) {
    const providers = entities.map((entity) => ({
      provide: getRepositoryToken(entity, dataSource),
      useValue: {},
    }));
    return {
      module: TypeOrmModule,
      providers,
      exports: providers,
    };
  }
}
