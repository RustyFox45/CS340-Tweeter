import { Status, StatusDto, User } from "tweeter-shared";
import { Post } from "../../dataAccess/Post";
import { Service } from "./Service";
import { DAOFactory } from "../../dataAccess/DAOFactory";
import { AuthorizationService } from "./AuthorizationService";

export class StatusService implements Service {
  private storyDao = DAOFactory.getInstance().getStoryDAO();
  private feedDao = DAOFactory.getInstance().getFeedDAO();
  private userDao = DAOFactory.getInstance().getUserDAO();
  private followDao = DAOFactory.getInstance().getFollowDAO();
  private authService = new AuthorizationService();

  private async loadMoreItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
    getPage: (
      alias: string,
      pageSize: number,
      lastItem?: StatusDto,
    ) => Promise<[Post[], boolean]>,
  ): Promise<[StatusDto[], boolean]> {
    await this.authService.validateToken(token);

    const [posts, hasMore] = await getPage(
      userAlias,
      pageSize,
      lastItem ?? undefined,
    );

    const ownerAliases = Array.from(new Set(posts.map((p) => p.ownerAlias)));
    const owners = await this.userDao.batchGetUser(ownerAliases);
    const ownerMap: { [alias: string]: User } = {};
    for (const o of owners) {
      ownerMap[o.alias] = new User(
        o.firstName,
        o.lastName,
        o.alias,
        o.imageUrl,
      );
    }

    const statuses: StatusDto[] = [];
    for (const p of posts) {
      const user = ownerMap[p.ownerAlias];
      if (!user) continue;
      statuses.push(new Status(p.post, user, p.timestamp).dto);
    }

    return [statuses, hasMore];
  }

  public async loadMoreStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    return this.loadMoreItems(
      token,
      userAlias,
      pageSize,
      lastItem,
      (alias, ps, li) => this.storyDao.getPageOfStoryItems(alias, ps, li),
    );
  }

  public async loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null,
  ): Promise<[StatusDto[], boolean]> {
    return this.loadMoreItems(
      token,
      userAlias,
      pageSize,
      lastItem,
      (alias, ps, li) => this.feedDao.getPageOfFeedItems(alias, ps, li),
    );
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    const posterAlias = await this.authService.validateToken(token);

    if (posterAlias !== newStatus.user.alias) {
      throw new Error("Token does not match posting user");
    }

    // add to story
    await this.storyDao.putStatus(newStatus);

    // add to followers' feeds
    const followers = await this.followDao.getAllFollowers(
      newStatus.user.alias,
    );

    const user = User.fromDto(newStatus.user)!;
    const statusObj = new Status(newStatus.post, user, newStatus.timestamp);
    await this.feedDao.uploadToFollowerFeeds(
      newStatus.user.alias,
      followers,
      statusObj,
    );
  }
}
