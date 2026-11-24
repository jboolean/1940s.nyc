'use strict';

// osls has no setting for REST API stage throttling and the stage isn't a
// CloudFormation resource, so apply it to the deployed stage after each deploy.
class StageThrottling {
  constructor(serverless, options, { log }) {
    this.serverless = serverless;
    this.log = log;
    this.provider = serverless.getProvider('aws');
    this.options = options;

    serverless.configSchemaHandler.defineCustomProperties({
      type: 'object',
      properties: {
        stageThrottling: {
          type: 'object',
          properties: {
            rateLimit: { type: 'number' },
            burstLimit: { type: 'integer' },
          },
          required: ['rateLimit', 'burstLimit'],
          additionalProperties: false,
        },
      },
    });

    this.hooks = {
      'after:deploy:deploy': () => this.updateStage(),
    };
  }

  async updateStage() {
    const config = this.serverless.service.custom.stageThrottling;
    if (!config) {
      return;
    }

    const { StackResourceDetail } = await this.provider.request(
      'CloudFormation',
      'describeStackResource',
      {
        StackName: this.provider.naming.getStackName(),
        LogicalResourceId: this.provider.naming.getRestApiLogicalId(),
      }
    );
    const restApiId = StackResourceDetail.PhysicalResourceId;
    const stageName = this.provider.getStage();

    await this.provider.request('APIGateway', 'updateStage', {
      restApiId,
      stageName,
      patchOperations: [
        {
          op: 'replace',
          path: '/*/*/throttling/rateLimit',
          value: String(config.rateLimit),
        },
        {
          op: 'replace',
          path: '/*/*/throttling/burstLimit',
          value: String(config.burstLimit),
        },
      ],
    });

    this.log.notice(
      `Throttling ${stageName} stage to ${config.rateLimit} rps, burst ${config.burstLimit}`
    );
  }
}

module.exports = StageThrottling;
