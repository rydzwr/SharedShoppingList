import {Injectable} from '@angular/core';
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {Product} from "../shared/interfaces/product";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private firestore: AngularFirestore) {
  }

  addProduct(product: Product) {
    return this.firestore.collection('products').add(product);
  }

  getProductsByUserAndGroup(userId: string, groupId: string): Observable<Product[]> {
    console.log("Test: -> getProductsByUserAndGroup", userId, groupId);
    return this.firestore.collection<Product>('products', ref =>
      ref.where('user', '==', userId).where('group', '==', groupId)
    ).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Product;
        const uid = a.payload.doc.id;
        return {uid, ...data};
      }))
    );
  }

  removeProduct(productId: string): Promise<void> {
    return this.firestore.collection('products').doc(productId).delete();
  }

  updateProduct(product: Product): Promise<void> {
    product.bought = !product.bought;
    return this.firestore.collection('products').doc(product.uid).update({bought: product.bought});
  }
}
