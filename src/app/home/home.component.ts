import {Component, OnInit} from '@angular/core';
import {GroupService} from '../services/group.service';
import {Group} from '../shared/interfaces/group';
import {LoginService} from '../services/login.service';
import {Router} from '@angular/router';
import {User} from '../shared/interfaces/user';
import {InputValidatorService} from "../services/input-validator.service";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  showForm: string;
  newGroupName: string = '';
  inviteCode: string = '';

  private currentUser: User | null = null;

  constructor(
    public groupService: GroupService,
    private loginService: LoginService,
    private validator: InputValidatorService,
    private router: Router
  ) {
    this.showForm = 'NO';
    this.loginService.currentUser$.subscribe((user) => {
      if (user && user.uid) {
        this.currentUser = user;
        this.groupService.fetchUserGroups(user.uid);
      } else {
        throw new Error('No User UID Data!');
      }
    });
  }

  selectGroup(group: Group) {
    this.groupService.selectGroup(group);
    this.router.navigate(['/group', group.uid]);
  }

  joinGroup(groupName: string, inviteCode: string): void {
    if (!this.validator.isValidInput(groupName) || !this.validator.isValidInput(inviteCode)) {
      throw new Error("Invalid Input Data");
    }

    this.showForm = 'NO';
    const userId = this.currentUser?.uid;
    if (userId) {
      this.groupService.joinGroup(groupName, inviteCode, userId);
    } else {
      console.error('Current user ID is undefined.');
      throw new Error("Current user ID is undefined");
    }
  }


  createNewGroup(name: string) {
    if (!this.validator.isValidInput(name)) {
      throw new Error("Invalid Input Data");
    }

    this.showForm = 'NO';
    this.groupService.createNewGroup(name, this.currentUser?.uid!);
  }

}
