import {Component} from '@angular/core';
import {LoginService} from "../../services/login.service";
import {Router} from "@angular/router";
import {Constants} from "../constants";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(public loginService: LoginService, private router: Router) {
  }

  navigateToHome() {
    this.router.navigate([Constants.HOME_ROUTE]);
  }
}
