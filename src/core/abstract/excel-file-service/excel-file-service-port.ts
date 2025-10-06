export abstract class IExcelFileServicePort {
  abstract generateFile<T, H = undefined, S = undefined>(
    data: T[],
    header?: H,
    footer?: S,
  ): Promise<Buffer>;
}
