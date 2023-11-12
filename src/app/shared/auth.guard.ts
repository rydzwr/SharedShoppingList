import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { LoginService } from "../services/login.service";
import { Constants } from "./constants";

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return loginService.isLoggedIn().pipe(
    tap(loggedIn => console.log('AuthGuard: isLoggedIn', loggedIn)), // Log the login status
    map(loggedIn => {
      if (!loggedIn) {
        console.log('AuthGuard: Not logged in, redirecting to login page'); // Log redirection
        return router.createUrlTree([Constants.LOGIN_ROUTE], {
          queryParams: {loggedOut: true, origUrl: state.url}
        });
      }
      return true; // If logged in, return true to activate the route
    }),
    catchError((err) => {
      console.error('AuthGuard: Error in authentication check', err); // Log the error
      router.navigate([Constants.LOGIN_ROUTE], {
        queryParams: {loggedOut: true, origUrl: state.url}
      });
      return of(false);
    })
  ) as Observable<boolean | UrlTree>;
};
