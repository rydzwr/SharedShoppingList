import {Injectable, OnDestroy} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  exhaustMap,
  filter,
  from,
  Observable,
  of,
  Subject,
  take,
  takeUntil,
  tap,
  throwError
} from 'rxjs';
import {map} from 'rxjs/operators';
import {Group} from "../shared/interfaces/group";
import {User} from "../shared/interfaces/user";
import firebase from "firebase/compat/app";
import {Constants} from "../shared/constants";
import {Router} from "@angular/router";
import {LoginService} from "./login.service";

@Injectable({
  providedIn: 'root',
})
export class GroupService implements OnDestroy {
  private userGroupsSubject: BehaviorSubject<Group[]> = new BehaviorSubject<Group[]>([]);
  userGroups$: Observable<Group[]> = this.userGroupsSubject.asObservable();

  private groupUsersSubject: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
  groupUsers$: Observable<User[]> = this.groupUsersSubject.asObservable();

  public selectedGroupSubject = new Subject<Group>();

  destroy$ = new Subject<void>();

  currentGroup: Group | undefined;

  constructor(
    private firestore: AngularFirestore,
    private loginService: LoginService,
    private router: Router
  ) {
    this.selectGroupEffect$.subscribe();
  }

  selectGroupEffect$ = this.selectedGroupSubject.asObservable().pipe(
    filter(p => !!p && !!p.name && p.name.length > 0),
    takeUntil(this.destroy$),
    exhaustMap(group => {
      this.currentGroup = group;
      const users: User[] = [];
      group.users.forEach(userId => {
        this.firestore.collection('users').doc<User>(userId).valueChanges().subscribe(user => {
          if (user) {
            users.push(user);
          }
        });
      });
      this.groupUsersSubject.next(users);
      return of(group);
    }),
    tap(() => {
      this.router.navigate([Constants.GROUP_ROUTE]);
    }),
    catchError((e: Error) => {
      throw new Error(e.name);
    })
  );

  fetchUserGroups(userId: string): void {
    console.log("Fetching Groups");
    this.firestore
      .collection('groups', (ref) => ref.where('users', 'array-contains', userId))
      .snapshotChanges()
      .pipe(
        map((actions) =>
          actions.map((a) => {
            const data = a.payload.doc.data() as Group;
            const uid = a.payload.doc.id;
            return {uid, ...data};
          })
        )
      )
      .subscribe((groups) => {
        this.userGroupsSubject.next(groups);
      });
  }

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
          this.fetchUserGroups(userId);
          resolve(newGroup);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }


  leaveGroup(groupId: string) {
    return from(
      this.firestore
        .collection('groups')
        .doc(groupId)
        .update({
          users: firebase.firestore.FieldValue.arrayRemove(this.loginService.currentLoggedUser?.uid),
        })
    ).pipe(
      concatMap(() => this.groupUsers$.pipe(take(1))),
      concatMap(users => {
        if (users.length === 1) {
          return from(this.firestore.collection('groups').doc(groupId).delete());
        } else {
          return of(null);
        }
      }),
      catchError(error => {
        console.error('Error in removeUserFromGroup:', error);
        return throwError(() => new Error('Error removing user from group'));
      }),
      tap(() => {
        this.fetchUserGroups(this.loginService.currentLoggedUser?.uid!);
      })
    );
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
          }).catch(error => {
            reject(new Error("Error adding user to group"));
          });
        }
      }, error => {
        reject(new Error("Error fetching group"));
      });
    });
  }

  public get selectedGroup() {
    return this.currentGroup;
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
