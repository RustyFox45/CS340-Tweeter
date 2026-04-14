import React from "react";
import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { Presenter, View } from "./Presenter";

export interface NavigationView extends View {
  setDisplayedUser: (user: User) => void;
}

export class NavigationPresenter extends Presenter<NavigationView> {
  private userService: UserService;
  private navigate: (path: string) => void;
  private currentPath: string;

  public constructor(
    view: NavigationView,
    navigate: (path: string) => void,
    currentPath: string,
  ) {
    super(view);
    this.userService = new UserService();
    this.navigate = navigate;
    this.currentPath = currentPath;
  }

  public setCurrentPath(path: string) {
    this.currentPath = path;
  }

  public async navigateToUser(
    authToken: AuthToken,
    currentUser: User,
    event: React.MouseEvent,
  ) {
    event.preventDefault();

    await this.doFailureReportingOperation(async () => {
      const alias = this.extractAlias(event.target.toString());

      const user = await this.userService.getUser(authToken!, alias);

      if (!!user) {
        if (currentUser!.equals(user)) {
          this.view.setDisplayedUser(currentUser!);
        } else {
          this.view.setDisplayedUser(user);
        }
        // Navigate to the new URL with the same feature path but new user alias
        const pathPrefix = this.currentPath.split("/")[1];
        this.navigate(`/${pathPrefix}/${user.alias}`);
      }
    }, "get user");
  }

  public extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  }
}
