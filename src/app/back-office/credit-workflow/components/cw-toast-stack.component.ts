import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CreditToastService } from '../services/credit-toast.service';

@Component({
  selector: 'app-cw-toast-stack',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cw-toast-stack" aria-live="polite">
      <div *ngFor="let t of visible" class="cw-toast" [class.success]="t.kind === 'success'" [class.error]="t.kind === 'error'" [class.info]="t.kind === 'info'">
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [
    `
      .cw-toast-stack {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10050;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .cw-toast {
        min-width: 260px;
        max-width: 420px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 12px 40px rgba(15, 23, 42, 0.18);
        border: 1px solid rgba(15, 23, 42, 0.06);
        background: #fff;
        color: #0f172a;
        pointer-events: auto;
      }
      .cw-toast.success {
        border-color: rgba(5, 150, 105, 0.35);
        background: linear-gradient(135deg, #ecfdf5, #fff);
      }
      .cw-toast.error {
        border-color: rgba(220, 38, 38, 0.35);
        background: linear-gradient(135deg, #fef2f2, #fff);
      }
      .cw-toast.info {
        border-color: rgba(59, 130, 246, 0.35);
        background: linear-gradient(135deg, #eff6ff, #fff);
      }
    `,
  ],
})
export class CwToastStackComponent implements OnInit, OnDestroy {
  private readonly toast = inject(CreditToastService);
  private sub?: Subscription;
  private seq = 0;
  visible: { id: number; message: string; kind: string }[] = [];

  ngOnInit(): void {
    this.sub = this.toast.events$.subscribe((ev) => {
      const id = ++this.seq;
      this.visible = [...this.visible, { id, message: ev.message, kind: ev.kind }];
      setTimeout(() => {
        this.visible = this.visible.filter((x) => x.id !== id);
      }, 4200);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
