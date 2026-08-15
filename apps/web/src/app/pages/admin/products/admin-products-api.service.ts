import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url';

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
}

export interface ApiFlag {
  id: string;
  slug: string;
  label: string;
  labelFr: string;
  labelAr: string;
}

export interface ApiProduct {
  id: string;
  slug: string;
  name: string;
  nameFr: string;
  nameAr: string;
  description?: string | null;
  descriptionFr?: string | null;
  descriptionAr?: string | null;
  priceCents: number;
  price: string;
  currency: string;
  imageUrl?: string | null;
  promotion: boolean;
  ogPrice?: number | null;
  promoPrice?: number | null;
  flagId?: string | null;
  flag?: ApiFlag | null;
  status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  sortOrder: number;
  categoryId: string;
  category: ApiCategory;
}

export interface ProductListResponse {
  items: ApiProduct[];
  total: number;
  page: number;
  limit: number;
}

export type ProductPayload = Omit<ApiProduct, 'id' | 'category' | 'currency' | 'sortOrder' | 'price' | 'promotion' | 'ogPrice' | 'promoPrice'> & {
  categoryId: string;
  priceCents: number;
  currency?: string;
  sortOrder?: number;
  promotion?: boolean;
  ogPrice?: number | null;
  promoPrice?: number | null;
  tags?: string[];
  allergens?: string[];
};

@Injectable({ providedIn: 'root' })
export class AdminProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  list(search = ''): Observable<ProductListResponse> {
    let params = new HttpParams().set('limit', 100);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<ProductListResponse>(`${this.baseUrl}/products`, { params });
  }

  create(payload: ProductPayload): Observable<ApiProduct> {
    return this.http.post<ApiProduct>(`${this.baseUrl}/products`, payload);
  }

  update(id: string, payload: Partial<ProductPayload>): Observable<ApiProduct> {
    return this.http.patch<ApiProduct>(`${this.baseUrl}/products/${id}`, payload);
  }

  delete(id: string): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(`${this.baseUrl}/products/${id}`);
  }

  uploadImage(id: string, file: File): Observable<ApiProduct> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ApiProduct>(`${this.baseUrl}/products/${id}/image`, body);
  }

  deleteImage(id: string): Observable<ApiProduct> {
    return this.http.delete<ApiProduct>(`${this.baseUrl}/products/${id}/image`);
  }
}
