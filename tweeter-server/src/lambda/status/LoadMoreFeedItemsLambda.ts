import { LoadMoreItemsRequest, LoadMoreItemsResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
export const handler = async (
  request: LoadMoreItemsRequest,
): Promise<LoadMoreItemsResponse> => {
  try {
    const statusService = new StatusService();
    const [statuses, hasMorePages] = await statusService.loadMoreFeedItems(
      request.token,
      request.userAlias,
      request.pageSize,
      request.lastItem,
    );

    return {
      success: true,
      message: null,
      statuses: statuses,
      hasMorePages: hasMorePages,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      statuses: [],
      hasMorePages: false,
    };
  }
};
