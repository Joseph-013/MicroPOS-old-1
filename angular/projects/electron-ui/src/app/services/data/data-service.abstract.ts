import {
  ApiResponse,
  FilterValue,
  PaginatedQueryOptions,
  PaginationResponse,
} from '@micropos/shared/src';
import { from, map, Observable } from 'rxjs';

export abstract class DataService<
  TEntity,
  TNewEntity,
  TUpdateEntity,
  TFilters extends Record<string, FilterValue>,
  TSortField extends string,
> {
  abstract entityName: string;

  // Optional serialization hooks (default to pass-through)
  protected serialize(payload: TNewEntity | TUpdateEntity): any {
    return payload;
  }

  protected deserialize(entity: TEntity): TEntity {
    return entity;
  }

  get(
    id: string,
    options?: { withDeleted?: boolean },
  ): Observable<ApiResponse<TEntity | undefined>> {
    return from(
      window.electronAPI.invoke<ApiResponse<TEntity | undefined>>(`${this.entityName}:get`, {
        id,
        options,
      }),
    ).pipe(
      map((res) => ({
        ...res,
        data: res.data ? this.deserialize(res.data) : undefined,
      })),
    );
  }

  getAll(
    options: PaginatedQueryOptions<TFilters, TSortField>,
  ): Observable<ApiResponse<PaginationResponse<TEntity>>> {
    return from(
      window.electronAPI.invoke<ApiResponse<PaginationResponse<TEntity>>>(
        `${this.entityName}:getAll`,
        options,
      ),
    ).pipe(
      map((res) => {
        // If there's no data or meta returned, pass it through cleanly
        if (!res.data || !res.data.meta) {
          return res;
        }

        return {
          ...res,
          data: {
            meta: res.data.meta, // Explicitly provide meta so it's guaranteed non-undefined
            data: res.data.data.map((item) => this.deserialize(item)),
          },
        };
      }),
    );
  }

  getAllDeleted(
    options: PaginatedQueryOptions<TFilters, TSortField>,
  ): Observable<ApiResponse<PaginationResponse<TEntity>>> {
    return from(
      window.electronAPI.invoke<ApiResponse<PaginationResponse<TEntity>>>(
        `${this.entityName}:getAllDeleted`,
        options,
      ),
    ).pipe(
      map((res) => {
        if (!res.data || !res.data.meta) {
          return res;
        }

        return {
          ...res,
          data: {
            meta: res.data.meta,
            data: res.data.data.map((item) => this.deserialize(item)),
          },
        };
      }),
    );
  }

  create(payload: TNewEntity): Observable<ApiResponse<TEntity>> {
    const dbPayload = this.serialize(payload);
    return from(
      window.electronAPI.invoke<ApiResponse<TEntity>>(`${this.entityName}:create`, dbPayload),
    ).pipe(
      map((res) => ({
        ...res,
        data: res.data ? this.deserialize(res.data) : res.data,
      })),
    );
  }

  update(id: string, payload: TUpdateEntity): Observable<ApiResponse<TEntity>> {
    const dbPayload = this.serialize(payload);
    return from(
      window.electronAPI.invoke<ApiResponse<TEntity>>(`${this.entityName}:update`, {
        id,
        payload: dbPayload,
      }),
    ).pipe(
      map((res) => ({
        ...res,
        data: res.data ? this.deserialize(res.data) : res.data,
      })),
    );
  }

  delete(params: string | string[]): Observable<ApiResponse<void>> {
    return from(window.electronAPI.invoke<ApiResponse<void>>(`${this.entityName}:delete`, params));
  }

  // forceDelete(params: string | string[]): Observable<ApiResponse<void>> {
  //   return from(window.electronAPI.invoke(`${this.entityName}:ForceDelete`, { params }));
  // }

  restore(params: string | string[]): Observable<ApiResponse<void>> {
    return from(window.electronAPI.invoke<ApiResponse<void>>(`${this.entityName}:restore`, params));
  }
}
