import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

// Configure AWS S3
AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "",
});

const s3 = new AWS.S3();

const uploadToS3 = async (pdfBlob, fileName) => {
  console.log("Uploading to S3 with parameters:", { fileName, pdfBlob });

  const params = {
    Bucket: "",
    Key: `invoices/${fileName}.pdf`,
    Body: pdfBlob,
    ContentType: "application/pdf",
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error during S3 upload:", err); // Log the error
        reject(err);
      } else {
        resolve(data.Location); // Return the uploaded file URL
      }
    });
  });
};


export { uploadToS3 }; // Added export statement
