import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastKind = 'success' | 'error' | 'info';

export interface CreditToast {
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class CreditToastService {
  private readonly subject = new Subject<CreditToast>();

  readonly events$ = this.subject.asObservable();

  success(message: string): void {
    this.subject.next({ message, kind: 'success' });
  }

  error(message: string): void {
    this.subject.next({ message, kind: 'error' });
  }

  info(message: string): void {
    this.subject.next({ message, kind: 'info' });
  }
}
