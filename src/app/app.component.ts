import {Component} from '@angular/core';
import {initFlowbite} from "flowbite";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    constructor() {
        initFlowbite();
    }

    // TODO 1
    //  Reactive update group users,
    //  because now, when other user leaves group it doesn't refresh group list on other device

    // TODO 2
    //  Cascade remove user products when he leaves group

    // TODO 3
    //  Get user products count in group before adding one, to check if user exceeds users products limit

    // TODO 4
    //  Write constrains on db

    // TODO 5
    //  Fix overflow on phone, and generally CSS on mobile

    // TODO 6
    //  Use onSnapshot() rather than get() to receive streams from db

    // TODO 7
    //  Unsubscribe from db in onDestroy()

    // TODO 8
    //  Write better queries using indexes

    // TODO 9
    //  Change name logic

    // TODO 10
    //  Allow only one product with same name assigned to user in group

    // TODO 11
    //  Implement request blocker for multiple clicks

    // TODO 12
    //  Add loading circle on group component when fetching group users

    // TODO 13
    //  Fetch user's products async when dropdown products list triggered

    // TODO 14
    //  Implement loading circle globally

    // TODO 15
    //  Clear app input boxes, after back button

    // TODO 16
    //  Wait for firebase, before adding new created group to subject!!
}
