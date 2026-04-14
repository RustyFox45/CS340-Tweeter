import { StatusDto, Status } from "tweeter-shared";
import { Post } from "../Post";
import { DAO } from "../DAO";
import { FeedDAO } from "./FeedDAO";
import {
  QueryCommand,
  BatchWriteCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.FEED_TABLE_NAME || "tweeter-feed";

export class DynamoFeedDAO extends DAO implements FeedDAO {
  async getPageOfFeedItems(
    alias: string,
    pageSize: number,
    lastItem?: StatusDto,
  ): Promise<[Post[], boolean]> {
    const params: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "userAlias = :userAlias",
      ExpressionAttributeValues: {
        ":userAlias": alias,
      },
      Limit: pageSize,
      ScanIndexForward: false, // Get most recent first
    };

    if (lastItem) {
      params.ExclusiveStartKey = {
        userAlias: alias,
        timestamp: lastItem.timestamp,
      };
    }

    const command = new QueryCommand(params);

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get feed items for ${alias}: `,
    );

    const posts: Post[] = result.Items
      ? result.Items.map((item) => ({
          ownerAlias: item.ownerAlias,
          timestamp: item.timestamp,
          post: item.post,
          followerAlias: null,
        }))
      : [];

    const hasMore = !!result.LastEvaluatedKey;

    return [posts, hasMore];
  }

  async uploadToFollowerFeeds(
    alias: string,
    followerAliases: string[],
    status: Status,
  ): Promise<void> {
    if (followerAliases.length === 0) {
      return;
    }

    // BatchWriteItem can handle up to 25 items per request
    const chunks = [];
    for (let i = 0; i < followerAliases.length; i += 25) {
      chunks.push(followerAliases.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const requestItems = chunk.map((userAlias) => ({
        PutRequest: {
          Item: {
            userAlias: userAlias,
            timestamp: status.timestamp,
            ownerAlias: alias,
            post: status.post,
            createdAt: Date.now(),
          },
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requestItems,
        },
      });

      await this.tryRequest(
        () => this.getClient().send(command),
        `Failed to add post to follower feeds: `,
      );
    }
  }

  async deleteFromFeed(
    userAlias: string,
    unfollowedAlias: string,
  ): Promise<void> {
    // Query all feed items from the unfollowed user
    let lastEvaluatedKey: any = undefined;

    while (true) {
      const params: any = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "userAlias = :userAlias",
        FilterExpression: "ownerAlias = :ownerAlias",
        ExpressionAttributeValues: {
          ":userAlias": userAlias,
          ":ownerAlias": unfollowedAlias,
        },
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const queryCommand = new QueryCommand(params);
      const result = await this.tryRequest(
        () => this.getClient().send(queryCommand),
        `Failed to query feed items for deletion: `,
      );

      if (result.Items) {
        for (const item of result.Items) {
          const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              userAlias: item.userAlias,
              timestamp: item.timestamp,
            },
          });
          await this.tryRequest(
            () => this.getClient().send(deleteCommand),
            `Failed to delete feed item: `,
          );
        }
      }

      if (!result.LastEvaluatedKey) break;
      lastEvaluatedKey = result.LastEvaluatedKey;
    }
  }
}
