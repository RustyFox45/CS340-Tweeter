import { StatusDto, User, Status } from "tweeter-shared";
import { DAOFactory } from "../../dataAccess/DAOFactory";

interface SQSEvent {
  Records: Array<{
    body: string;
  }>;
}

interface UpdateFeedMessage {
  statusDto: StatusDto;
  followerAliases: string[];
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const feedDao = DAOFactory.getInstance().getFeedDAO();

  for (const record of event.Records) {
    const { statusDto, followerAliases }: UpdateFeedMessage = JSON.parse(
      record.body,
    );

    const user = User.fromDto(statusDto.user)!;
    const status = new Status(statusDto.post, user, statusDto.timestamp);

    await feedDao.uploadToFollowerFeeds(
      statusDto.user.alias,
      followerAliases,
      status,
    );
  }
};
