import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import {BehaviorSubject, Observable} from 'rxjs';
import {User} from "../shared/interfaces/user";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {
    this.initializeUserFromLocalStorage();
  }

  private mapFirebaseUserToCustomUser(fireBaseUser: firebase.User): User {
    return {
      uid: fireBaseUser.uid,
      name: fireBaseUser.displayName || 'Nan',
    };
  }

  private initializeUserFromLocalStorage(): void {
    const uid = localStorage.getItem("userUid");
    const name = localStorage.getItem("userName");

    if (uid && name) {
      this.getUserByUid(uid).subscribe(user => {
        if (user) {
          this.currentUserSubject.next(user);
        }
      });
    } else {
      this.currentUserSubject.next(null);
    }
  }

  isLoggedIn(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  async signInAnonymously(name: string): Promise<void> {
    try {
      const result = await this.afAuth.signInAnonymously();

      if (result.user) {
        localStorage.setItem("userUid", result.user.uid);
        localStorage.setItem("userName", name);

        this.currentUserSubject.next(this.mapFirebaseUserToCustomUser(result.user));
        this.updateUserData(result.user, name);
      } else {
        console.error('Failed to sign in anonymously');
      }
    } catch (error) {
      console.error('Error during anonymous sign-in:', error);
      throw new Error('Error during anonymous sign-in');
    }
  }

  getUserByUid(uid: string): Observable<User> {
    return this.firestore.collection('users').doc<User>(uid).valueChanges()
      .pipe(
        map(user => {
          if (user) {
            return {
              uid: user.uid,
              name: user.name
            } as User;
          }
          throw new Error("User Not Found By UID");
        })
      );
  }

  private updateUserData(user: firebase.User | null, name: string) {
    if (user) {
      const userRef = this.firestore.collection('users').doc(user.uid);
      const userData = {
        uid: user.uid,
        name: name
      };
      userRef.set(userData, {merge: true});
    }
  }
}
