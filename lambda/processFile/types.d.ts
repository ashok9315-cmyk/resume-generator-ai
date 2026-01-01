// Type declarations for modules without official types

declare module 'mammoth' {
  interface ExtractRawTextOptions {
    buffer?: Buffer;
    path?: string;
  }

  interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}