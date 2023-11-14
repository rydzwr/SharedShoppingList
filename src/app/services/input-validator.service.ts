import { Injectable } from '@angular/core';
import {Constants} from "../shared/constants";

@Injectable({
  providedIn: 'root'
})
export class InputValidatorService {

  constructor() { }

  isValidInput(input: string): boolean {
    if (!input || input.length === 0 || input.length > Constants.MAX_INPUT_LENGTH) {
      return false;
    }
    return !/[^a-zA-Z0-9\-_ ĄąĆćĘęŁłŃńÓóŚśŹźŻż]/.test(input);
  }
}
