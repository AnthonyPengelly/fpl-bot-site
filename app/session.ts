import { Cookie, CookieOptions, createSessionStorage } from "remix";
import {
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";

export const cookieName = "__session";

const createDatabaseSessionStorage = (
  cookie?:
    | Cookie
    | (CookieOptions & {
        name?: string;
      })
) => {
  // Configure your database client...
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });

  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      const id = uuidv4();
      const command = new PutItemCommand({
        TableName: process.env.SESSION_TABLE,
        Item: {
          id: { S: id },
          sessionData: { S: JSON.stringify(data) },
        },
      });
      await client.send(command);
      return id;
    },
    async readData(id) {
      const command = new GetItemCommand({
        TableName: process.env.SESSION_TABLE,
        Key: {
          id: { S: id },
        },
      });
      const result = await client.send(command);
      const data = result.Item?.sessionData?.S ?? null;
      return data ? JSON.parse(data) : null;
    },
    async updateData(id, data, expires) {
      const command = new PutItemCommand({
        TableName: process.env.SESSION_TABLE,
        Item: {
          id: { S: id },
          sessionData: { S: JSON.stringify(data) },
        },
      });
      await client.send(command);
    },
    async deleteData(id) {
      const command = new DeleteItemCommand({
        TableName: process.env.SESSION_TABLE,
        Key: {
          id: { S: id },
        },
      });
      await client.send(command);
    },
  });
};

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const { getSession, commitSession, destroySession } =
  createDatabaseSessionStorage({
    name: cookieName,
    sameSite: "lax",
  });
