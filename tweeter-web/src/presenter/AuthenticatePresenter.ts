import { UserService } from "../model.service/UserService";
import { AuthToken, User } from "tweeter-shared";
import { Presenter, View } from "./Presenter";

export interface AuthenticationView extends View {
  authenticated: (user: User, authToken: AuthToken) => void;
  navigate: (to: string) => void;
}

export abstract class AuthenticatePresenter<
  V extends AuthenticationView,
> extends Presenter<V> {
  protected userService: UserService;

  constructor(view: V) {
    super(view);
    this.userService = new UserService();
  }

  protected authenticated(user: User, authToken: AuthToken) {
    this.view.authenticated(user, authToken);
  }

  protected displayErrorMessage(message: string) {
    this.view.displayErrorMessage(message);
  }

  protected async doAuthenticationOperation(
    authenticationOperation: () => Promise<[User, AuthToken]>,
    navigationPath: (user: User) => string,
    operationDescription: string,
  ) {
    try {
      const [user, authToken] = await authenticationOperation();
      this.authenticated(user, authToken);
      this.view.navigate(navigationPath(user));
    } catch (error) {
      this.displayErrorMessage(
        `Failed to ${operationDescription} because of exception: ${error}`,
      );
    }
  }
}
