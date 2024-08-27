import { Options } from "./core";

export interface Run {
  (transformFile: string, paths: string[], options?: Options): Promise<{
    stats: { [messageName: string]: number };
    timeElapsed: string;
    error: number;
    ok: number;
    nochange: number;
    skip: number;
  }>;
}

export interface ReportParams {
  status: string;
  file: string;
  msg: string;
}

export interface FileCounters {
  [key: string]: number;
}

export interface StatsCounter {
  [key: string]: number;
}

export interface Stats {
  [key: string]: number | string;
}

export interface Accumulator {
  files: string[];
  remaining: number;
}

export interface Message {
  action: string;
  status?: string;
  name?: string;
  quantity?: number;
  file?: string;
  msg?: string;
}
