export abstract class IExcelFileServicePort {
  abstract generateFile<T, H, S>(
    data: T[],
    header?: H,
    footer?: S,
  ): Promise<Buffer>;
}
