import { UserDto } from "tweeter-shared";
import { DAO } from "../DAO";
import { UserDAO } from "./UserDAO";
import {
  PutCommand,
  GetCommand,
  BatchGetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";

const TABLE_NAME = process.env.USERS_TABLE_NAME || "tweeter-users";

export class DynamoUserDAO extends DAO implements UserDAO {
  async getUser(alias: string): Promise<UserDto | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { alias },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get user ${alias}: `,
    );

    if (!result.Item) {
      return null;
    }

    return {
      firstName: result.Item.firstName,
      lastName: result.Item.lastName,
      alias: result.Item.alias,
      imageUrl: result.Item.imageUrl,
    };
  }

  async putUser(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageUrl: string,
  ): Promise<void> {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    const item = {
      alias: alias,
      firstName: firstName,
      lastName: lastName,
      passwordHash: passwordHash,
      imageUrl: imageUrl,
      numFollowers: 0,
      numFollowees: 0,
      createdAt: Date.now(),
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to create user ${alias}: `,
    );
  }

  async aliasExists(alias: string): Promise<boolean> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { alias },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to check if alias exists ${alias}: `,
    );

    return !!result.Item;
  }

  async getAliasAndPassword(
    alias: string,
  ): Promise<{ alias: string; password: string } | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { alias },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get alias and password for ${alias}: `,
    );

    if (!result.Item || !result.Item.passwordHash) {
      return null;
    }

    return {
      alias: result.Item.alias,
      password: result.Item.passwordHash,
    };
  }

  async getNumFollowers(alias: string): Promise<number> {
    return this.getCount(
      alias,
      "numFollowers",
      `Failed to get follower count for ${alias}: `,
    );
  }

  async getNumFollowees(alias: string): Promise<number> {
    return this.getCount(
      alias,
      "numFollowees",
      `Failed to get followee count for ${alias}: `,
    );
  }

  private async getCount(
    alias: string,
    field: string,
    errorMsg: string,
  ): Promise<number> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { alias },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      errorMsg,
    );

    return result.Item?.[field] || 0;
  }

  private async adjustCount(
    alias: string,
    field: string,
    delta: number,
    errorMsg: string,
  ): Promise<void> {
    const operator = delta > 0 ? "+" : "-";
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { alias },
      UpdateExpression: `SET ${field} = if_not_exists(${field}, :zero) ${operator} :inc`,
      ExpressionAttributeValues: {
        ":inc": Math.abs(delta),
        ":zero": 0,
      },
    });

    await this.tryRequest(() => this.getClient().send(command), errorMsg);
  }

  async incrementNumFollowers(alias: string): Promise<void> {
    await this.adjustCount(
      alias,
      "numFollowers",
      1,
      `Failed to increment followers for ${alias}: `,
    );
  }

  async incrementNumFollowees(alias: string): Promise<void> {
    await this.adjustCount(
      alias,
      "numFollowees",
      1,
      `Failed to increment followees for ${alias}: `,
    );
  }

  async decrementNumFollowers(alias: string): Promise<void> {
    await this.adjustCount(
      alias,
      "numFollowers",
      -1,
      `Failed to decrement followers for ${alias}: `,
    );
  }

  async decrementNumFollowees(alias: string): Promise<void> {
    await this.adjustCount(
      alias,
      "numFollowees",
      -1,
      `Failed to decrement followees for ${alias}: `,
    );
  }

  async batchGetUser(aliases: string[]): Promise<UserDto[]> {
    if (aliases.length === 0) {
      return [];
    }

    // BatchGetItem has a limit of 100 items, but we'll chunk to be safe
    const chunks = [];
    for (let i = 0; i < aliases.length; i += 25) {
      chunks.push(aliases.slice(i, i + 25));
    }

    const users: UserDto[] = [];

    for (const chunk of chunks) {
      const command = new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: chunk.map((alias) => ({ alias })),
          },
        },
      });

      const result = await this.tryRequest(
        () => this.getClient().send(command),
        `Failed to batch get users: `,
      );

      if (result.Responses && result.Responses[TABLE_NAME]) {
        for (const item of result.Responses[TABLE_NAME]) {
          users.push({
            firstName: item.firstName,
            lastName: item.lastName,
            alias: item.alias,
            imageUrl: item.imageUrl,
          });
        }
      }
    }

    return users;
  }
}
