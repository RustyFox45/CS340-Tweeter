import PostStatus from "../../../src/components/postStatus/PostStatus";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { instance, mock, verify } from "@typestrong/ts-mockito";
import { PostStatusPresenter } from "../../../src/presenter/PostStatusPresenter";
import { useUserInfo } from "../../../src/components/userInfo/UserInfoHooks";
import { AuthToken, User } from "tweeter-shared";

jest.mock("../../../src/components/userInfo/UserInfoHooks", () => ({
  ...jest.requireActual("../../../src/components/userInfo/UserInfoHooks"),
  __esModule: true,
  useUserInfo: jest.fn(),
}));

describe("PostStatus", () => {
  const mockUserInstance = new User(
    "John",
    "Doe",
    "johndoe",
    "https://example.com/avatar.png"
  );
  const mockAuthTokenInstance = new AuthToken("abc123", Date.now());

  beforeAll(() => {
    (useUserInfo as jest.Mock).mockReturnValue({
      currentUser: mockUserInstance,
      authToken: mockAuthTokenInstance,
    });
  });

  it("starts with the Post Status and Clear buttons disabled", () => {
    const { postStatusButton, clearButton } = renderPostStatusAndGetElements();
    expect(postStatusButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("enables both buttons when the text field has text", async () => {
    const { user, postStatusButton, clearButton, textarea } = renderPostStatusAndGetElements();

    await user.type(textarea, "This is a test post!");

    expect(postStatusButton).toBeEnabled();
    expect(clearButton).toBeEnabled();
  });

  it("disables both buttons when the text field is cleared", async () => {
    const { user, postStatusButton, clearButton, textarea } = renderPostStatusAndGetElements();

    await user.type(textarea, "This is a test post!");
    expect(postStatusButton).toBeEnabled();
    expect(clearButton).toBeEnabled();

    await user.clear(textarea);
    expect(postStatusButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it("calls the presenter's submitPost method with correct parameters when the Post Status button is pressed", async () => {
    const mockPresenter = mock<PostStatusPresenter>();
    const mockPresenterInstance = instance(mockPresenter);

    const testPost = "This is a test post!";

    const { user, postStatusButton, textarea } = renderPostStatusAndGetElements(
      mockPresenterInstance
    );

    await user.type(textarea, testPost);
    await user.click(postStatusButton);

    verify(
      mockPresenter.submitPost(mockAuthTokenInstance, testPost, mockUserInstance)
    ).once();
  });
});

function renderPostStatus(presenter?: PostStatusPresenter) {
  return render(<PostStatus presenter={presenter} />);
}

function renderPostStatusAndGetElements(presenter?: PostStatusPresenter) {
  const user = userEvent.setup();

  renderPostStatus(presenter);

  const postStatusButton = screen.getByRole("button", { name: /Post Status/i });
  const clearButton = screen.getByRole("button", { name: /Clear/i });
  const textarea = screen.getByPlaceholderText(/What's on your mind?/i);

  return { user, postStatusButton, clearButton, textarea };
}
