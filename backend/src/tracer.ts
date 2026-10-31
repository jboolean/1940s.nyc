import tracer from 'dd-trace';

tracer.init({
  llmobs: {
    mlApp: process.env.DD_LLMOBS_ML_APP,
    agentlessEnabled: true,
  },
});

export default tracer;
