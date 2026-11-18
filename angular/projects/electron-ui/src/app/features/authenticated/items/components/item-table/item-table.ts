import { CurrencyPipe, DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { Item } from '@micropos/shared/src';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArchiveRestore,
  lucideArrowUpDown,
  lucideChevronUp,
  lucideSearchX,
  lucideSortAsc,
  lucideSortDesc,
  lucideX,
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
import { SoftDeletableDataTable } from '../../../../../shared/contracts/soft-deletable-data-table.abstract';
import { PriceModeUnitMap } from '../../../../../services/data/item-service';

@Component({
  selector: 'app-item-table',
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
      lucideX,
      lucideChevronUp,
      lucideSortAsc,
      lucideSortDesc,
      lucideArrowUpDown,
      lucideSearchX,
      lucideArchiveRestore,
    }),
  ],
  providers: [DatePipe],
  templateUrl: './item-table.html',
  styleUrl: './item-table.css',
})
export class ItemTable extends SoftDeletableDataTable<Item> {
  protected readonly PriceModeUnitMap = PriceModeUnitMap;
  override entityDefinition: { singular: string; plural: string } = {
    singular: 'Item',
    plural: 'Items',
  };
}
