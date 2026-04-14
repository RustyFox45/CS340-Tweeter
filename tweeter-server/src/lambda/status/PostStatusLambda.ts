import { PostStatusRequest, TweeterResponse } from "tweeter-shared";
import { StatusService } from "../../model/service/StatusService";
export const handler = async (
  request: PostStatusRequest,
): Promise<TweeterResponse> => {
  try {
    const statusService = new StatusService();
    await statusService.postStatus(request.token, request.status);

    return {
      success: true,
      message: null,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};
