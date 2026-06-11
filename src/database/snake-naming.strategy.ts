import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function toSnake(s: string) {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/__+/g, '_')
    .toLowerCase();
}

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  tableName(className: string, customName: string): string {
    return customName ? customName : toSnake(className);
  }

  columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    const name = embeddedPrefixes
      .concat(customName ? customName : propertyName)
      .join('_');
    return toSnake(name);
  }

  relationName(propertyName: string): string {
    return toSnake(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnake(`${relationName}_${referencedColumnName}`);
  }

  joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _secondPropertyName: string,
  ): string {
    return toSnake(`${firstTableName}_${firstPropertyName}_${secondTableName}`);
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return toSnake(`${tableName}_${columnName ?? propertyName}`);
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return toSnake(`${parentTableName}_${parentTableIdPropertyName}`);
  }
}
