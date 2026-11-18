import { Component, computed, input, output } from '@angular/core';
import { PaginationMeta } from '@micropos/shared/src/db-types';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronFirst,
  lucideChevronLast,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideChevronUp,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmButtonGroupImports } from '@spartan-ng/helm/button-group';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'lib-pagination-controls',
  imports: [NgIcon, HlmSelectImports, HlmButtonImports, HlmButtonGroupImports],
  viewProviders: [
    provideIcons({
      lucideChevronUp,
      lucideChevronFirst,
      lucideChevronsLeft,
      lucideChevronLeft,
      lucideChevronRight,
      lucideChevronsRight,
      lucideChevronLast,
    }),
  ],
  templateUrl: './pagination-controls.html',
  styleUrl: './pagination-controls.css',
})
export class PaginationControls {
  readonly tableMeta = input.required<PaginationMeta>();
  // readonly perPage = input<number>();
  readonly perPageOptions = input<number[]>([15, 30, 50, 100, 200]);

  readonly onSkipPages = output<number>();
  readonly onNavigateFirstPage = output();
  readonly onNavigatePreviousPage = output();
  readonly onNavigateNextPage = output();
  readonly onNavigateLastPage = output();
  readonly onPerPageChange = output<number>();
  readonly onScrollToTop = output();

  readonly paginationLabel = computed(() => {
    const meta = this.tableMeta();
    if (!meta) return '-';
    const start = (meta.page - 1) * meta.perPage + 1;
    const end = Math.min(meta.page * meta.perPage, meta.total);
    return `${start}-${end} / ${meta.total}`;
  });
}
