import { AuthDto, UserDto, AuthToken } from "tweeter-shared";
import { Service } from "./Service";
import * as bcrypt from "bcryptjs";
import { DAOFactory } from "../../dataAccess/DAOFactory";
import { AuthorizationService } from "./AuthorizationService";

export class UserService implements Service {
  private userDao = DAOFactory.getInstance().getUserDAO();
  private authDao = DAOFactory.getInstance().getAuthDAO();
  private storageDao = DAOFactory.getInstance().getStorageDAO();
  private authService = new AuthorizationService();

  public async logout(token: string): Promise<void> {
    await this.authDao.deleteAuth(token);
  }

  private async generateAuthResponse(
    alias: string,
  ): Promise<[UserDto, AuthDto]> {
    const user = await this.userDao.getUser(alias);
    if (!user) throw new Error("User not found");

    const authToken = AuthToken.Generate();
    await this.authDao.putAuth(alias, authToken.token);

    return [user, authToken.toDto()];
  }

  public async login(
    alias: string,
    password: string,
  ): Promise<[UserDto, AuthDto]> {
    const record = await this.userDao.getAliasAndPassword(alias);
    if (!record) {
      throw new Error("Invalid alias or password");
    }

    const valid = await bcrypt.compare(password, record.password);
    if (!valid) {
      throw new Error("Invalid alias or password");
    }

    return this.generateAuthResponse(alias);
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: string,
    imageFileExtension: string,
  ): Promise<[UserDto, AuthDto]> {
    const exists = await this.userDao.aliasExists(alias);
    if (exists) {
      throw new Error("Alias already in use");
    }

    // Upload image and get URL
    const imageUrl = await this.storageDao.putImage(
      `${alias}.${imageFileExtension}`,
      userImageBytes,
    );

    // putUser will hash password internally
    await this.userDao.putUser(firstName, lastName, alias, password, imageUrl);

    return this.generateAuthResponse(alias);
  }

  public async getUser(token: string, alias: string): Promise<UserDto | null> {
    await this.authService.validateToken(token);

    const user = await this.userDao.getUser(alias);
    return user || null;
  }
}
