import {Injectable} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Router} from "@angular/router";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {User} from "../shared/interfaces/user";
import {Constants} from "../shared/constants";

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private afAuth: AngularFireAuth, private router: Router, private firestore: AngularFirestore) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.updateUserData(user);
        const customUser = this.mapFirebaseUserToCustomUser(user);
        this.currentUserSubject.next(customUser);
      }
    });
  }

  private mapFirebaseUserToCustomUser(fireBaseUser: firebase.User): User {
    return {
      uid: fireBaseUser.uid,
      displayName: fireBaseUser.displayName || 'Nan',
      email: fireBaseUser.email || 'Nan',
      photoURL: fireBaseUser.photoURL || 'Nan',
    };
  }

  isLoggedIn(): Observable<boolean> {
    return this.afAuth.authState.pipe(
      map(user => !!user)
    );
  }

  async signInWithGoogle(): Promise<firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await this.afAuth.signInWithPopup(provider);
    this.updateUserData(result.user);
    return result;
  }

  private updateUserData(user: firebase.User | null) {
    if (user) {
      const userRef = this.firestore.collection('users').doc(user.uid);
      const userData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      userRef.set(userData, {merge: true});
    }
  }

  signOut(): Promise<void> {
    return this.afAuth.signOut();
  }
}
