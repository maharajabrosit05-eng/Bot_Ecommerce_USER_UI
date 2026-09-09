import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonServiceService {

  // =========================================================
  // BASE URL
  // =========================================================

  public baseUrl = environment.apiUrl;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private http: HttpClient
  ) {}


  // =========================================================
  // GET ALL PRODUCTS
  // API:
  // GET /api/Product/ItemList
  // =========================================================

  // GetAllProducts(): Observable<any> {

  //   return this.http.get(
  //     `${this.baseUrl}/api/Product/ItemList`
  //   );

  // }


  // =========================================================
  // GET PRODUCT BY CODE
  // API doesn't have separate GetByCode endpoint,
  // so full product list is fetched and filtered.
  // =========================================================

  // GetProductByCode(
  //   productCode: string
  // ): Observable<any> {

  //   return new Observable(observer => {

  //     this.GetAllProducts()
  //       .subscribe({

  //         next: (response: any) => {

  //           const list =
  //             Array.isArray(response)
  //               ? response
  //               : response?.data || [];


  //           const product =
  //             list.find(
  //               (item: any) =>
  //                 item?.Product_Code === productCode ||
  //                 item?.ProductCode === productCode
  //             );


  //           observer.next({
  //             status: !!product,
  //             data: product
  //               ? [product]
  //               : []
  //           });


  //           observer.complete();

  //         },


  //         error: (error: any) => {

  //           observer.error(error);

  //         }

  //       });

  //   });

  // }


  // =========================================================
  // SEARCH PRODUCTS
  // Searches Product Name / Product Code / SKU
  // =========================================================

  // SearchProducts(
  //   searchTerm: string
  // ): Observable<any> {

  //   return new Observable(observer => {

  //     this.GetAllProducts()
  //       .subscribe({

  //         next: (response: any) => {

  //           const list =
  //             Array.isArray(response)
  //               ? response
  //               : response?.data || [];


  //           const search =
  //             String(searchTerm || '')
  //               .trim()
  //               .toLowerCase();


  //           if (!search) {

  //             observer.next({
  //               status: true,
  //               data: []
  //             });

  //             observer.complete();

  //             return;

  //           }


  //           const filtered =
  //             list.filter((item: any) => {

  //               const productName =
  //                 String(
  //                   item?.Product_Name ??
  //                   item?.ProductName ??
  //                   ''
  //                 ).toLowerCase();


  //               const productCode =
  //                 String(
  //                   item?.Product_Code ??
  //                   item?.ProductCode ??
  //                   ''
  //                 ).toLowerCase();


  //               const sku =
  //                 String(
  //                   item?.SKU ??
  //                   item?.Sku ??
  //                   item?.sku ??
  //                   ''
  //                 ).toLowerCase();


  //               return (
  //                 productName.includes(search) ||
  //                 productCode.includes(search) ||
  //                 sku.includes(search)
  //               );

  //             });


  //           observer.next({
  //             status: true,
  //             data: filtered
  //           });


  //           observer.complete();

  //         },


  //         error: (error: any) => {

  //           observer.error(error);

  //         }

  //       });

  //   });

  // }

}