import { Component, computed, inject, signal } from '@angular/core';
import { ItemCrudControls } from './components/item-crud-controls/item-crud-controls';
import { ItemTable } from './components/item-table/item-table';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import {
  Item,
  ItemFilters,
  ItemSortField,
  PaginatedQueryOptions,
  PaginationOptions,
  SortConfig,
} from '@micropos/shared/src';
import { ItemService } from '../../../services/data/item-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  firstValueFrom,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { lucideRotateCw, lucideSearch, lucideXCircle } from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { ScannerService } from '../../../services/scanner-service';
import { toast } from '@spartan-ng/brain/sonner';

export type ItemsScanServiceFocusOptions = 'item-crud-controls-barcode-input' | 'root';

@Component({
  selector: 'app-items',
  imports: [
    ItemCrudControls,
    ItemTable,
    HlmSeparatorImports,
    HlmSwitchImports,
    HlmLabelImports,
    HlmInputImports,
    HlmInputGroupImports,
    NgIcon,
    HlmIconImports,
    FormsModule,
    HlmDialogImports,
    HlmFieldImports,
    HlmButtonImports,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideXCircle, lucideRotateCw })],
  templateUrl: './items.html',
  styles: ``,
})
export class Items {
  protected readonly itemsForDeletion = signal<Item[] | null>(null);
  protected readonly itemsForRestoration = signal<Item[] | null>(null);
  protected readonly itemForViewing = signal<Item | null>(null);

  protected readonly scannerService = inject(ScannerService);
  protected readonly scanServiceFocus = signal<ItemsScanServiceFocusOptions>('root');

  private readonly refresh$ = new Subject<void>();

  protected readonly itemService = inject(ItemService);
  protected readonly paginationQuery = signal<PaginationOptions>({
    page: 1,
    perPage: 15,
  });

  protected readonly searchString = signal<string>('');
  private readonly debouncedSearch$ = toObservable(this.searchString).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(''),
    tap(() => this.paginationQuery.update((prev) => ({ ...prev, page: 1 }))),
  );

  protected readonly queryFilters = signal<ItemFilters>({
    barcode: undefined,
    sku: undefined,
    name: undefined,
    created_at: undefined,
  });

  protected readonly querySort = signal<SortConfig<ItemSortField>>({
    field: 'createdAt',
    direction: 'desc',
  });

  protected readonly queryOptions = computed(
    (): PaginatedQueryOptions<ItemFilters, ItemSortField> => ({
      sort: this.querySort(),
      filters: this.queryFilters(),
      page: this.paginationQuery().page,
      perPage: this.paginationQuery().perPage,
    }),
  );

  protected readonly onlyDeleted = signal<boolean>(false);

  protected readonly queryRawResponse = toSignal(
    combineLatest([
      toObservable(this.queryOptions),
      this.debouncedSearch$,
      this.refresh$.pipe(startWith(null)),
      toObservable(this.onlyDeleted),
    ]).pipe(
      debounceTime(0),
      switchMap(([options, search, _, withDeleted]) => {
        const fullOptions: PaginatedQueryOptions<ItemFilters, ItemSortField> = {
          ...options,
          filters: {
            ...options.filters,
            search,
          },
        };

        const apiCall$ = withDeleted
          ? this.itemService.getAllDeleted(fullOptions)
          : this.itemService.getAll(fullOptions);

        return apiCall$.pipe(
          map((apiResponse) => {
            if (apiResponse.status === 200 && apiResponse.data) {
              return apiResponse.data;
            }
            return undefined;
          }),
          catchError((error) => {
            console.error('Failed to fetch items from main process:', error);
            return of(undefined);
          }),
        );
      }),
    ),
    { initialValue: undefined },
  );

  protected readonly tableMeta = computed(() => this.queryRawResponse()?.meta);
  protected readonly tableData = computed(() => this.queryRawResponse()?.data);

  protected refreshItems() {
    this.refresh$.next();
  }

  protected async deleteItemsForDeletion() {
    const items = this.itemsForDeletion();
    if (!items || items.length === 0) return;

    const ids = items.map((item) => item.id);
    const response = await firstValueFrom(this.itemService.delete(ids));

    if (response.status === 200) {
      toast.success('Items deleted/hidden');
      this.itemForViewing.set(null);
      this.itemsForDeletion.set(null);
      this.refreshItems();
    } else {
      toast.error('Failed to complete deletion operation', {
        description: response.error?.message,
      });
    }
  }

  protected async restoreItemsForRestoration() {
    const items = this.itemsForRestoration();
    if (!items || items.length === 0) return;

    const ids = items.map((item) => item.id);
    const response = await firstValueFrom(this.itemService.restore(ids));

    if (response.status === 200) {
      toast.success('Items restored');
      this.itemForViewing.set(null);
      this.itemsForRestoration.set(null);
      this.refreshItems();
    } else {
      toast.error('Failed to complete restoration operation', {
        description: response.error?.message,
      });
    }
  }

  constructor() {
    this.scannerService.dataStream$
      .pipe(filter(() => this.scanServiceFocus() === 'root'))
      .subscribe(({ barcode }) => {
        this.searchString.set(barcode);
      });
  }
}
