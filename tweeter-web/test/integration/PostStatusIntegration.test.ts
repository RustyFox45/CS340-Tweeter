import "isomorphic-fetch";
import {
  PostStatusPresenter,
  PostStatusView,
} from "../../src/presenter/PostStatusPresenter";
import { instance, mock, verify, anything, when } from "@typestrong/ts-mockito";
import { StatusService } from "../../src/model.service/StatusService";
import { UserService } from "../../src/model.service/UserService";
import { AuthToken, Status, User } from "tweeter-shared";

describe("PostStatus Integration Test", () => {
  let authToken: AuthToken;
  let user: User;

  // Update these to match a registered user in your system
  const testAlias = "@daisy";
  const testPassword = "password";

  const userService = new UserService();
  const statusService = new StatusService();

  beforeAll(async () => {
    // Step 1: Login a user
    [user, authToken] = await userService.login(testAlias, testPassword);
  }, 15000);

  it("should post a status and verify it appears in the user's story", async () => {
    // Set up mock view
    const mockView = mock<PostStatusView>();
    when(mockView.displayInfoMessage(anything(), anything())).thenReturn(
      "infoId",
    );
    const viewInstance = instance(mockView);

    const presenter = new PostStatusPresenter(viewInstance);

    const testPost = `Integration test post ${Date.now()}`;

    // Step 2: Post a status using the Presenter
    await presenter.submitPost(authToken, testPost, user);

    // Step 3: Verify that "Status posted!" message was displayed to the user
    verify(mockView.displayInfoMessage("Status posted!", 2000)).once();

    // Step 4: Retrieve the user's story and verify the new status was appended
    const [statuses, hasMore] = await statusService.loadMoreStoryItems(
      authToken,
      user.alias,
      10,
      null,
    );

    const postedStatus = statuses.find((s) => s.post === testPost);
    expect(postedStatus).toBeDefined();
    expect(postedStatus!.user.alias).toBe(user.alias);
    expect(postedStatus!.post).toBe(testPost);
  }, 30000);

  afterAll(async () => {
    await userService.logout(authToken);
  });
});
