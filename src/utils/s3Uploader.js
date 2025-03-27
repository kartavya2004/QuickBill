import AWS from "aws-sdk";

// Direct AWS Configuration
const awsConfig = {
  accessKeyId: "accessKeyId",          // Replace with your Access Key ID
  secretAccessKey: "secretAccessKey",  // Replace with your Secret Access Key
  region: "region",                          // Replace with your region
  bucketName: "bucketname"                 // Replace with your bucket name
};

// Configure AWS S3
const configureS3 = () => {
  try {
    // Configure AWS SDK
    AWS.config.update({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region
    });

    return new AWS.S3();
  } catch (error) {
    console.error("Error configuring S3:", error);
    return null;
  }
};

const s3 = configureS3();

const uploadToS3 = async (pdfBlob, fileName) => {
  try {
    // If S3 is not configured properly, fall back to local URL
    if (!s3 || !awsConfig.bucketName) {
      console.log("S3 not configured properly, using local storage fallback");
      return URL.createObjectURL(pdfBlob);
    }

    console.log("Uploading to S3:", { fileName });

    const params = {
      Bucket: awsConfig.bucketName,
      Key: `invoices/${fileName}.pdf`,
      Body: pdfBlob,
      ContentType: "application/pdf"
      // Removed ACL configuration since bucket doesn't support it
    };

    const uploadResult = await s3.upload(params).promise();
    console.log("S3 upload successful:", uploadResult.Location);
    return uploadResult.Location;
  } catch (error) {
    console.error("Error during S3 upload:", error);
    // Fallback to local storage if S3 upload fails
    console.log("Using local storage fallback due to S3 error");
    return URL.createObjectURL(pdfBlob);
  }
};

export { uploadToS3 };