import {
  AuthenticatePresenter,
  AuthenticationView,
} from "./AuthenticatePresenter";

export class LoginPresenter extends AuthenticatePresenter<AuthenticationView> {
  public constructor(view: AuthenticationView) {
    super(view);
  }

  public async doLogin(alias: string, password: string, originalUrl?: string) {
    await this.doAuthenticationOperation(
      async () => this.userService.login(alias, password),
      (user) => originalUrl ? originalUrl : `/feed/${user.alias}`,
      "login user"
    );
  }
}
