import { ImmutableDate } from 'src/core/entity/immutable-date';

export abstract class DateUtil {
  static checkIfLastUpdateWasAlreadyMade = (
    lastUpdate: ImmutableDate,
    dateForCheck: ImmutableDate,
  ): boolean => {
    return (
      lastUpdate.getDate() === dateForCheck.getDate() &&
      lastUpdate.getMonth() === dateForCheck.getMonth() &&
      lastUpdate.getFullYear() === dateForCheck.getFullYear()
    );
  };

  static convertDateToString(date: Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();

    return `${day}-${month}-${year}` as string & { __format: 'DD-MM-YYYY' };
  }

  static getTodayDate(): string {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  static formatDateTime(date: Date | ImmutableDate) {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${day}-${month}-${year} ${hours}:${minutes}` as string & {
      __format: 'DD-MM-YYYY hh:mm';
    };
  }

  static formatDateTimeWithSec(date: Date | ImmutableDate) {
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1); // Months are 0-indexed
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}` as string & {
      __format: 'DD-MM-YYYY hh:mm:ss';
    };
  }
}
