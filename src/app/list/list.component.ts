import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { ReportService } from '../report.service';
import { CommonModule, formatDate } from '@angular/common';
import { SelectionPromptComponent } from '../selection-prompt/selection-prompt.component';
import { AlertPromptComponent } from '../alert-prompt/alert-prompt.component';

interface Selection {
  FromDate: Date | null;
  FromDateShow: string;
  ToDate: Date | null;
  ToDateShow: string;
  TerritoryCode: string;
  TerritoryName: string;
  DistributorCode: string;
  DistributorName: string;
  VATFlag: boolean;
  NonVATFlag: boolean;
  TerritoryFlag: boolean;
  DistributorFlag: boolean;
  ReportSummaryFlag: boolean;
  ReportDetailFlag: boolean;
  RootURL: string;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    SelectionPromptComponent,
    AlertPromptComponent,
  ],
})
export class ListComponent implements OnInit {
  @ViewChild('alertModal') alertModal!: any;

  public busy: Subscription | null = null;
  public selectionType: string = 'Distributor';
  private format: string =
    localStorage.getItem('ClientDateFormat') || 'yyyy-MM-dd';

  public selection: Selection = {
    FromDate: null,
    FromDateShow: '',
    ToDate: null,
    ToDateShow: '',
    TerritoryCode: '',
    TerritoryName: '',
    DistributorCode: '',
    DistributorName: '',
    VATFlag: true,
    NonVATFlag: true,
    TerritoryFlag: false,
    DistributorFlag: true,
    ReportSummaryFlag: true,
    ReportDetailFlag: false,
    RootURL: '',
  };

  public form: FormGroup;

  constructor(private fb: FormBuilder, private reportService: ReportService) {
    this.form = this.fb.group({
      selectionType: ['Distributor'],
      VATFlag: [true],
      NonVATFlag: [true],
      reportType: ['Summary'],
      FromDateShow: ['', Validators.required],
      ToDateShow: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const today = new Date();
    this.selection.FromDate = today;
    this.selection.ToDate = today;
    this.selection.FromDateShow = formatDate(today, this.format, 'en-US');
    this.selection.ToDateShow = formatDate(today, this.format, 'en-US');

    this.form.patchValue({
      FromDateShow: this.selection.FromDateShow,
      ToDateShow: this.selection.ToDateShow,
      VATFlag: this.selection.VATFlag,
      NonVATFlag: this.selection.NonVATFlag,
      reportType: this.selection.ReportSummaryFlag ? 'Summary' : 'Detail',
    });

    this.form.valueChanges.subscribe((formValues) => {
      this.selection.VATFlag = formValues.VATFlag;
      this.selection.NonVATFlag = formValues.NonVATFlag;
      this.selection.FromDateShow = formValues.FromDateShow;
      this.selection.ToDateShow = formValues.ToDateShow;
      this.selection.ReportSummaryFlag = formValues.reportType === 'Summary';
      this.selection.ReportDetailFlag = formValues.reportType === 'Detail';
    });
  }
  ngAfterViewInit(): void {
    this.reportService.componentMethodCalled$.subscribe((error) => {
      this.alertModal?.show(
        error?.error?.Desc || 'An unexpected error occurred.',
        error?.error?.MsgNumber || 0
      );
    });
  }

  onSelectDistributor(distributor: any): void {
    this.selection.DistributorCode = distributor.Code;
    this.selection.DistributorName = distributor.Description;
  }

  onSelectTerritory(territory: any): void {
    this.selection.TerritoryCode = territory.Code;
    this.selection.TerritoryName = territory.Description;
  }

  onSelectionChange(type: string): void {
    this.selectionType = type;
    this.selection.DistributorCode = '';
    this.selection.DistributorName = '';
    this.selection.TerritoryName = '';
    this.selection.TerritoryCode = '';
    if (type === 'Distributor') {
      this.selection.DistributorFlag = true;
      this.selection.TerritoryFlag = false;
    } else if (type === 'Territory') {
      this.selection.DistributorFlag = false;
      this.selection.TerritoryFlag = true;
    }
  }

  btnOK_click_verifyBeforeSubmit(event: Event): void {
    if (!this.selection.VATFlag && !this.selection.NonVATFlag) {
      this.alertModal.show(
        'Please select at least one option from "VAT Status" checkboxes.'
      );
      event.preventDefault();
    } else {
      this.btnOK_click();
    }
  }

  private btnOK_click(): void {
    this.updateSelectionDates();
    this.selection.RootURL = this.reportService.getRootURL();

    this.busy = this.reportService
      .generateExcel({ SelectionCriteria: this.selection })
      .subscribe((jsonData) => {
        const byteArr = this.base64ToArrayBuffer(jsonData.fileContents);
        this.generateExcelFile(byteArr, jsonData.ReportName);
      });
  }

  private updateSelectionDates(): void {
    this.selection.FromDate = this.selection.FromDateShow
      ? this.toDateOnly(this.selection.FromDateShow)
      : null;

    this.selection.ToDate = this.selection.ToDateShow
      ? this.toDateOnly(this.selection.ToDateShow)
      : null;
  }
  private toDateOnly(dateString: string): Date {
    const formatted = formatDate(dateString, 'yyyy-MM-dd', 'en-US');
    return new Date(formatted);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    return Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  }

  private generateExcelFile(byteArray: Uint8Array, reportName: string): void {
    const blob = new Blob([byteArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = reportName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
  closeTab(): void {
    if (typeof (window as any).closeTab === 'function') {
      (window as any).closeTab();
    } else {
      console.error('closeTab function not found.');
    }
  }
  // closeTab() {
  //   var t = window.parent.document.getElementById(
  //     'txtCurrentTaskCode'
  //   ) as HTMLInputElement;
  //   if (t?.value) {
  //     var closeButton = window.parent.document.getElementById(
  //       t.value + '_close'
  //     );
  //     closeButton?.click();
  //   } else {
  //     var taskCode = this.currentTaskCode();
  //     this.cleanLocalStorage(taskCode);
  //   }
  // }

  // private currentTaskCode() {
  //   var base = document.getElementsByTagName('base');
  //   var taskCode = '';
  //   if (base.length > 0) {
  //     var href = base[0].href;
  //     var array = href.replace(/\/$/, '').split('/');
  //     taskCode = array[array.length - 1];
  //   }
  //   return taskCode.trim();
  // }
  // private cleanLocalStorage(taskCode: any) {
  //   const keysToRemove = [];

  //   for (let i = 0; i < localStorage.length; i++) {
  //     const key = localStorage.key(i);
  //     if (key && key.startsWith(taskCode + '_')) {
  //       keysToRemove.push(key);
  //     }
  //   }

  //   for (const key of keysToRemove) {
  //     localStorage.removeItem(key);
  //   }
  // }
}
