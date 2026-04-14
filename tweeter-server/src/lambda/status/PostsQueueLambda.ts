import { StatusDto } from "tweeter-shared";
import { DAOFactory } from "../../dataAccess/DAOFactory";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const FOLLOWER_BATCH_SIZE = 100;

interface SQSEvent {
  Records: Array<{
    body: string;
  }>;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const followDao = DAOFactory.getInstance().getFollowDAO();
  const sqsClient = new SQSClient();
  const updateFeedQueueUrl = process.env.UPDATE_FEED_QUEUE_URL!;

  for (const record of event.Records) {
    const statusDto: StatusDto = JSON.parse(record.body);
    const authorAlias = statusDto.user.alias;

    // Get all followers of the author
    const followers = await followDao.getAllFollowers(authorAlias);

    // Batch followers and send each batch to UpdateFeedQueue
    for (let i = 0; i < followers.length; i += FOLLOWER_BATCH_SIZE) {
      const batch = followers.slice(i, i + FOLLOWER_BATCH_SIZE);
      const messageBody = JSON.stringify({
        statusDto: statusDto,
        followerAliases: batch,
      });

      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: updateFeedQueueUrl,
          MessageBody: messageBody,
        }),
      );
    }
  }
};
