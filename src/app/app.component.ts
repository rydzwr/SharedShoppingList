import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {Constants} from "./shared/constants";
import {initFlowbite} from "flowbite";
import {GlobalErrorHandlerService} from "./services/global-error-handler.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {
  }

  ngOnInit() {
    initFlowbite();
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.router.navigate([Constants.HOME_ROUTE]);
      } else {
        this.router.navigate([Constants.LOGIN_ROUTE]);
      }
    });
  }
}
