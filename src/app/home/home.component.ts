import {Component} from '@angular/core';
import {GroupService} from '../services/group.service';
import {Group} from '../shared/interfaces/group';
import {LoginService} from '../services/login.service';
import {Router} from '@angular/router';
import {InputValidatorService} from "../services/input-validator.service";
import {Constants} from "../shared/constants";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  showForm: string;
  newGroupName: string = '';
  inviteCode: string = '';

  constructor(
    public groupService: GroupService,
    private loginService: LoginService,
    private validator: InputValidatorService,
    private router: Router
  ) {
    this.showForm = 'NO';
    this.loginService.currentUser$.subscribe(user => {
      this.groupService.fetchUserGroups(user?.uid!);
    })
  }

  selectGroup(group: Group) {
    this.groupService.selectGroup(group);
    this.router.navigate([Constants.GROUP_ROUTE]);
  }

  joinGroup(groupName: string, inviteCode: string): void {
    if (!this.validator.isValidInput(groupName) || !this.validator.isValidInput(inviteCode)) {
      throw new Error("Invalid Input Data");
    }

    this.showForm = 'NO';
    this.loginService.currentUser$.subscribe(user => {
        if (user) {
          this.groupService.joinGroup(groupName, inviteCode, user.uid!);
        } else {
          console.error('Current user ID is undefined.');
          throw new Error("Current user ID is undefined");
        }
      }
    );
  }

  createNewGroup(name: string) {
    if (!this.validator.isValidInput(name)) {
      throw new Error("Invalid Input Data");
    }

    this.showForm = 'NO';
    this.loginService.currentUser$.subscribe(user => {
      this.groupService.createNewGroup(name, user?.uid!);
    });
  }
}
