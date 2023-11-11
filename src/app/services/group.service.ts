import {Injectable} from '@angular/core';
import {AngularFirestore, AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {BehaviorSubject, Observable} from 'rxjs';
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
        this.fetchUserGroups(userId);
      })
      .catch((error) => {
        console.error('Error removing user from group:', error);
      });
  }
}
