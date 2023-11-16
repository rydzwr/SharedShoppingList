import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {LoginService} from "../services/login.service";
import {Constants} from "./constants";

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.currentLoggedUser) {
    return true;
  } else {
    router.navigate([Constants.LOGIN_ROUTE]);
    return false;
  }
};

