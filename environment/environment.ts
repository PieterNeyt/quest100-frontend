export const environment = {
  production: false,
  msalConfig: {
    auth: {
      clientId: '9480ea6e-4fba-404c-865b-c70927ef6b28',
      authority: 'https://login.microsoftonline.com/ed1fc57f-8a97-47e7-9de1-9302dfd786ae',
    },
  },
  apiConfig: {
    scopes: ['User.Read'],
    uri: 'https://graph.microsoft.com/v1.0/me',
  },
};
