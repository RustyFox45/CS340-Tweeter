import { TweeterRequest, TweeterResponse } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
export const handler = async (
  request: TweeterRequest,
): Promise<TweeterResponse> => {
  try {
    const userService = new UserService();
    await userService.logout(request.token);

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
