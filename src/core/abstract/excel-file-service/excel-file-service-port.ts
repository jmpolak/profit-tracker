export abstract class IExcelFileServicePort {
  abstract generateFile<T, S>(
    data: T[],
    filePath: string,
    fileName: string,
    footer?: S[],
  ): Promise<string>;
}
