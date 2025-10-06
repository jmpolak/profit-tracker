export abstract class StringUtil {
  static addUnderScoreBeforeUpperCaseLetter(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, '$1_$2');
  }
}
