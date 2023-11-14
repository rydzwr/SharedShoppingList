import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Constants} from "./shared/constants";
import {initFlowbite} from "flowbite";
import {LoginService} from "./services/login.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor() {
    initFlowbite();
  }

  // TODO 1
  //  Reactive update group users,
  //  because now, when other user leaves group it doesn't refresh group list on other device

  // TODO 2
  //  Cascade remove user products when he leaves group

  // TODO 3
  //  Get user products count in group before adding one, to check if user exceeds users products limit

  // TODO 4
  //  Deal with reload when in group component
}
