import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {BehaviorSubject, Observable, take} from 'rxjs';
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

    removeUserFromGroup(groupId: string, userId: string): void {
        this.firestore
            .collection('groups')
            .doc(groupId)
            .update({
                users: firebase.firestore.FieldValue.arrayRemove(userId),
            })
            .then(() => {
                this.groupUsers$.pipe(
                    take(1)
                ).subscribe(users => {
                    if (users.length === 1) {
                        this.firestore.collection('groups').doc(groupId).delete()
                            .catch((error) => {
                                console.error('Error deleting group:', error)
                                throw new Error('Error deleting group');
                            })
                    }
                });
                this.fetchUserGroups(userId);
            })
            .catch((error) => {
                console.error('Error removing user from group:', error);
                throw new Error('Error removing user from group');
            });
    }

    joinGroup(groupName: string, inviteCode: string, userId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.firestore.collection<Group>('groups', ref =>
                ref.where('inviteCode', '==', inviteCode).where('name', '==', groupName)
            ).snapshotChanges().pipe(
                take(1),
                map(actions => actions.map(a => {
                    const data = a.payload.doc.data() as Group;
                    const uid = a.payload.doc.id;
                    return {uid, ...data};
                }))
            ).subscribe({
                next: (groups) => {
                    if (groups.length > 0) {
                        const group = groups[0];

                        this.firestore.collection('groups').doc(group.uid).update({
                            users: firebase.firestore.FieldValue.arrayUnion(userId),
                        }).then(() => {
                            this.fetchUserGroups(userId);
                            resolve();
                        }).catch(error => reject(error));
                    } else {
                        reject('Group not found or invite code incorrect');
                    }
                },
                error: (error) => reject(error)
            });
        });
    }
}
