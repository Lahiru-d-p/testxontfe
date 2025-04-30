import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import dayjs from 'dayjs';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { ReportService } from '../report.service';
import { CommonModule } from '@angular/common';
import { SelectionPromptComponent } from '../selection-prompt/selection-prompt.component';

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
  ],
})
export class ListComponent implements OnInit {
  @ViewChild('msgPrompt') msgPrompt!: ElementRef;
  @ViewChild('VATStatusAlert') vatStatusAlert!: ElementRef;

  public busy: Subscription | null = null;
  public selectionType: string = 'Distributor';
  private format: string =
    localStorage.getItem('ClientDateFormat') || 'yyyy-mm-dd';

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

    this.setupErrorSubscription();
  }

  ngOnInit(): void {
    const today = new Date();
    this.selection.FromDate = today;
    this.selection.ToDate = today;

    this.selection.FromDateShow = dayjs(today).format(this.format);
    this.selection.ToDateShow = dayjs(today).format(this.format);
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
      this.vatStatusAlert.nativeElement.showAlert(
        'Please select at least one option from "VAT Status" checkboxes.',
        'OK'
      );
      event.preventDefault();
    } else {
      this.btnOK_click();
    }
  }

  private setupErrorSubscription(): void {
    this.reportService.componentMethodCalled$.subscribe((error) => {
      this.msgPrompt.nativeElement.show(error, 'SOXLR71');
    });
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
      ? dayjs(this.selection.FromDateShow).toDate()
      : null;

    this.selection.ToDate = this.selection.ToDateShow
      ? dayjs(this.selection.ToDateShow).toDate()
      : null;
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
}
