import {Component} from '@angular/core';
import {LoginService} from "../services/login.service";
import {Router} from "@angular/router";
import {Constants} from "../shared/constants";
import {AngularFireAuth} from "@angular/fire/compat/auth";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  userName: string = '';
  isLoading: boolean = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private afAuth: AngularFireAuth,
  ) {
    this.isLoading = true;

    this.afAuth.signInAnonymously().then(user => {
      if (user.user) {
        loginService.initializeCurrentUser(user)
        setTimeout(() => {
          this.router.navigate([Constants.HOME_ROUTE]);
          this.isLoading = false;
        }, 1000);
      } else {
        setTimeout(() => {
          this.isLoading = false;
        }, 1000);
      }
      }
    );
  }

  signIn(name: string) {
    this.loginService.signInAnonymously(name).then(() => {
      this.router.navigate([Constants.HOME_ROUTE]);
    }).catch(error => {
      console.error(error);
      throw new Error("Error Occurred While Signing In");
    });
  }
}
