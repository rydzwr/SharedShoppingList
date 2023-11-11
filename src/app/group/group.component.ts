import {Component, OnInit} from '@angular/core';
import {GroupService} from "../services/group.service";
import {ProductService} from "../services/product.service";
import {Product} from "../shared/interfaces/product";
import {User} from "../shared/interfaces/user";
import {Group} from "../shared/interfaces/group";
import {LoginService} from "../services/login.service";
import {BehaviorSubject, combineLatest, switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {Router} from "@angular/router";
import {Constants} from "../shared/constants";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {

  usersProducts$ = new BehaviorSubject<Map<string, Product[]>>(new Map());

  productData: Product = {name: '', count: 0, bought: false, user: '', group: ''};
  showProductForm = false;
  currentUser: User | null | undefined;
  currentGroup: Group | null | undefined;

  visibleProductsMap = new Map<string, boolean>();

  constructor(
    private productService: ProductService,
    public groupService: GroupService,
    private loginService: LoginService,
    private router: Router
  ) {
    this.loginService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.groupService.selectedGroup$.subscribe(group => {
      this.currentGroup = group;
    });
  }

  ngOnInit(): void {
    this.groupService.groupUsers$.pipe(
      switchMap(users => {
        if (!users.length) {
          return [];
        }
        return combineLatest(users.map(user => {
          return this.productService.getProductsByUserAndGroup(user.uid!, this.currentGroup?.uid!)
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

  addProduct() {
    if (this.currentUser && this.currentGroup) {
      this.productData.user = this.currentUser.uid || 'NaN';
      this.productData.group = this.currentGroup.uid || 'NaN';

      if (this.productData.name) {
        this.productService.addProduct(this.productData)
          .then(() => {
            console.log('Product added successfully.');
            this.showProductForm = false;
            this.productData = {name: '', count: 0, bought: false, user: '', group: ''};
          })
          .catch((error) => {
            console.error('Error adding product:', error);
          });
      } else {
        console.error('Product name is not defined.');
      }
    } else {
      console.error('User or group data is not available.');
    }
  }

  toggleProductsVisibility(userId: string) {
    const isCurrentlyVisible = this.visibleProductsMap.get(userId) || false;
    this.visibleProductsMap.set(userId, !isCurrentlyVisible);
  }

  isProductsVisible(userId: string): boolean {
    return !!this.visibleProductsMap.get(userId);
  }

  getTotalProductCount(userId: string): number {
    const products = this.usersProducts$.getValue().get(userId) || [];
    return products.length;
  }

  toggleProductBought(product: Product) {
    product.bought = !product.bought;

    this.productService.updateProduct(product)
      .then(() => console.log("Product bought status updated"))
      .catch(error => console.error("Error updating product:", error));
  }

  clearBoughtProducts(userId: string) {
    const userProducts = this.usersProducts$.getValue().get(userId) || [];
    const boughtProducts = userProducts.filter(product => product.bought);

    boughtProducts.forEach(product => {
      if (product.uid) {
        this.productService.removeProduct(product.uid).catch(error => console.error("Error removing product:", error));
      }
    });
  }

  leaveGroup(): void {
    if (this.currentUser && this.currentGroup) {
      const groupId = this.currentGroup.uid;
      const userId = this.currentUser.uid;

      this.groupService.removeUserFromGroup(groupId!, userId!);

      this.router.navigate([Constants.HOME_ROUTE]);
    }
  }
}
