export abstract class IExcelFileServicePort {
  abstract generateFile<T, S>(data: T[], footer?: S[]): Promise<Buffer>;
}
