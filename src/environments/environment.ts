const uri = "valuation-ascii-pottery-assumed.trycloudflare.com"

export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: '9480ea6e-4fba-404c-865b-c70927ef6b28',
      authority: 'https://login.microsoftonline.com/ed1fc57f-8a97-47e7-9de1-9302dfd786ae',
    },
  },
  apiConfig: {
    scopes: ['api://202acdbd-a466-4526-9ab9-895e4371eabe/access_as_user'],
    uri: `https://${uri}/api`,
    assetsUri: `https://${uri}/i18n`
  },
  wsUrl: `wss://${uri}/`
};
