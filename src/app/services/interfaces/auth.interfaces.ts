import { HttpHeaders, HttpParams } from "@angular/common/http";

export interface HttpOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams;
  withCredentials?: boolean;
}