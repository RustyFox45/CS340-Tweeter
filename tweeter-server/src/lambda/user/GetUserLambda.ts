import { GetUserResponse, TweeterRequest, UserDto } from "tweeter-shared";
import { UserService } from "../../model/service/UserService";
export const handler = async (
  request: TweeterRequest,
): Promise<GetUserResponse> => {
  try {
    const userService = new UserService();
    const userDto: UserDto | null = await userService.getUser(
      request.token,
      request.userAlias,
    );
    if (userDto) {
      return {
        success: true,
        message: "User retrieved successfully",
        user: userDto,
      };
    } else {
      return {
        success: false,
        message: "User not found",
        user: null,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: (error as Error).message,
      user: null,
    };
  }
};
