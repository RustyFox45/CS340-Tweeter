import { DAO } from "../DAO";
import { AuthDAO } from "./AuthDAO";
import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = process.env.AUTH_TOKENS_TABLE_NAME || "tweeter-auth-tokens";
const TOKEN_EXPIRATION_HOURS = 24;

export class DynamoAuthDAO extends DAO implements AuthDAO {
  async putAuth(alias: string, token: string): Promise<void> {
    const expiresAt = Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000;

    const item = {
      token: token,
      alias: alias,
      createdAt: Date.now(),
      expiresAt: expiresAt,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to create auth token for user ${alias}: `,
    );
  }

  async getTimeStamp(token: string): Promise<number | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { token },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get timestamp for token: `,
    );

    if (!result.Item) {
      return null;
    }

    return result.Item.createdAt || null;
  }

  async updateTimeStamp(token: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { token },
      UpdateExpression: "SET createdAt = :now, expiresAt = :expiresAt",
      ExpressionAttributeValues: {
        ":now": Date.now(),
        ":expiresAt": Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000,
      },
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to update timestamp for token: `,
    );
  }

  async deleteAuth(token: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { token },
    });

    await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to delete auth token: `,
    );
  }

  async getAlias(token: string): Promise<string | null> {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { token },
    });

    const result = await this.tryRequest(
      () => this.getClient().send(command),
      `Failed to get alias for token: `,
    );

    if (!result.Item) {
      return null;
    }

    // Check if token has expired
    if (result.Item.expiresAt && result.Item.expiresAt < Date.now()) {
      await this.deleteAuth(token);
      return null;
    }

    return result.Item.alias || null;
  }
}
