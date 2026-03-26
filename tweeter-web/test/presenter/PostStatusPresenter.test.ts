import {
  PostStatusPresenter,
  PostStatusView,
} from "../../src/presenter/PostStatusPresenter";
import {
  instance,
  mock,
  verify,
  spy,
  when,
  capture,
  anything,
} from "@typestrong/ts-mockito";
import { StatusService } from "../../src/model.service/StatusService";
import { AuthToken, User } from "tweeter-shared";

describe("PostStatusPresenter", () => {
  let mockPostStatusView: PostStatusView;
  let postStatusPresenter: PostStatusPresenter;
  let mockService: StatusService;

  const authToken = new AuthToken("abc123", Date.now());
  const currentUser = new User(
    "John",
    "Doe",
    "johndoe",
    "https://example.com/avatar.png",
  );
  const post = "This is a test post!";

  beforeEach(() => {
    mockPostStatusView = mock<PostStatusView>();
    const mockPostStatusViewInstance = instance(mockPostStatusView);
    when(mockPostStatusView.displayInfoMessage(anything(), anything())).thenReturn(
      "messageId123",
    );

    const postStatusPresenterSpy = spy(
      new PostStatusPresenter(mockPostStatusViewInstance),
    );
    postStatusPresenter = instance(postStatusPresenterSpy);

    mockService = mock<StatusService>();
    when(postStatusPresenterSpy.service).thenReturn(instance(mockService));
  });

  it("tells the view to display a posting status message", async () => {
    await postStatusPresenter.submitPost(authToken, post, currentUser);
    verify(
      mockPostStatusView.displayInfoMessage("Posting status...", 0),
    ).once();
  });

  it("calls postStatus on the post status service with the correct status and auth token", async () => {
    await postStatusPresenter.submitPost(authToken, post, currentUser);

    let [capturedAuthToken, capturedStatus] = capture(
      mockService.postStatus,
    ).last();
    expect(capturedAuthToken).toEqual(authToken);
    expect(capturedStatus.post).toEqual(post);
    expect(capturedStatus.user).toEqual(currentUser);
  });

  it("tells the view to clear the info message that was displayed previously, clear the post, and display a status posted message when successful", async () => {
    await postStatusPresenter.submitPost(authToken, post, currentUser);

    verify(mockPostStatusView.deleteMessage("messageId123")).once();
    verify(mockPostStatusView.setPost("")).once();
    verify(
      mockPostStatusView.displayInfoMessage("Status posted!", 2000),
    ).once();

    verify(mockPostStatusView.displayErrorMessage(anything())).never();
  });

  it("tells the view to clear the info message and display an error message but does not tell it to clear the post or display a status posted message when unsuccessful", async () => {
    when(mockService.postStatus(authToken, anything())).thenThrow(
      new Error("Post failed"),
    );

    await postStatusPresenter.submitPost(authToken, post, currentUser);

    verify(
      mockPostStatusView.displayErrorMessage(
        "Failed to post the status because of exception: Post failed",
      ),
    ).once();

    verify(mockPostStatusView.deleteMessage("messageId123")).once();
    verify(mockPostStatusView.setPost("")).never();
    verify(
      mockPostStatusView.displayInfoMessage("Status posted!", anything()),
    ).never();
  });
});
