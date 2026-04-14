import { StatusDto } from "tweeter-shared";
import { Post } from "../Post";
import { DAO } from "../DAO";
import { StoryDAO } from "./StoryDAO";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { BadRequest } from "../../Error/BadRequest";

const TABLE_NAME = process.env.STORY_TABLE_NAME || "tweeter-story";

export class DynamoStoryDAO extends DAO implements StoryDAO {
  async getPageOfStoryItems(
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
      ScanIndexForward: false,
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
      `Failed to get story items for ${alias}: `,
    );

    const posts: Post[] = result.Items
      ? result.Items.map((item) => ({
          ownerAlias: item.userAlias,
          timestamp: item.timestamp,
          post: item.post,
          followerAlias: null,
        }))
      : [];

    const hasMore = !!result.LastEvaluatedKey;

    return [posts, hasMore];
  }

  async putStatus(status: StatusDto): Promise<void> {
    if (!status || !status.user || status.timestamp === undefined) {
      throw new BadRequest("Status must include user and timestamp");
    }

    const item = {
      userAlias: status.user.alias,
      timestamp: status.timestamp,
      post: status.post,
      createdAt: Date.now(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to put status for ${status.user.alias}: `,
    );
  }
}
