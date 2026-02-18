import { Link } from "react-router-dom";
import { User } from "tweeter-shared";
import { useUserNavigation } from "../appNavbar/UserNavigationHooks";

interface Props {
  user: User;
  featurePath: string;
}

const UserItem = (props: Props) => {

  // const userNavigation = (event: React.MouseEvent) => {
  //   console.log("Feature path:", props.featurePath);
  //   return useUserNavigation(event, props.featurePath);
  // };

  // const userNavigation = (event: React.MouseEvent) => {
  //   return useUserNavigation();
  // };

  const userNavigation = useUserNavigation();

  return (
    <div className="col bg-light mx-0 px-0">
      <div className="container px-0">
        <div className="row mx-0 px-0">
          <div className="col-auto p-3">
            <img
              src={props.user.imageUrl}
              className="img-fluid"
              width="80"
              alt="Posting user"
            />
          </div>
          <div className="col">
            <h2>
              <b>
                {props.user.firstName} {props.user.lastName}
              </b>{" "}
              -{" "}
              <Link
                to={`${props.featurePath}/${props.user.alias}`}
                onClick={userNavigation}
              >
                {props.user.alias}
              </Link>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserItem;
