import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ReportService } from '../report.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-selection-prompt',
  templateUrl: './selection-prompt.component.html',
  styleUrls: ['./selection-prompt.component.css'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class SelectionPromptComponent {
  // Inputs for type and selected values
  @Input() type: 'Distributor' | 'Territory' = 'Distributor';
  @Input() selectedName: string = '';
  @Input() selectedCode: string = '';

  // Output event when an item is selected
  @Output() itemSelected = new EventEmitter<{
    Code: string;
    Description: string;
  }>();

  // Modal and data state
  isModalOpen: boolean = false;
  searchTerm: string = '';
  items: Array<{ Code: string; Description: string }> = [];
  filteredItems: Array<{ Code: string; Description: string }> = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // View children
  @ViewChild('inputField') inputField!: ElementRef;
  @ViewChild('listPrompt') listPrompt!: ElementRef;
  @ViewChild('modal') modalRef!: ElementRef;

  constructor(private reportService: ReportService) {}

  // Open the modal and load data if needed
  openModal(): void {
    this.isModalOpen = true;
    if (!this.items.length) {
      this.loadData();
    }
  }

  // Close the modal
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Handle search by code or name
  onSearch(type: 'code' | 'name'): void {
    const term = (type === 'code' ? this.selectedCode : this.selectedName)
      .toLowerCase()
      .trim();

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
    this.selectedCode = '';
    this.selectedName = '';
    this.itemSelected.emit({ Code: '', Description: '' });
  }

  // Select an item and emit it
  selectItem(item: { Code: string; Description: string }): void {
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
    const insideModal = this.modalRef?.nativeElement?.contains(target);

    if (!insidePrompt && !insideModal) {
      this.closeModal();
    }
  }
}
