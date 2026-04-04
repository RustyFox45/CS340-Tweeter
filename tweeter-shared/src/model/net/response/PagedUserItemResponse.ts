import { UserDto } from "../../dto/UserDto";
import { TweeterResponse } from "./TweeterResponse";

export interface PagedUserItemResponse extends TweeterResponse {
  readonly hasMore: boolean;
  readonly items: UserDto[] | null;
}
