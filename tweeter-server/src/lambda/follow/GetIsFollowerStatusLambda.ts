import { GetIsFollowerRequest, GetIsFollowerResponse } from "tweeter-shared";
import { FollowService } from "../../model/service/FollowService";
export const handler = async (
  request: GetIsFollowerRequest,
): Promise<GetIsFollowerResponse> => {
  try {
    const followService = new FollowService();
    const isFollower = await followService.getIsFollowerStatus(
      request.token,
      request.userAlias,
      request.selectedUserAlias,
    );
    return {
      success: true,
      message: null,
      isFollowing: isFollower,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      isFollowing: false,
    };
  }
};
