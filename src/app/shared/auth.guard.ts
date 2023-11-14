import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import {catchError, map, of} from 'rxjs';
import { LoginService } from "../services/login.service";
import {Constants} from "./constants";

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return loginService.currentUser$.pipe(
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate([Constants.LOGIN_ROUTE]);
        return false;
      }
    }),
    catchError(() => {
      router.navigate([Constants.LOGIN_ROUTE]);
      return of(false);
    })
  );
};

