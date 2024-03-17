import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

export const registerHandler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      throw new Error(
        `Método inválido, essa rota aceita apenas POST, você enviou: ${event.httpMethod}`
      );
    }

    const { cpf, email, name } = JSON.parse(event.body);
    const cpfFormatted = cpf.replaceAll(".", "").replace("-", "");

    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: cpfFormatted,
      Password: cpfFormatted, // Senha fixa para todos usuários
      UserAttributes: [
        { Name: "email", Value: String(email) },
        { Name: "name", Value: String(name) },
        { Name: "custom:CPF", Value: String(cpfFormatted) },
      ],
    };

    const command = new SignUpCommand(params);
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
      body: JSON.stringify({ message: "Erro ao registrar usuário:", error }),
    };
  }
};
