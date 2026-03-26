import { AuthToken } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { MessageView, Presenter } from "./Presenter";

export interface LogoutView extends MessageView {
  clearUserInfo: () => void;
  navigateToLogin: () => void;
}

export class LogoutPresenter extends Presenter<LogoutView> {
  private _service: UserService;

  public constructor(view: LogoutView) {
    super(view);
    this._service = new UserService();
  }

  public get service() {
    return this._service;
  }

  public async logout(authToken: AuthToken) {
    const messageId = this.view.displayInfoMessage("Logging Out...", 0);
    await this.doFailureReportingOperation(async () => {
      await this.service.logout(authToken!);

      this.view.deleteMessage(messageId);
      this.view.clearUserInfo();
      this.view.navigateToLogin();
    }, "log user out");
  }
}
