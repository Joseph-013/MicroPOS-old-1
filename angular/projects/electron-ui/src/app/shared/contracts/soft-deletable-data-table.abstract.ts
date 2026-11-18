import { Directive, input, output } from '@angular/core';
import { DataTable } from './data-table.abstract';

@Directive()
export abstract class SoftDeletableDataTable<
  TEntity extends { id: string; deletedAt: string | null },
> extends DataTable<TEntity> {
  readonly onlyDeleted = input<boolean>(false);

  readonly onDeleteEntities = output<TEntity[]>();
}
