import { PagedUserItemRequest, PagedUserItemResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
export const handler = async (
  request: PagedUserItemRequest,
): Promise<PagedUserItemResponse> => {
  try {
    const followService = new FollowService();
    const [items, hasMore] = await followService.loadMoreFollowers(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem,
    );
    return {
      success: true,
      message: null,
      items: items,
      hasMore: hasMore,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      items: [],
      hasMore: false,
    };
  }
};
