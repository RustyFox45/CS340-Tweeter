import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model.service/StatusService";
import { MessageView, Presenter } from "./Presenter";

export interface PostStatusView extends MessageView {
  setIsLoading: (isLoading: boolean) => void;
  setPost: (post: string) => void;
}

export class PostStatusPresenter extends Presenter<PostStatusView> {
  private statusService: StatusService;
  private lastInfoMessageId: string | null = null;

  public constructor(view: PostStatusView) {
    super(view);
    this.statusService = new StatusService();
  }

  public get service() {
    return this.statusService;
  }

  public async submitPost(
    authToken: AuthToken,
    post: string,
    currentUser: User,
  ) {
    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);
      this.lastInfoMessageId = this.view.displayInfoMessage(
        "Posting status...",
        0,
      );

      const status = new Status(post, currentUser!, Date.now());

      await this.service.postStatus(authToken!, status);

      this.view.setPost("");
      this.view.displayInfoMessage("Status posted!", 2000);
    }, "post the status");

    if (this.lastInfoMessageId) {
      this.view.deleteMessage(this.lastInfoMessageId);
    }
    this.view.setIsLoading(false);
  }
}
