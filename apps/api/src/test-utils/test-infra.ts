export const apiInfraTestsEnabled = process.env.API_TEST_WITH_INFRA === 'true';

export const describeIfApiInfra = apiInfraTestsEnabled
  ? describe
  : describe.skip;
