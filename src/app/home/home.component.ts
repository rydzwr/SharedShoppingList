import {Component, OnInit} from '@angular/core';
import {GroupService} from '../services/group.service';
import {Group} from '../shared/interfaces/group';
import {LoginService} from '../services/login.service';
import {Router} from '@angular/router';
import {User} from '../shared/interfaces/user';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  showForm: string = 'NO';
  newGroupName: string = '';

  private currentUser: User | null = null;

  constructor(
    public groupService: GroupService,
    private loginService: LoginService,
    private router: Router
  ) {
  }

  // TODO
  //  ask before leaving group
  //  login component CSS
  //  group invitations

  ngOnInit() {
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

  joinGroup() {

  }

  createNewGroup(name: string) {
    this.showForm = 'NO';
    this.groupService.createNewGroup(name, this.currentUser?.uid!);
  }

}
