import {Injectable, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {
    BehaviorSubject,
    catchError,
    concatMap,
    EMPTY,
    exhaustMap,
    filter,
    from,
    mergeMap,
    Observable,
    Subject,
    takeUntil,
    tap,
    throwError,
    withLatestFrom
} from 'rxjs';
import {map} from 'rxjs/operators';
import {Group} from "../shared/interfaces/group";
import {User} from "../shared/interfaces/user";
import firebase from "firebase/compat/app";
import {Router} from "@angular/router";
import {LoginService} from "./login.service";
import {ProductService} from "./product.service";
import {Product} from "../shared/interfaces/product";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {Constants} from "../shared/constants";

@Injectable({
    providedIn: 'root',
})
export class GroupService implements OnDestroy {

    userProductsMapSubject = new BehaviorSubject<Map<string, { user: User, products: Product[] }>>(new Map());

    selectedGroupSubject = new BehaviorSubject<Group | null>(null);

    userGroupsSubject: BehaviorSubject<Group[]> = new BehaviorSubject<Group[]>([]);

    updateProductSubject = new Subject<Product>();

    loggedUserGroupsSubject = new Subject<User>();

    addProductSubject = new Subject<Product>();

    clearProductsSubject = new Subject<User>();

    leaveGroupSubject = new Subject<void>();


    userProductsMap$ = this.userProductsMapSubject.asObservable();

    userGroups$: Observable<Group[]> = this.userGroupsSubject.asObservable();

    destroy$ = new Subject<void>();


    productData: Product = {name: '', count: 0, bought: false};

    constructor(
        private firestore: AngularFirestore,
        private loginService: LoginService,
        private productService: ProductService,
        private router: Router
    ) {
        this.getUserProductsMapEffect$.subscribe();
        this.getUserGroupsEffect$.subscribe();

        this.addProductClickButtonEffect$.subscribe();
        this.updateProductClickButtonEffect$.subscribe();
        this.clearProductsClickButtonEffect$.subscribe();
        this.leaveGroupClickButtonEffect$.subscribe();
    }

    getUserProductsMapEffect$ = this.selectedGroupSubject.asObservable().pipe(
        takeUntil(this.destroy$),
        filter((group): group is Group => !!group),
        tap(() => console.log("Get User Product Map Called!")),
        mergeMap((group) => from(group.users).pipe(
            tap(() => console.log("Get User Product Map Called!  2")),
            mergeMap(userId => this.firestore.collection('users').doc<User>(userId).valueChanges()),
            filter((user): user is User => !!user),
            mergeMap((user) => this.productService.getProductsByUserAndGroup(user.uid, group.uid!).pipe(
                tap(() => console.log("Get User Product Map Called!  3")),
                    tap((products) => {
                        const map = new Map(this.userProductsMapSubject.getValue());
                        map.set(user.uid, {user, products});
                        this.userProductsMapSubject.next(map);
                    })
                )
            ),
        )),
        catchError((e: Error) => {
            throw new Error(e.name);
        }),
    );

    getUserGroupsEffect$ = this.loggedUserGroupsSubject.asObservable().pipe(
        takeUntil(this.destroy$),
        exhaustMap((user) => {
            return this.firestore
                .collection('groups', (ref) => ref.where('users', 'array-contains', user.uid))
                .snapshotChanges()
                .pipe(
                    map((actions) =>
                        actions.map((a) => {
                            const data = a.payload.doc.data() as Group;
                            const uid = a.payload.doc.id;
                            return {uid, ...data};
                        })
                    ),
                    tap(groups => this.userGroupsSubject.next(groups))
                );
        }),
        catchError((e: Error) => {
            throw new Error(e.message);
        })
    );

    addProductClickButtonEffect$ = this.addProductSubject.asObservable().pipe(
        filter(p => !!p.name && p.name.length > 0),
        takeUntil(this.destroy$),
        exhaustMap((p) =>
            fromPromise(this.productService.addProduct({
                ...p,
                user: this.loginService.currentLoggedUser?.uid,
                group: this.selectedGroupSubject.getValue()?.uid
            }))
        ),
        tap(() => {
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
        withLatestFrom(this.userProductsMapSubject),
        exhaustMap(([userId, map]) => {
            const userProducts = map.get(userId.uid)?.products!;
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
        withLatestFrom(this.selectedGroupSubject),
        exhaustMap(([, group]) => {
            if (!group) {
                return EMPTY;
            }
            return from(
                this.firestore
                    .collection('groups')
                    .doc(group.uid)
                    .update({
                        users: firebase.firestore.FieldValue.arrayRemove(this.loginService.currentLoggedUser?.uid),
                    })
            ).pipe(
                withLatestFrom(this.selectedGroupSubject),
                concatMap(([, group]) => {
                    if (group && group.users.length === 1) {
                        return from(this.firestore.collection('groups').doc(group.uid).delete());
                    }
                    return EMPTY;
                }),
                catchError(() => {
                    return throwError(() => new Error('Error removing user from group'));
                })
            );
        }),
        tap(() => this.router.navigate([Constants.HOME_ROUTE])),
        catchError(() => {
            return throwError(() => new Error('Error leaving group'));
        })
    );

    createNewGroup(groupName: string, userId: string): Promise<Group> {
        return new Promise<Group>((resolve, reject) => {
            let newGroup: Group = {
                name: groupName,
                inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
                users: [userId]
            };

            this.firestore
                .collection('groups')
                .add(newGroup)
                .then((docRef) => {
                    newGroup.uid = docRef.id;
                    resolve(newGroup);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    joinGroup(name: string, inviteCode: string): Promise<Group> {
        return new Promise<Group>((resolve, reject) => {
            this.firestore.collection('groups', ref =>
                ref.where('inviteCode', '==', inviteCode)
                    .where('name', '==', name)
            ).get().subscribe(snapshot => {
                if (!snapshot.empty) {
                    const groupDoc = snapshot.docs[0];
                    const groupData: Group = groupDoc.data() as Group;
                    groupData.uid = groupDoc.id;

                    groupDoc.ref.update({
                        users: firebase.firestore.FieldValue.arrayUnion(this.loginService.currentLoggedUser?.uid!)
                    }).then(() => {
                        resolve(groupData);
                    }).catch(() => {
                        reject(new Error("Error adding user to group"));
                    });
                }
            }, () => {
                reject(new Error("Error fetching group"));
            });
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
    }
}
