import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
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
      ForceAliasCreation: true,
    };

    const command = new SignUpCommand(params);
    const result = await client.send(command);

    const commandConfirm = new AdminConfirmSignUpCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: cpfFormatted,
    });

    await client.send(commandConfirm);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Cliente cadastrado com sucesso!",
        result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao cadastrar cliente:",
        error: error,
      }),
    };
  }
};
