import { Component } from '@angular/core';
import { SoftDeletableDataTable } from '../../../../shared/contracts/soft-deletable-data-table.abstract';
import { SalesOrder } from '@micropos/shared/src';
import {
  lucideArchiveRestore,
  lucideArrowUpDown,
  lucideSearchX,
  lucideSortAsc,
  lucideSortDesc,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmContextMenuImports } from '@spartan-ng/helm/context-menu';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { PaginationControls } from '@angular-shared';
import { CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-sales-order-table',
  imports: [
    HlmTableImports,
    HlmCheckboxImports,
    HlmSeparatorImports,
    DatePipe,
    HlmContextMenuImports,
    HlmDropdownMenuImports,
    HlmIconImports,
    NgIcon,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmSelectImports,
    NgTemplateOutlet,
    PaginationControls,
    CurrencyPipe,
  ],
  viewProviders: [
    provideIcons({
      lucideSortAsc,
      lucideSortDesc,
      lucideArrowUpDown,
      lucideSearchX,
      lucideArchiveRestore,
    }),
  ],
  templateUrl: './sales-order-table.html',
  styleUrl: './sales-order-table.css',
})
export class SalesOrderTable extends SoftDeletableDataTable<SalesOrder> {
  override entityDefinition: { singular: string; plural: string } = {
    singular: 'Sales Order',
    plural: 'Sales Orders',
  };
}
