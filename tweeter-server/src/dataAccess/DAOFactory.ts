import { UserDAO } from "./user/UserDAO";
import { AuthDAO } from "./auth/AuthDAO";
import { StoryDAO } from "./story/StoryDAO";
import { FollowDAO } from "./follows/FollowDAO";
import { FeedDAO } from "./feed/FeedDAO";
import { StorageDAO } from "./Storage/StorageDAO";

/**
 * Abstract factory for creating DAO instances.
 * Ensures services never directly instantiate DAOs, making it easy to swap implementations.
 */
export abstract class DAOFactory {
  abstract getUserDAO(): UserDAO;
  abstract getAuthDAO(): AuthDAO;
  abstract getStoryDAO(): StoryDAO;
  abstract getFollowDAO(): FollowDAO;
  abstract getFeedDAO(): FeedDAO;
  abstract getStorageDAO(): StorageDAO;

  private static instance: DAOFactory;

  /**
   * Get the singleton instance of the DAOFactory.
   * @returns The configured DAOFactory instance
   */
  public static getInstance(): DAOFactory {
    if (!DAOFactory.instance) {
      DAOFactory.instance = new DynamoDAOFactory();
    }
    return DAOFactory.instance;
  }

  /**
   * Set a custom DAOFactory instance (useful for testing).
   * @param factory The DAOFactory to use
   */
  public static setInstance(factory: DAOFactory): void {
    DAOFactory.instance = factory;
  }
}

import { DynamoUserDAO } from "./user/DynamoUserDAO";
import { DynamoAuthDAO } from "./auth/DynamoAuthDAO";
import { DynamoStoryDAO } from "./story/DynamoStoryDAO";
import { DynamoFollowDAO } from "./follows/DynamoFollowDAO";
import { DynamoFeedDAO } from "./feed/DynamoFeedDAO";
import { DynamoStorageDAO } from "./Storage/DynamoStorageDAO";

/**
 * Concrete factory implementation for DynamoDB DAOs.
 */
class DynamoDAOFactory extends DAOFactory {
  private userDAO: UserDAO;
  private authDAO: AuthDAO;
  private storyDAO: StoryDAO;
  private followDAO: FollowDAO;
  private feedDAO: FeedDAO;
  private storageDAO: StorageDAO;

  constructor() {
    super();
    this.userDAO = new DynamoUserDAO();
    this.authDAO = new DynamoAuthDAO();
    this.storyDAO = new DynamoStoryDAO();
    this.followDAO = new DynamoFollowDAO();
    this.feedDAO = new DynamoFeedDAO();
    this.storageDAO = new DynamoStorageDAO();
  }

  getUserDAO(): UserDAO {
    return this.userDAO;
  }

  getAuthDAO(): AuthDAO {
    return this.authDAO;
  }

  getStoryDAO(): StoryDAO {
    return this.storyDAO;
  }

  getFollowDAO(): FollowDAO {
    return this.followDAO;
  }

  getFeedDAO(): FeedDAO {
    return this.feedDAO;
  }

  getStorageDAO(): StorageDAO {
    return this.storageDAO;
  }
}
