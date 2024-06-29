import {
  CognitoIdentityProviderClient,
  DeleteUserCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

import crypto from "crypto";

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

const sqsClient = new SQSClient({
  region: process.env.SQS_REGION,
});

export const removeHandler = async (event) => {
  try {
    if (event.httpMethod !== "DELETE") {
      throw new Error(
        `Método inválido, essa rota aceita apenas DELETE, você enviou: ${event.httpMethod}`
      );
    }

    const { access_token } = JSON.parse(event.body);

    if (!access_token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Token de acesso não informado",
        }),
      };
    }

    const user = new GetUserCommand({
      AccessToken: access_token,
    });
    const userResult = await client.send(user);

    if (!userResult) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Cliente não encontrado",
        }),
      };
    }

    const command = new DeleteUserCommand({
      AccessToken: access_token,
    });
    const result = await client.send(command);

    if (!result) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao remover cliente",
        }),
      };
    }

    const sqsCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        id: crypto.randomBytes(16).toString("hex"),
        saga: "customer_deleted",
        time: new Date().toISOString(),
        payload: {
          cpf: userResult.Username,
        },
      }),
    });

    const sqsResult = await sqsClient.send(sqsCommand);
    if (!sqsResult) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao enviar mensagem para a fila",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Seus dados foram removidos com sucesso!",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao remover cliente:",
        error: error,
      }),
    };
  }
};
