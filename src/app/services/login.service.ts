import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import {Observable} from 'rxjs';
import {User} from "../shared/interfaces/user";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private currentUser: User | undefined;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
  ) {

  }

  private mapFirebaseUserToCustomUser(fireBaseUser: firebase.User): User {
    return {
      uid: fireBaseUser.uid,
      name: fireBaseUser.displayName || 'Nan',
    };
  }

  initializeCurrentUser(userFromAuth: firebase.auth.UserCredential) {
    const name = localStorage.getItem("userName");

    if (userFromAuth) {
      this.getUserByUid(userFromAuth.user?.uid!).subscribe(
        user => {
          if (user.uid && user.name) {
            if (!name) {
              localStorage.setItem("userName", user.name);
            }
            this.currentUser = user;
          }
        },
      );
    }
  }

  async signInAnonymously(name: string): Promise<void> {
    try {
      const result = await this.afAuth.signInAnonymously();
      if (result.user) {
        localStorage.setItem("userName", name);

        this.currentUser = this.mapFirebaseUserToCustomUser(result.user);
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
    return this.firestore.collection('users').doc<User>(uid).get()
      .pipe(
        map(docSnapshot => {
          if (docSnapshot.exists) {

            const user = docSnapshot.data() as User;
            const myUser: User = {
              uid: user.uid,
              name: user.name
            };

            return myUser
          } else {
            localStorage.removeItem("userName");
            throw new Error("User Not Found By UID");
          }
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

  public get currentLoggedUser() {
    return this.currentUser;
  }
}
