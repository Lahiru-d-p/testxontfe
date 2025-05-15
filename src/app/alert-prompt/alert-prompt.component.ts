import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ReportService } from '../report.service';

export interface ErrorInfo {
  ErrorType: 1 | 2;
  ErrorLog: string;
  ErrorTime: string;
  WorkstationId: string;
  UserName: string;
  IpAddress: string;
  MsgNumber: string;
  Desc: string;
  ErrorSource: string;
  DllName: string;
  Version: string;
  Routine: string;
  LineNumber: string;
}

@Component({
  selector: 'app-alert-prompt',
  templateUrl: './alert-prompt.component.html',
  styleUrls: ['./alert-prompt.component.css'],
  imports: [CommonModule],
})
export class AlertPromptComponent {
  visible = false;
  messageType: 'alert' | 'confirm' | 'error' = 'alert';

  messageText = '';
  okButtonText = 'OK';
  cancelButtonText = 'Cancel';
  errorMessage: ErrorInfo | null = null;

  @Output() onOK = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  busy: Subscription | null = null;

  constructor(private reportService: ReportService) {}
  showAlert(message: string, okButtonText = 'OK') {
    this.messageType = 'alert';
    this.messageText = message;
    this.okButtonText = okButtonText;
    this.visible = true;
  }

  showConfirm(message: string, okButtonText = 'Yes', cancelButtonText = 'No') {
    this.messageType = 'confirm';
    this.messageText = message;
    this.okButtonText = okButtonText;
    this.cancelButtonText = cancelButtonText;
    this.visible = true;
  }

  showError(error: ErrorInfo) {
    this.messageType = 'error';
    this.errorMessage = error;
    this.visible = true;
    if (this.errorMessage && this.errorMessage.ErrorType === 1) {
      this.busy = this.reportService.getUserName().subscribe((data) => {
        if (this.errorMessage) {
          this.errorMessage.UserName = data ?? '';
        }
      });
    }
  }

  confirmOK() {
    this.visible = false;
    this.onOK.emit();
  }

  confirmCancel() {
    this.visible = false;
    this.onCancel.emit();
  }
}
