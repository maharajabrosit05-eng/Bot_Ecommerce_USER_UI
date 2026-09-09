import {
  Component,
  OnInit,
  HostListener
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  CommonService
} from '../../../../service/common.service';


/* =========================================================
   CATEGORY MODEL
========================================================= */

interface CategoryIcon {

  name: string;

  icon: string;

}


/* =========================================================
   COMPONENT
========================================================= */

@Component({

  selector: 'app-category-bar',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink
  ],

  templateUrl: './category-bar.component.html',

  styleUrl: './category-bar.component.scss'

})


export class CategoryBarComponent implements OnInit {


  /* =======================================================
     CATEGORY LIST
  ======================================================= */

  categories: CategoryIcon[] = [];


  /* =======================================================
     STATES
  ======================================================= */

  loading = false;

  isScrolled = false;


  /* =======================================================
     ⭐ IMAGE ERROR TRACKING
     If the mapped image fails to actually load (404, wrong
     path, etc.) we flip this so the template swaps to the
     fallback icon instead of leaving a blank circle.
  ======================================================= */

  imageErrorMap: {
    [key: string]: boolean
  } = {};



  private categoryIconMap: Record<string, string> = {

    Monitor:
      'assets/icons/moitor.png',

    Mouse:
      'assets/icons/mouse.png',

    Keyboard:
      'assets/icons/keyboard.png',

    'Key Board':
      'assets/icons/keyboard.png',

    CPU:
      'assets/icons/cpu.png',

    UPS:
      'assets/icons/ups.png',

    Motherboard:
      'assets/icons/motherboard.png',

    'Mother Board':
      'assets/icons/motherboard.png',

    Laptop:
      'assets/icons/laptop.png',

    Desktop:
      'assets/icons/desktop.png',

    Tablet:
      'assets/icons/tablet-1.png',

    Mobile:
      'assets/icons/mobile-1.png',

    Speaker:
      'assets/icons/speaker.png',

    Headphones:
      'assets/icons/headphone.png',

   
    Headset:
      'assets/icons/headphone.png',

    Earphone:
      'assets/icons/headphone.png',

    Earphones:
      'assets/icons/headphone.png',

    Printer:
      'assets/icons/printer.png',

    Camera:
      'assets/icons/camera.png',

    Router:
      'assets/icons/router.png',

    Cable:
      'assets/icons/cable.png'

  };


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(
    private commonService: CommonService
  ) {}


  /* =======================================================
     INIT
  ======================================================= */

  ngOnInit(): void {

    this.loadCategories();

  }


  /* =======================================================
     WINDOW SCROLL
  ======================================================= */

  @HostListener('window:scroll', [])
  onWindowScroll(): void {

    this.isScrolled =
      (window.scrollY ||
       document.documentElement.scrollTop) > 10;

  }


  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  private loadCategories(): void {

    this.loading = true;


    this.commonService.CategoryList()
      .subscribe({

        next: (response: any) => {

          const data =
            this.extractArray(response);


          const names =
            this.extractNames(data);


          this.categories =
            names.map(name => ({

              name: name,

              icon:
                this.getCategoryIcon(name)

            }));


          this.imageErrorMap = {};


          this.loading = false;

        },


        error: (error) => {

          console.error(
            'Error loading categories for category bar:',
            error
          );


          this.categories = [];

          this.loading = false;

        }

      });

  }


  /* =======================================================
     ⭐ NORMALIZE A CATEGORY NAME FOR MATCHING
     Strips everything except letters/numbers and lowercases,
     so "Head Phones", "HEAD-PHONES", "head_phones" and
     "Headphones" all resolve to the same key: "headphones".
  ======================================================= */

  private normalize(
    value: string
  ): string {

    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  }


  /* =======================================================
     GET CATEGORY IMAGE

     Handles:
     Keyboard / Key Board / KEYBOARD
     Headphone / Headphones / Head Phones / HEAD-PHONES
     etc. — anything that normalizes to the same string.
  ======================================================= */

  private getCategoryIcon(
    categoryName: string
  ): string {

    const normalizedName =
      this.normalize(categoryName);


    const matchedKey =
      Object.keys(this.categoryIconMap)
        .find(key =>
          this.normalize(key) === normalizedName
        );


    if (matchedKey) {

      return this.categoryIconMap[matchedKey];

    }


    /*
      No image mapped for this category.
      Empty string -> template shows the fallback icon.
    */

    return '';

  }


  /* =======================================================
     ⭐ IMAGE ERROR HANDLER
     If the mapped image path itself fails to load (wrong
     filename, missing asset, etc.), mark it errored so the
     template swaps to the fallback icon instead of leaving
     a blank circle.
  ======================================================= */

  onImageError(
    categoryName: string
  ): void {

    this.imageErrorMap = {

      ...this.imageErrorMap,

      [categoryName]: true

    };

  }


  /* =======================================================
     EXTRACT ARRAY
  ======================================================= */

  private extractArray(
    response: any
  ): any[] {

    if (Array.isArray(response)) {

      return response;

    }


    if (Array.isArray(response?.data)) {

      return response.data;

    }


    if (Array.isArray(response?.Data)) {

      return response.Data;

    }


    if (Array.isArray(response?.result)) {

      return response.result;

    }


    if (Array.isArray(response?.Result)) {

      return response.Result;

    }


    if (Array.isArray(response?.items)) {

      return response.items;

    }


    if (Array.isArray(response?.Items)) {

      return response.Items;

    }


    return [];

  }


  /* =======================================================
     EXTRACT CATEGORY NAMES
  ======================================================= */

  private extractNames(
    data: any[]
  ): string[] {

    const values =

      data

        .map((item: any) => {

          if (
            typeof item === 'string'
          ) {

            return item.trim();

          }


          return String(

            item?.Category_Name ??

            item?.CategoryName ??

            item?.category_name ??

            item?.categoryName ??

            item?.Category ??

            item?.category ??

            item?.Name ??

            item?.name ??

            ''

          ).trim();

        })


        .filter(
          (name: string) => !!name
        );


    /*
      Remove duplicate categories
    */

    return [
      ...new Set(values)
    ];

  }

}