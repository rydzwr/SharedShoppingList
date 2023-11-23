import {Component, OnDestroy} from '@angular/core';
import {GroupService} from '../services/group.service';
import {LoginService} from '../services/login.service';
import {catchError, exhaustMap, filter, Subject, takeUntil, tap} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {

  public createGroupSubject = new Subject<string>();
  public joinGroupSubject = new Subject<void>();

  destroy$ = new Subject<void>();

  inviteCode: string = '';
  groupName: string = '';
  showForm: string;

  constructor(
    public groupService: GroupService,
    private loginService: LoginService,
  ) {
    console.log("HomeComponent");

    this.createGroupEffect$.subscribe();
    this.joinGroupEffect$.subscribe();

    this.showForm = 'NO';
    this.groupService.loggedUserGroupsSubject.next(loginService.currentLoggedUser!);
  }

  createGroupEffect$ = this.createGroupSubject.asObservable().pipe(
    filter(name => !!name && name.length > 0),
    takeUntil(this.destroy$),
    exhaustMap((name) =>
      fromPromise(this.groupService.createNewGroup(name, this.loginService.currentLoggedUser?.uid!))
    ),
    tap((newGroup) => {
      this.resetFormAndHide();
      this.groupService.selectedGroupSubject.next(newGroup);
    }),
    catchError((e: Error) => {
      throw new Error(e.message);
    })
  );

  joinGroupEffect$ = this.joinGroupSubject.asObservable().pipe(
    filter(() => !!this.groupName && this.groupName.trim().length > 0),
    filter(() => !!this.inviteCode && this.inviteCode.trim().length > 0),
    takeUntil(this.destroy$),
    exhaustMap(() =>
      fromPromise(this.groupService.joinGroup(this.groupName, this.inviteCode))
    ),
    tap((newGroup) => {
      this.resetFormAndHide();
      this.groupService.selectedGroupSubject.next(newGroup);
    }),
    catchError((e: Error) => {
      throw new Error(e.message);
    })
  );

  joinGroup(groupName: string, inviteCode: string): void {
    this.showForm = 'NO';
    this.groupName = groupName;
    this.inviteCode = inviteCode;
    this.joinGroupSubject.next();
  }

  resetFormAndHide() {
    this.groupName = '';
    this.inviteCode = '';
    this.showForm = 'NO';
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
