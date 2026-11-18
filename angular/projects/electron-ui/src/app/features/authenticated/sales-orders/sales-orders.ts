import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCw, lucideSearch, lucideX, lucideXCircle } from '@ng-icons/lucide';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { SalesOrderTable } from './sales-order-table/sales-order-table';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import {
  ApiResponse,
  PaginatedQueryOptions,
  PaginationOptions,
  SalesOrder,
  SalesOrderFilters,
  SalesOrderSortField,
  SortConfig,
} from '@micropos/shared/src';
import { ScannerService } from '../../../services/scanner-service';
import { SalesOrderService } from '../../../services/data/sales-order-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SalesOrderCrudControls } from './sales-order-crud-controls/sales-order-crud-controls';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sales-orders',
  imports: [
    HlmSeparatorImports,
    HlmInputGroupImports,
    NgIcon,
    FormsModule,
    HlmSwitchImports,
    SalesOrderTable,
    HlmButtonImports,
    SalesOrderCrudControls,
    HlmDialogImports,
  ],
  viewProviders: [provideIcons({ lucideSearch, lucideXCircle, lucideRotateCw, lucideX })],
  templateUrl: './sales-orders.html',
  styleUrl: './sales-orders.css',
})
export class SalesOrders {
  protected readonly scannerService = inject(ScannerService);
  protected readonly salesOrderService = inject(SalesOrderService);
  private readonly route = inject(ActivatedRoute);

  protected readonly salesOrderForDeletion = signal<SalesOrder[] | null>(null);
  protected readonly salesOrderForRestoration = signal<SalesOrder[] | null>(null);
  protected readonly salesOrderForViewing = signal<SalesOrder | null>(null);
  protected readonly paginationQuery = signal<PaginationOptions>({
    page: 1,
    perPage: 15,
  });

  private readonly routeParams = toSignal<{ orderNumber?: string }>(this.route.params, {
    initialValue: undefined,
  });

  protected readonly orderNumberSearchString = signal<string>('');
  private readonly debouncedOrderNumberSearch$ = toObservable(this.orderNumberSearchString).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    startWith(''),
    tap(() => this.paginationQuery.update((prev) => ({ ...prev, page: 1 }))),
  );

  private readonly refresh$ = new Subject<void>();

  readonly onlyDeleted = signal<boolean>(false);

  protected readonly querySort = signal<SortConfig<SalesOrderSortField>>({
    field: 'createdAt',
    direction: 'desc',
  });

  protected readonly queryOptions = computed(
    (): PaginatedQueryOptions<SalesOrderFilters, SalesOrderSortField> => ({
      sort: this.querySort(),
      page: this.paginationQuery().page,
      perPage: this.paginationQuery().perPage,
    }),
  );

  protected readonly queryRawResponse = toSignal(
    combineLatest([
      toObservable(this.queryOptions),
      this.debouncedOrderNumberSearch$,
      this.refresh$.pipe(startWith(null)),
      toObservable(this.onlyDeleted),
    ]).pipe(
      debounceTime(0),
      switchMap(([options, orderNumber, _, withDeleted]) => {
        const fullOptions: PaginatedQueryOptions<SalesOrderFilters, SalesOrderSortField> = {
          ...options,
          filters: {
            ...options.filters,
            orderNumber,
          },
        };

        const apiCall$ = withDeleted
          ? this.salesOrderService.getAllDeleted(fullOptions)
          : this.salesOrderService.getAll(fullOptions);

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

  deleteSalesOrderForDeletion() {
    const salesOrderIds = this.salesOrderForDeletion()?.map((s) => s.id);
    if (salesOrderIds) {
      this.salesOrderService.delete(salesOrderIds).subscribe((apiResponse) => {
        if (apiResponse.status === 200) {
          toast.success('Sales Orders Deleted');
          this.salesOrderForViewing.set(null);
          this.salesOrderForDeletion.set(null);
          this.refreshTable();
        } else {
          toast.error('Sales Orders Deletion Failed', { description: 'Something went wrong.' });
        }
      });
    }
  }

  restoreSalesOrdersForRestoration() {
    const salesOrderIds = this.salesOrderForRestoration()?.map((s) => s.id);
    if (salesOrderIds) {
      this.salesOrderService.restore(salesOrderIds).subscribe((apiResponse) => {
        if (apiResponse.status === 200) {
          toast.success('Sales Orders Restored');
          this.salesOrderForViewing.set(null);
          this.salesOrderForRestoration.set(null);
          this.refreshTable();
        } else {
          toast.error('Sales Orders Restoration Failed', { description: 'Something went wrong.' });
        }
      });
    }
  }

  protected refreshTable() {
    this.refresh$.next();
  }

  constructor() {
    effect(() => {
      const params = this.routeParams();
      const orderNumber = params?.orderNumber;

      if (orderNumber) {
        this.salesOrderService
          .getByOrderNumber(orderNumber)
          .subscribe((apiResponse: ApiResponse<SalesOrder | undefined>) => {
            console.log(apiResponse);
            if (apiResponse.data) {
              this.salesOrderForViewing.set(apiResponse.data);
            }
          });
      } else {
        this.salesOrderForViewing.set(null);
      }
    });
  }
}
