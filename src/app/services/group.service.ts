import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {
    BehaviorSubject,
    catchError,
    concatMap,
    exhaustMap,
    from,
    Observable,
    of,
    switchMap,
    take,
    tap,
    throwError
} from 'rxjs';
import {map} from 'rxjs/operators';
import {Group} from "../shared/interfaces/group";
import {User} from "../shared/interfaces/user";
import firebase from "firebase/compat/app";

@Injectable({
    providedIn: 'root',
})
export class GroupService {
    private userGroupsSubject: BehaviorSubject<Group[]> = new BehaviorSubject<Group[]>([]);
    userGroups$: Observable<Group[]> = this.userGroupsSubject.asObservable();

    private selectedGroupSubject: BehaviorSubject<Group | null> = new BehaviorSubject<Group | null>(null);
    selectedGroup$: Observable<Group | null> = this.selectedGroupSubject.asObservable();

    private groupUsersSubject: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    groupUsers$: Observable<User[]> = this.groupUsersSubject.asObservable();

    constructor(private firestore: AngularFirestore, private firestoreModule: AngularFirestoreModule) {
    }

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

    selectGroup(group: Group): void {
        this.selectedGroupSubject.next(group);
        this.fetchGroupUsers(group.users);
    }

    private fetchGroupUsers(userIds: string[]): void {
        const users: User[] = [];
        userIds.forEach(userId => {
            this.firestore.collection('users').doc<User>(userId).valueChanges().subscribe(user => {
                if (user) users.push(user);
                this.groupUsersSubject.next(users);
            });
        });
    }

    createNewGroup(groupName: string, userId: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const newGroup: Group = {
                name: groupName,
                inviteCode: Math.floor(100000 + Math.random() * 900000).toString(),
                users: [userId],
            };

            this.firestore
                .collection('groups')
                .add(newGroup)
                .then((docRef) => {
                    const groupId = docRef.id;
                    this.fetchUserGroups(userId);
                    resolve(groupId);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    removeUserFromGroup(groupId: string, userId: string) {
        return from(
            this.firestore
                .collection('groups')
                .doc(groupId)
                .update({
                    users: firebase.firestore.FieldValue.arrayRemove(userId),
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
                this.fetchUserGroups(userId);
            })
        );
    }

    joinGroup(name: string, inviteCode: string, userId: string) {
        name = name.trim();
        inviteCode = inviteCode.trim();

        this.firestore.collection('groups', ref =>
            ref.where('inviteCode', '==', inviteCode)
                .where('name', '==', name)
        ).get().subscribe(snapshot => {
            if (!snapshot.empty) {
                const docRef = snapshot.docs[0].ref;

                docRef.update({
                    users: firebase.firestore.FieldValue.arrayUnion(userId)
                }).then(() => {
                    console.log("User added to group successfully");
                }).catch(error => {
                    console.error("Error adding user to group: ", error);
                    throw new Error("Error adding user to group");
                });
            } else {
                console.log("No matching group found");
            }
        });
    }
}
