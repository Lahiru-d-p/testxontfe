import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-alert-prompt',
  templateUrl: './alert-prompt.component.html',
  styleUrls: ['./alert-prompt.component.css'],
  imports: [CommonModule],
})
export class AlertPromptComponent {
  message: string = '';
  code: string | null = null;
  visible: boolean = false;

  show(message: string, code?: string): void {
    this.message = message;
    this.code = code ?? null;
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
    this.message = '';
    this.code = null;
  }
}
