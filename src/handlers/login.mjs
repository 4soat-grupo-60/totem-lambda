import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

export const loginHandler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      throw new Error(
        `Método inválido, essa rota aceita apenas POST, você enviou: ${event.httpMethod}`
      );
    }

    const { cpf } = JSON.parse(event.body);
    const cpfFormatted = cpf.replaceAll(".", "").replace("-", "");

    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: cpfFormatted,
        PASSWORD: cpfFormatted, // Senha fixa para todos usuários
      },
      ClientId: process.env.COGNITO_CLIENT_ID,
    });

    const result = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        client_id: result.ChallengeParameters.USER_ID_FOR_SRP,
        session: result.Session,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao autenticar usuário:", error }),
    };
  }
};
