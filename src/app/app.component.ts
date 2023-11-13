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
}
