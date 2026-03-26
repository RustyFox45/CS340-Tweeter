import { AuthToken } from "tweeter-shared";
import {
  LogoutView,
  LogoutPresenter,
} from "../../src/presenter/LogoutPresenter";
import {
  instance,
  mock,
  verify,
  spy,
  when,
  capture,
  anything,
} from "@typestrong/ts-mockito";
import { UserService } from "../../src/model.service/UserService";

describe("AppNavbarPresenter", () => {
  let mockAppNavbarPresenterView: LogoutView;
  let appNavbarPresenter: LogoutPresenter;
  let mockService: UserService;

  const authToken = new AuthToken("abc123", Date.now());

  beforeEach(() => {
    mockAppNavbarPresenterView = mock<LogoutView>();
    const mockAppNavbarPresenterViewInstance = instance(
      mockAppNavbarPresenterView,
    );
    when(
      mockAppNavbarPresenterView.displayInfoMessage(anything(), 0),
    ).thenReturn("messageId123");

    const appNavbarPresenterSpy = spy(
      new LogoutPresenter(mockAppNavbarPresenterViewInstance),
    );
    appNavbarPresenter = instance(appNavbarPresenterSpy);

    mockService = mock<UserService>();
    when(appNavbarPresenterSpy.service).thenReturn(instance(mockService));
  });

  it("tells the view to display a logging out message", async () => {
    await appNavbarPresenter.logout(authToken);
    verify(
      mockAppNavbarPresenterView.displayInfoMessage("Logging Out...", 0),
    ).once();
  });

  it("calls logout on the user service with the correct auth token", async () => {
    await appNavbarPresenter.logout(authToken);
    verify(mockService.logout(authToken)).once();

    // let [capturedAuthToken] = capture(mockService.logout).last();
    // expect(capturedAuthToken).toEqual(authToken);
  });

  it("tells the view to clear the info message that was displayed previously, clears the user info, and navigates to the login page when successful", async () => {
    await appNavbarPresenter.logout(authToken);

    verify(mockAppNavbarPresenterView.deleteMessage("messageId123")).once();
    verify(mockAppNavbarPresenterView.clearUserInfo()).once();
    verify(mockAppNavbarPresenterView.navigateToLogin()).once();

    verify(mockAppNavbarPresenterView.displayErrorMessage(anything())).never();
  });

  it("tells the view to display an error message and does not tell it to clear the info message, clear the user info or navigate to the login page when unsuccessful", async () => {
    when(mockService.logout(authToken)).thenThrow(new Error("Logout failed"));

    await appNavbarPresenter.logout(authToken);

    let [errorString] = capture(
      mockAppNavbarPresenterView.displayErrorMessage,
    ).last();
    console.log(errorString);

    verify(
      mockAppNavbarPresenterView.displayErrorMessage(
        "Failed to log user out because of exception: Logout failed",
      ),
    ).once();

    verify(mockAppNavbarPresenterView.deleteMessage(anything())).never();
    verify(mockAppNavbarPresenterView.clearUserInfo()).never();
    verify(mockAppNavbarPresenterView.navigateToLogin()).never();
  });
});
