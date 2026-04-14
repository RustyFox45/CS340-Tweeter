import { GetBothCountResponse, TweeterRequest } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
export const handler = async (
  request: TweeterRequest,
): Promise<GetBothCountResponse> => {
  try {
    const followService = new FollowService();
    const [followerCount, followeeCount] = await followService.unfollow(
      request.token,
      request.userAlias,
    );
    return {
      success: true,
      message: null,
      followerCount: followerCount,
      followeeCount: followeeCount,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      followerCount: 0,
      followeeCount: 0,
    };
  }
};
