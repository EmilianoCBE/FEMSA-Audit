export type RiskClassificationRequest = {
  probability: number;
  impact: number;
};

export type RiskClassification = {
  probability: number;
  impact: number;
  score: number;
  level: string;
};

export type RiskClassificationResponse = {
  result: RiskClassification;
};