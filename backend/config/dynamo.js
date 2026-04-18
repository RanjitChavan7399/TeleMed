const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: "ap-south-1",
    // We assume credentials are provided through environment variables, EC2 instance profile, or ~/.aws
});

const dynamoDb = DynamoDBDocumentClient.from(client);

module.exports = dynamoDb;
