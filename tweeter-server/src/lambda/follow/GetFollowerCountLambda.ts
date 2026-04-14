import { GetFollowerCountResponse, TweeterRequest } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
export const handler = async (
  request: TweeterRequest,
): Promise<GetFollowerCountResponse> => {
  try {
    const followService = new FollowService();
    const count = await followService.getFollowerCount(
      request.token,
      request.userAlias,
    );
    return {
      success: true,
      message: null,
      count: count,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      count: 0,
    };
  }
};
