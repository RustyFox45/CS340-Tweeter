import { useNavigate, useLocation } from "react-router-dom";
import { useMessageActions } from "../toaster/MessageHooks";
import { useUserInfo, useUserInfoActions } from "../userInfo/UserInfoHooks";
import {
  NavigationPresenter,
  NavigationView,
} from "../../presenter/NavigationPresenter";

export const useUserNavigation = () => {
  const { displayErrorMessage } = useMessageActions();
  const { displayedUser, authToken } = useUserInfo();
  const { setDisplayedUser } = useUserInfoActions();
  const navigate = useNavigate();
  const location = useLocation();

  const listener: NavigationView = {
    displayErrorMessage: displayErrorMessage,
    setDisplayedUser: setDisplayedUser,
  };

  const presenter = new NavigationPresenter(
    listener,
    navigate,
    location.pathname,
  );

  const navigateToUser = async (event: React.MouseEvent): Promise<void> => {
    await presenter.navigateToUser(authToken!, displayedUser!, event);
  };

  return navigateToUser;
};
