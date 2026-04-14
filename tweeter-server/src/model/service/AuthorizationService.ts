import { DAOFactory } from "../../dataAccess/DAOFactory";

export class AuthorizationService {
  private authDao = DAOFactory.getInstance().getAuthDAO();

  /**
   * Validates the token and returns the associated alias.
   * Throws if the token is invalid or expired.
   */
  public async validateToken(token: string): Promise<string> {
    const alias = await this.authDao.getAlias(token);
    if (!alias) {
      throw new Error("Unauthorized");
    }
    return alias;
  }
}
