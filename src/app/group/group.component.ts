import {Component} from '@angular/core';
import {GroupService} from "../services/group.service";

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent {

  visibleProductsMap = new Map<string, boolean>();

  showInviteModal = false;
  showProductForm = false;
  showModal = false;

  constructor(public groupService: GroupService) {
  }

  toggleProductsVisibility(userId: string) {
    const isCurrentlyVisible = this.visibleProductsMap.get(userId) || false;
    this.visibleProductsMap.set(userId, !isCurrentlyVisible);
  }
}
