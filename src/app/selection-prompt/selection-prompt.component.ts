import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { ReportService } from '../report.service';

@Component({
  selector: 'app-selection-prompt',
  templateUrl: './selection-prompt.component.html',
  styleUrls: ['./selection-prompt.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class SelectionPromptComponent {
  // Inputs for type and selected values
  @Input() type: 'Distributor' | 'Territory' = 'Distributor';
  @Input() set selectedCode(code: string) {
    this.selectionForm.patchValue({ code });
  }
  @Input() set selectedName(name: string) {
    this.selectionForm.patchValue({ description: name });
  }

  // Output event when an item is selected
  @Output() itemSelected = new EventEmitter<{
    Code: string;
    Description: string;
  }>();

  // Modal and data state
  isModalOpen: boolean = false;
  items: Array<{ Code: string; Description: string }> = [];
  filteredItems: Array<{ Code: string; Description: string }> = [];

  // View children
  @ViewChild('listPrompt') listPrompt!: ElementRef;

  selectionForm: FormGroup;

  constructor(private reportService: ReportService, private fb: FormBuilder) {
    this.selectionForm = this.fb.group({
      code: [''],
      description: [''],
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] && this.type !== this.lastLoadedType) {
      this.lastLoadedType = this.type;
      this.items = [];
      this.filteredItems = [];
      this.loadData();
    }
  }

  // Open the modal and load data if needed
  openModal(): void {
    this.isModalOpen = true;
  }

  // Close the modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Handle search by code or name
  onSearch(type: 'code' | 'name'): void {
    const control = type === 'code' ? 'code' : 'description';
    const term = this.selectionForm.get(control)?.value?.toLowerCase().trim();

    this.filteredItems =
      term && term != ''
        ? this.items.filter((item) =>
            type === 'code'
              ? item.Code.toLowerCase().includes(term)
              : item.Description.toLowerCase().includes(term)
          )
        : [...this.items];
    this.currentPage = 1;
  }

  // Clear selected item
  clearSelection(): void {
    this.selectionForm.reset();
    this.itemSelected.emit({ Code: '', Description: '' });
    this.onSearch('code');
  }

  // Select an item and emit it
  selectItem(item: { Code: string; Description: string }): void {
    this.selectionForm.patchValue({
      code: item.Code,
      description: item.Description,
    });

    this.itemSelected.emit(item);
    this.closeModal();
  }

  get pageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Load data based on type
  private loadData(): void {
    const serviceCall =
      this.type === 'Distributor'
        ? this.reportService.getDistributorPrompt()
        : this.reportService.getTerritoryPrompt();
    serviceCall.subscribe((data) => {
      this.items = data.map((item: any) => ({
        Code:
          this.type === 'Distributor'
            ? item.DistributorCode?.trim()
            : item.TerritoryCode?.trim(),
        Description:
          this.type === 'Distributor'
            ? item.DistributorName
            : item.TerritoryName,
      }));
      this.filteredItems = [...this.items];
    });
  }

  // Pagination helpers
  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  get paginatedItems(): Array<{ Code: string; Description: string }> {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredItems.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Close modal if clicked outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isModalOpen) return;
    const target = event.target as Node;
    const insidePrompt = this.listPrompt?.nativeElement.contains(target);

    if (!insidePrompt) {
      this.closeModal();
    }
  }

  private lastLoadedType: 'Distributor' | 'Territory' | null = null;
  currentPage: number = 1;
  itemsPerPage: number = 10;
}
