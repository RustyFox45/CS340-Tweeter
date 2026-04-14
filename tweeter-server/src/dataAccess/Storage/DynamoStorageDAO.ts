import { DAO } from "../DAO";
import { StorageDAO } from "./StorageDAO";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ObjectCannedACL } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-west-2";
const BUCKET = process.env.S3_BUCKET_NAME || "tweeter-images";

export class DynamoStorageDAO extends DAO implements StorageDAO {
  async putImage(
    fileName: string,
    imageStringBase64Encoded: string,
  ): Promise<string> {
    const decodedImageBuffer = Buffer.from(imageStringBase64Encoded, "base64");

    const s3Params = {
      Bucket: BUCKET,
      Key: `image/${fileName}`,
      Body: decodedImageBuffer,
      ContentType: "image/png",
      ACL: ObjectCannedACL.public_read,
    };

    const command = new PutObjectCommand(s3Params);
    const client = new S3Client({ region: REGION });

    try {
      await client.send(command);
      return `https://${BUCKET}.s3.${REGION}.amazonaws.com/image/${fileName}`;
    } catch (error) {
      throw new Error(`S3 put image failed with: ${error}`);
    }
  }
}
