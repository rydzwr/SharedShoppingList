import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {catchError, of, tap} from 'rxjs';
import {LoginService} from "./login.service";
import {Constants} from "./constants";

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return loginService.isLoggedIn().pipe(
    tap(loggedIn =>
      !loggedIn && router.createUrlTree([Constants.LOGIN_ROUTE], {
        queryParams: {loggedOut: true, origUrl: state.url}
      })),
    catchError((err) => {
      router.navigate([Constants.LOGIN_ROUTE], {
        queryParams: {loggedOut: true, origUrl: state.url}
      });
      return of(false);
    })
  );
};
