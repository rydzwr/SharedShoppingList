import {Component, OnInit} from '@angular/core';
import {LoginService} from "../services/login.service";
import {Router} from "@angular/router";
import {Constants} from "../shared/constants";
import {InputValidatorService} from "../services/input-validator.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  userName: string = '';

  constructor(
    private loginService: LoginService,
    private validator: InputValidatorService,
    private router: Router
  ) {
    this.loginService.currentUser$.subscribe(user => {
      if (user) {
        this.router.navigate([Constants.HOME_ROUTE]);
      }
    });
  }

  signIn(name: string) {
    if (!this.validator.isValidInput(name)) {
      throw new Error("Invalid Input Data");
    }

    this.loginService.signInAnonymously(name).then(() => {
      this.router.navigate([Constants.HOME_ROUTE]);
    }).catch(error => {
      console.error(error);
      throw new Error("Error Occurred While Signing In");
    });
  }
}
