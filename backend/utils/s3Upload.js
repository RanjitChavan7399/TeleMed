const { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand 
} = require("@aws-sdk/client-s3");

const fs = require("fs");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


// 🔹 Upload to S3
const uploadFileToS3 = async (file) => {
  const fileStream = fs.createReadStream(file.path);

  const key = `${Date.now()}-${file.originalname}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  // Optional: delete temp file after upload
  fs.unlinkSync(file.path);

  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};


// 🔹 Delete from S3
const deleteFileFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split(".amazonaws.com/")[1];

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));

    console.log("File deleted from S3:", key);
  } catch (error) {
    console.error("Error deleting file from S3:", error.message);
  }
};


module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
};
