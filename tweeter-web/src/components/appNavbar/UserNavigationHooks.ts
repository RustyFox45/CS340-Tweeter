import { useNavigate, useLocation } from "react-router-dom";
import { useMessageActions } from "../toaster/MessageHooks";
import { useUserInfo, useUserInfoActions } from "../userInfo/UserInfoHooks";
import {
  NavigationPresenter,
  NavigationView,
} from "../../presenter/NavigationPresenter";
import { useRef } from "react";

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

  const presenterRef = useRef<NavigationPresenter | null>(null);
  if (!presenterRef.current) {
    presenterRef.current = new NavigationPresenter(
      listener,
      navigate,
      location.pathname,
    );
  }

  const navigateToUser = async (event: React.MouseEvent): Promise<void> => {
    await presenterRef.current?.navigateToUser(
      authToken!,
      displayedUser!,
      event,
    );
  };

  return navigateToUser;
};
