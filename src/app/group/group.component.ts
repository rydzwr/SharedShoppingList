import {Component, OnDestroy} from '@angular/core';
import {GroupService} from "../services/group.service";
import {ProductService} from "../services/product.service";
import {Product} from "../shared/interfaces/product";
import {User} from "../shared/interfaces/user";
import {LoginService} from "../services/login.service";
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  exhaustMap,
  filter,
  from,
  mergeMap,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError
} from "rxjs";
import {map} from "rxjs/operators";
import {Router} from "@angular/router";
import {Constants} from "../shared/constants";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnDestroy {

  usersProducts$ = new BehaviorSubject<Map<string, Product[]>>(new Map());
  visibleProductsMap = new Map<string, boolean>();
  destroy$ = new Subject<void>();

  public updateProductSubject = new Subject<Product>();
  public clearProductsSubject = new Subject<string>();
  public addProductSubject = new Subject<Product>();
  public leaveGroupSubject = new Subject<void>();

  productData: Product = {name: '', count: 0, bought: false};
  showInviteModal = false;
  showProductForm = false;
  showModal = false;

  currentUser: User | null | undefined;

  constructor(
    private productService: ProductService,
    private loginService: LoginService,
    public groupService: GroupService,
    private router: Router
  ) {

    this.addProductClickButtonEffect$.subscribe();
    this.updateProductClickButtonEffect$.subscribe();
    this.clearProductsClickButtonEffect$.subscribe();
    this.leaveGroupClickButtonEffect$.subscribe();

    this.groupService.groupUsers$.pipe(
      switchMap(users => {
        if (!users.length) {
          return [];
        }
        return combineLatest(users.map(user => {
          return this.productService.getProductsByUserAndGroup(user.uid!, this.groupService.selectedGroup?.uid!)
            .pipe(
              map(products => ({userId: user.uid, products})),
            );
        }));
      })
    ).subscribe(userProductsArray => {
      const usersProductsMap = new Map(this.usersProducts$.getValue());
      userProductsArray.forEach(({userId, products}) => {
        usersProductsMap.set(userId!, products);
      });
      this.usersProducts$.next(usersProductsMap);
    });
  }

  //  -------------------------------------------------------
  //  ADD PRODUCT
  //  -------------------------------------------------------

  addProductClickButtonEffect$ = this.addProductSubject.asObservable().pipe(
    filter(p => !!p.name && p.name.length > 0),
    takeUntil(this.destroy$),
    exhaustMap((p) =>
      fromPromise(this.productService.addProduct({
        ...p,
        user: this.loginService.currentLoggedUser?.uid,
        group: this.groupService.selectedGroup?.uid
      }))
    ),
    tap(() => {
      this.showProductForm = false;
      this.productData = {name: '', count: 0, bought: false};
    }),
    catchError((e: Error) => {
      throw new Error(e.name);
    })
  );

  //  -------------------------------------------------------
  //  UPDATE PRODUCT
  //  -------------------------------------------------------

  updateProductClickButtonEffect$ = this.updateProductSubject.asObservable().pipe(
    takeUntil(this.destroy$),
    exhaustMap(product =>
      fromPromise(this.productService.updateProduct(product))
    ),
    catchError(() => {
      throw new Error("Error While Toggling Bought!");
    })
  );

  //  -------------------------------------------------------
  //  CLEAR BOUGHT PRODUCTS
  //  -------------------------------------------------------

  clearProductsClickButtonEffect$ = this.clearProductsSubject.asObservable().pipe(
    takeUntil(this.destroy$),
    exhaustMap(userId => {
      const userProducts = this.usersProducts$.getValue().get(userId) || [];
      const boughtProducts = userProducts.filter(product => product.bought);

      return from(boughtProducts).pipe(
        mergeMap(product => {
          return fromPromise(this.productService.removeProduct(product.uid!));
        })
      );
    }),
    catchError(() => {
      throw new Error("Error While Clearing Bought Products!");
    })
  );

  leaveGroupClickButtonEffect$ = this.leaveGroupSubject.asObservable().pipe(
    takeUntil(this.destroy$),
    exhaustMap(() =>
      this.groupService.leaveGroup(this.groupService.selectedGroup?.uid!).pipe(
        tap(() => {
          this.router.navigate([Constants.HOME_ROUTE]);
        }),
        catchError(error => {
          return throwError(() => new Error('Error leaving group'));
        })
      )
    )
  );

  toggleProductsVisibility(userId: string) {
    const isCurrentlyVisible = this.visibleProductsMap.get(userId) || false;
    this.visibleProductsMap.set(userId, !isCurrentlyVisible);
  }

  getTotalProductCount(userId: string): number {
    const products = this.usersProducts$.getValue().get(userId) || [];
    return products.length;
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
