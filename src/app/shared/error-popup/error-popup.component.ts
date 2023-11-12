import {Component, ErrorHandler} from '@angular/core';
import {GlobalErrorHandlerService} from "../../services/global-error-handler.service";

@Component({
  selector: 'app-error-popup',
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.scss']
})
export class ErrorPopupComponent {
  public errorVisible = false;

  public get myErrorHandler() {
    return this.errorHandler as GlobalErrorHandlerService;
  }

  constructor(public errorHandler: ErrorHandler) {
    this.myErrorHandler.error$.subscribe((error) => {
      if (error) {
        this.errorVisible = true;
        setTimeout(() => this.errorVisible = false, 2000);
      }
    });
  }
}
