import {
  computed,
  Directive,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { PaginationMeta, PaginationOptions, SortConfig, SortDirection } from '@micropos/shared/src';

@Directive()
export abstract class DataTable<TEntity extends { id: string }> {
  abstract entityDefinition: {
    singular: string;
    plural: string;
  };
  protected readonly scrollContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('scrollContainer');

  readonly tableData = input<TEntity[]>();
  readonly tableMeta = input<PaginationMeta>();
  readonly activeRowId = input<string | null>(null);

  readonly checkedEntities = model<TEntity[]>([]);
  readonly paginationQuery = model<PaginationOptions>();
  readonly sortConfig = model<SortConfig | undefined>(undefined);

  readonly selectedEntity = signal<TEntity | null>(null);

  readonly onEntityClick = output<TEntity>();
  readonly onRestoreEntities = output<TEntity[]>();

  readonly paginationLabel = computed(() => {
    const meta = this.tableMeta();
    if (!meta) return '-';
    const start = (meta.page - 1) * meta.perPage + 1;
    const end = Math.min(meta.page * meta.perPage, meta.total);
    return `${start}-${end} / ${meta.total}`;
  });

  readonly someEntitiesChecked = computed(
    () => !this.allEntitiesChecked() && this.checkedEntities().length > 0,
  );

  readonly allEntitiesChecked = computed(
    () =>
      this.tableData()?.length === this.checkedEntities().length &&
      this.checkedEntities().length > 0,
  );

  skipPages(delta: number): void {
    const total = this.tableMeta()?.totalPages ?? 1;
    this.paginationQuery.update((prev) => ({
      ...prev,
      page: Math.min(total, Math.max(1, (prev?.page ?? 1) + delta)),
    }));
  }

  entityIsChecked(entity: TEntity) {
    const { id } = entity;
    return this.checkedEntities().some((i) => i.id === id);
  }

  toggleAllEntitiesChecked(newValue: boolean) {
    if (newValue) this.checkedEntities.set(this.tableData() ?? []);
    else this.checkedEntities.set([]);
  }

  toggleCheckedEntity(entity: TEntity, newValue: boolean) {
    const entityIdIsChecked = this.entityIsChecked(entity);
    if (entityIdIsChecked === newValue) return;
    if (newValue) {
      this.checkedEntities.update((prev) => [...prev, entity]);
    } else {
      this.checkedEntities.update((prev) => prev.filter((e) => e.id !== entity.id));
    }
  }

  toggleSort(field: string) {
    const current = this.sortConfig();

    if (!current || current.field !== field) {
      this.sortConfig.set({ field, direction: 'asc' });
      return;
    }

    let nextDirection: SortDirection | undefined;
    if (!current.direction) {
      nextDirection = 'asc';
    } else if (current.direction === 'asc') {
      nextDirection = 'desc';
    } else {
      nextDirection = undefined;
    }

    if (nextDirection === undefined) {
      this.sortConfig.set(undefined);
    } else {
      this.sortConfig.set({ field, direction: nextDirection });
    }
  }

  setPerPage(newValue?: number | null) {
    this.paginationQuery.update((prev) => ({ ...prev, perPage: newValue ?? 15 }));
  }

  scrollToTop() {
    const container = this.scrollContainer();
    if (container) {
      container.nativeElement.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  constructor() {
    effect(() => {
      const _ = this.tableData();
      untracked(() => this.checkedEntities.set([]));
    });

    effect(() => {
      const _ = this.tableMeta()?.page;
      this.scrollToTop();
    });
  }
}
