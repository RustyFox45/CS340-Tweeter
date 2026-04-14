// import { RegisterRequest } from "tweeter-shared";
import "isomorphic-fetch";
import { StatusService } from "../../../src/model.service/StatusService";
import { AuthToken } from "tweeter-shared";

// Old M3 test disabled — uses fake tokens that no longer work with real backend
describe.skip("FollowService", () => {
  const tryTest = async (method: () => void) => {
    try {
      await method();
    } catch (error) {
      console.log("Test failed: ", error);
    }
  };

  it("loadMoreStoryItemsWorks ", async () => {
    tryTest(async () => {});
    const statusService = new StatusService();
    const testAuthToken = AuthToken.Generate();
    const [statuses, hasMore] = await statusService.loadMoreStoryItems(
      testAuthToken,
      "testUserAlias",
      2,
      null,
    );
    expect(statuses.length).toBe(2);
    const firstStatus = statuses[0];
    expect(firstStatus.user).not.toBeUndefined;
    expect(firstStatus.user.imageUrl).not.toBeUndefined;
    expect(firstStatus.segments).not.toBeUndefined;
  });
});
