import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import {catchError, elementAt, map, Observable, of, tap} from 'rxjs';
import { LoginService } from "../services/login.service";
import { Constants } from "./constants";

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return loginService.isLoggedIn().pipe(
    map(isLoggedIn => {
      if (!isLoggedIn) {
        router.navigate([Constants.LOGIN_ROUTE]);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate([Constants.LOGIN_ROUTE]);
      return of(false);
    })
  );
};

