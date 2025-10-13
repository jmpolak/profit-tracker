export abstract class TimeUtil {
  static delay(ms: number) {
    // to time utils
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
