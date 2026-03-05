import "./Login.css";
import "bootstrap/dist/css/bootstrap.css";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthenticationFormLayout from "../AuthenticationFormLayout";
import { AuthToken, FakeData, User } from "tweeter-shared";
import AuthenticationFields from "../../authentication/AuthenticationFields";
import { useMessageActions } from "../../toaster/MessageHooks";
import { useUserInfoActions } from "../../userInfo/UserInfoHooks";
import { LoginPresenter } from "../../../presenter/LoginPresenter";

interface Props {
  originalUrl?: string;
}

const Login = (props: Props) => {
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { updateUserInfo } = useUserInfoActions();
  const { displayErrorMessage } = useMessageActions();

  const checkSubmitButtonStatus = (): boolean => {
    return !alias || !password;
  };

  const listener = {
    authenticated: (user: User, authToken: AuthToken) => {
      updateUserInfo(user, user, authToken, rememberMe);
    },
    navigate: (to: string) => {
      navigate(to);
    },
    displayErrorMessage: (message: string) => {
      displayErrorMessage(message);
    },
    // setLoadingState: (isLoading: boolean) => {
    //   setIsLoading(isLoading);
    // },
  };

  const presenterRef = useRef<LoginPresenter | null>(null)
  if (!presenterRef.current) {
    presenterRef.current = new LoginPresenter(listener);
  }

  const doLogin = async () => {
    await presenterRef.current?.doLogin(alias, password);
  };

  const inputFieldFactory = () => {
    return (
      <AuthenticationFields
        loginOrRegister={doLogin}
        featurePath="/login"
        alias={alias}
        password={password}
        setAlias={setAlias}
        setPassword={setPassword}
      />
    );
  };

  const switchAuthenticationMethodFactory = () => {
    return (
      <div className="mb-3">
        Not registered? <Link to="/register">Register</Link>
      </div>
    );
  };

  return (
    <AuthenticationFormLayout
      headingText="Please Sign In"
      submitButtonLabel="Sign in"
      oAuthHeading="Sign in with:"
      inputFieldFactory={inputFieldFactory}
      switchAuthenticationMethodFactory={switchAuthenticationMethodFactory}
      setRememberMe={setRememberMe}
      submitButtonDisabled={checkSubmitButtonStatus}
      isLoading={isLoading}
      submit={doLogin}
    />
  );
};

export default Login;
