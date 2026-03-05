import { AuthToken, User } from "tweeter-shared";
import { FollowService } from "../model.service/FollowService";
import { MessageView, Presenter } from "./Presenter";

export interface UserInfoView extends MessageView {
  setFollowerCount: (count: number) => void;
  setFolloweeCount: (count: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsFollower: (isFollower: boolean) => void;
}

export class UserInfoPresenter extends Presenter<UserInfoView> {
  private followService: FollowService;
  public constructor(view: UserInfoView) {
    super(view);
    this.followService = new FollowService();
  }

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User,
  ) {
    await this.doFailureReportingOperation(async () => {
      if (currentUser === displayedUser) {
        this.view.setIsFollower(false);
      } else {
        this.view.setIsFollower(
          await this.followService.getIsFollowerStatus(
            authToken!,
            currentUser!,
            displayedUser!,
          ),
        );
      }
    }, "determine follower status");
  }

  public async setNumbFollowees(authToken: AuthToken, displayedUser: User) {
    await this.doFailureReportingOperation(async () => {
      this.view.setFolloweeCount(
        await this.followService.getFolloweeCount(authToken, displayedUser),
      );
    }, "get followees count");
  }

  public async setNumbFollowers(authToken: AuthToken, displayedUser: User) {
    await this.doFailureReportingOperation(async () => {
      this.view.setFollowerCount(
        await this.followService.getFollowerCount(authToken, displayedUser),
      );
    }, "get followers count");
  }

  private async followOperation(
    authToken: AuthToken,
    user: User,
    isFollower: boolean,
    messagePrefix: string,
    operationDescription: string,
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      this.view.setIsLoading(true);
      this.view.displayInfoMessage(`${messagePrefix} ${user.name}...`, 2000);

      let [followerCount, followeeCount] = await this.followService.follow(
        authToken!,
        user!,
      );
      this.view.setIsFollower(isFollower);
      this.view.setFollowerCount(followerCount);
      this.view.setFolloweeCount(followeeCount);
    }, operationDescription);

    this.view.deleteMessage;
    this.view.setIsLoading(false);
  }

  public async followDisplayedUser(
    authToken: AuthToken,
    userToFollow: User,
  ): Promise<void> {
    await this.followOperation(
      authToken,
      userToFollow,
      true,
      "Following",
      "follow user",
    );
  }

  public async unfollowDisplayedUser(
    authToken: AuthToken,
    userToUnfollow: User,
  ): Promise<void> {
    await this.followOperation(
      authToken,
      userToUnfollow,
      false,
      "Unfollowing",
      "unfollow user",
    );
  }
}
