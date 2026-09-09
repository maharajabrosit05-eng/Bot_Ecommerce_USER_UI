import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private products: Product[] = [];


  // =========================================================
  // GET PRODUCT BY ID
  // =========================================================

  getById(id: string): Product | undefined {

    return this.products.find(
      product =>
        String(product.id) === String(id)
    );

  }


  // =========================================================
  // GET RELATED PRODUCTS
  // =========================================================

  getRelated(product: Product): Product[] {

    return this.products.filter(
      item =>
        item.category === product.category &&
        String(item.id) !== String(product.id)
    );

  }


  // =========================================================
  // GET ALL PRODUCTS
  // =========================================================

  getAll(): Product[] {

    return this.products;

  }

}