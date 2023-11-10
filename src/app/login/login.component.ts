import {Component} from '@angular/core';
import {LoginService} from "../shared/login.service";
import {Router} from "@angular/router";
import {Constants} from "../shared/constants";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(private loginService: LoginService, private router: Router) {
  }

  loginWithGoogle() {
    this.loginService.signInWithGoogle().then(userCredential => {
      console.log('Signed in with Google:', userCredential);
      this.router.navigate([Constants.HOME_ROUTE]);
    }).catch(error => {
      console.error('Error signing in with Google:', error);
    });
  }
}
