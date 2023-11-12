import { ErrorHandler, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GlobalErrorHandlerService implements ErrorHandler {
  private errorSubject = new BehaviorSubject<Error | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor() {
  }

  handleError(error: Error): void {
    this.errorSubject.next(error);
  }
}
