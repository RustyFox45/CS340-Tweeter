import { DAO } from "../DAO";
import { FollowDAO } from "./FollowDAO";
import {
  PutCommand,
  DeleteCommand,
  QueryCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.FOLLOWERS_TABLE_NAME || "tweeter-followers";

export class DynamoFollowDAO extends DAO implements FollowDAO {
  async putFollow(followerAlias: string, followeeAlias: string): Promise<void> {
    // Single row: userAlias = followee, followerAlias = follower
    // "followerAlias follows userAlias"
    // Query main table by userAlias to get followers
    // Query GSI (followerAlias-index) by followerAlias to get followees
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userAlias: followeeAlias,
        followerAlias: followerAlias,
        createdAt: Date.now(),
      },
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to add follow relationship: `,
    );
  }

  async deleteFollow(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        userAlias: followeeAlias,
        followerAlias: followerAlias,
      },
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to remove follow relationship: `,
    );
  }

  async getFollow(
    followerAlias: string,
    followeeAlias: string,
  ): Promise<{ follower: string; followee: string } | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        userAlias: followeeAlias,
        followerAlias: followerAlias,
      },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get follow relationship: `,
    );

    if (!result.Item) {
      return null;
    }

    return {
      follower: result.Item.followerAlias,
      followee: result.Item.userAlias,
    };
  }

  async getPageOfFollowees(
    alias: string,
    pageSize: number,
    lastAlias: string | null,
  ): Promise<[string[], boolean]> {
    const params: any = {
      TableName: TABLE_NAME,
      IndexName: "followerAlias-index",
      KeyConditionExpression: "followerAlias = :followerAlias",
      ExpressionAttributeValues: {
        ":followerAlias": alias,
      },
      Limit: pageSize,
    };

    if (lastAlias) {
      params.ExclusiveStartKey = {
        followerAlias: alias,
        userAlias: lastAlias,
      };
    }

    const command = new QueryCommand(params);

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get followees for ${alias}: `,
    );

    const followees: string[] = result.Items
      ? result.Items.map((item) => item.userAlias)
      : [];

    const hasMore = !!result.LastEvaluatedKey;

    return [followees, hasMore];
  }

  async getPageOfFollowers(
    alias: string,
    pageSize: number,
    lastAlias: string | null,
  ): Promise<[string[], boolean]> {
    const params: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "userAlias = :userAlias",
      ExpressionAttributeValues: {
        ":userAlias": alias,
      },
      Limit: pageSize,
    };

    if (lastAlias) {
      params.ExclusiveStartKey = {
        userAlias: alias,
        followerAlias: lastAlias,
      };
    }

    const command = new QueryCommand(params);

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get followers for ${alias}: `,
    );

    const followers: string[] = result.Items
      ? result.Items.map((item) => item.followerAlias)
      : [];

    const hasMore = !!result.LastEvaluatedKey;

    return [followers, hasMore];
  }

  async getAllFollowers(alias: string): Promise<string[]> {
    const allFollowers: string[] = [];
    let lastEvaluatedKey: any = undefined;

    while (true) {
      const params: any = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userAlias = :userAlias",
        ExpressionAttributeValues: {
          ":userAlias": alias,
        },
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new QueryCommand(params);

      const result = await this.tryRequest(
        () => this.getClient().send(command),
        `Failed to get all followers for ${alias}: `,
      );

      if (result.Items) {
        allFollowers.push(...result.Items.map((item) => item.followerAlias));
      }

      if (!result.LastEvaluatedKey) {
        break;
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
    }

    return allFollowers;
  }
}
