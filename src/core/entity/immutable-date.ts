export type ImmutableDate = Omit<
  Date,
  | 'setFullYear'
  | 'setMonth'
  | 'setDate'
  | 'setHours'
  | 'setMinutes'
  | 'setSeconds'
  | 'setMilliseconds'
  | 'setTime'
  | 'setUTCFullYear'
  | 'setUTCMonth'
  | 'setUTCDate'
  | 'setUTCHours'
  | 'setUTCMinutes'
  | 'setUTCSeconds'
  | 'setUTCMilliseconds'
>;
