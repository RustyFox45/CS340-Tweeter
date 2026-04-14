import { UserDto } from "tweeter-shared";
import { Service } from "./Service";
import { DAOFactory } from "../../dataAccess/DAOFactory";
import { AuthorizationService } from "./AuthorizationService";

export class FollowService implements Service {
  private followDao = DAOFactory.getInstance().getFollowDAO();
  private userDao = DAOFactory.getInstance().getUserDAO();
  private feedDao = DAOFactory.getInstance().getFeedDAO();
  private authService = new AuthorizationService();

  private async loadMoreFollows(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
    getPage: (
      alias: string,
      pageSize: number,
      lastAlias: string | null,
    ) => Promise<[string[], boolean]>,
  ): Promise<[UserDto[], boolean]> {
    await this.authService.validateToken(token);
    const lastAlias = lastItem ? lastItem.alias : null;
    const [aliases, hasMore] = await getPage(userAlias, pageSize, lastAlias);
    const users = await this.userDao.batchGetUser(aliases);
    return [users, hasMore];
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    return this.loadMoreFollows(
      token,
      userAlias,
      pageSize,
      lastItem,
      (alias, ps, la) => this.followDao.getPageOfFollowers(alias, ps, la),
    );
  }

  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null,
  ): Promise<[UserDto[], boolean]> {
    return this.loadMoreFollows(
      token,
      userAlias,
      pageSize,
      lastItem,
      (alias, ps, la) => this.followDao.getPageOfFollowees(alias, ps, la),
    );
  }

  public async getIsFollowerStatus(
    token: string,
    userAlias: string,
    selectedUserAlias: string,
  ): Promise<boolean> {
    await this.authService.validateToken(token);

    const result = await this.followDao.getFollow(userAlias, selectedUserAlias);
    return result !== null;
  }

  public async getFolloweeCount(
    token: string,
    userAlias: string,
  ): Promise<number> {
    await this.authService.validateToken(token);
    return await this.userDao.getNumFollowees(userAlias);
  }

  public async getFollowerCount(
    token: string,
    userAlias: string,
  ): Promise<number> {
    await this.authService.validateToken(token);
    return await this.userDao.getNumFollowers(userAlias);
  }

  private async updateFollowStatus(
    token: string,
    targetAlias: string,
    updateFollow: (currentUser: string, target: string) => Promise<void>,
    updateFolloweeCount: (alias: string) => Promise<void>,
    updateFollowerCount: (alias: string) => Promise<void>,
    afterUpdate?: (currentUser: string, target: string) => Promise<void>,
  ): Promise<[followerCount: number, followeeCount: number]> {
    const currentUser = await this.authService.validateToken(token);

    await updateFollow(currentUser, targetAlias);
    await updateFolloweeCount(currentUser);
    await updateFollowerCount(targetAlias);
    if (afterUpdate) await afterUpdate(currentUser, targetAlias);

    const followerCount = await this.userDao.getNumFollowers(targetAlias);
    const followeeCount = await this.userDao.getNumFollowees(currentUser);
    return [followerCount, followeeCount];
  }

  public async follow(
    token: string,
    userAliasToFollow: string,
  ): Promise<[followerCount: number, followeeCount: number]> {
    return this.updateFollowStatus(
      token,
      userAliasToFollow,
      (cur, target) => this.followDao.putFollow(cur, target),
      (alias) => this.userDao.incrementNumFollowees(alias),
      (alias) => this.userDao.incrementNumFollowers(alias),
    );
  }

  public async unfollow(
    token: string,
    userAliasToUnfollow: string,
  ): Promise<[followerCount: number, followeeCount: number]> {
    return this.updateFollowStatus(
      token,
      userAliasToUnfollow,
      (cur, target) => this.followDao.deleteFollow(cur, target),
      (alias) => this.userDao.decrementNumFollowees(alias),
      (alias) => this.userDao.decrementNumFollowers(alias),
      (cur, target) => this.feedDao.deleteFromFeed(cur, target),
    );
  }
}
