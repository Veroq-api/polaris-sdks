import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VeroqApi implements ICredentialType {
  name = 'veroqApi';
  displayName = 'VEROQ API';
  documentationUrl = 'https://veroq.co/docs';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Your VEROQ API key (or Polaris API key — both are accepted)',
    },
  ];
}
