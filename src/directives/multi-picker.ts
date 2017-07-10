import { Directive, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { PickerController, PickerColumn, PickerCmp, PickerColumnCmp } from 'ionic-angular';
import { MultiPickerColumn, MultiPickerOption } from './multi-picker-options';
/**
 * 说明文档请参见 multi-picker-readme.md
 */
@Directive({
	selector: '[multi-picker]'
})
export class MultiPickerDirective {
	constructor(private el: ElementRef, private _pickerCtrl: PickerController) { }
	// 可绑定属性。
	@Input("mp-cancel-text") cancelText: string = '取消'; // 选择器取消按钮文字
	@Input("mp-done-text") doneText: string = '确认'; // 选择器确认按钮文字
	@Input("multi-picker") multiPickerColumns: MultiPickerColumn[] = []; // 选择器面板显示的列
	@Input("mp-separator") separator: string = ' '; // 值中来自不同列部分之间的分隔符
	@Input("mp-cssClass") cssClass: string = 'mp-picker'; // 值中来自不同列部分之间的分隔符
	@Output("mp-change") change: EventEmitter<any> = new EventEmitter(); // 选择器值发生变化事件。
	@Output("mp-cancel") cancel: EventEmitter<any> = new EventEmitter(); // 选择器点击取消按钮的事件。

	_disabled: any = false;
	_labelId: string = '';
	_text: string = '';
	_fn: Function;
	_isOpen: boolean = false;
	_value: any = '';
	_pickerCmp: PickerCmp;
	_pickerColumnCmps: PickerColumnCmp[];
	_isDependent: boolean = false;
	_sequence: number[] = [];

	@HostListener('click', ['$event'])
	_click(ev: UIEvent) {
		if (ev.detail === 0) {
			return;
		}
		ev.preventDefault();
		ev.stopPropagation();
		this.open();
	}
	/**
	* 打开选择器面板。
	* @private
	*/
	open() {
		if (this._disabled) {
			return;
		}
		let pickerOptions: any = {cssClass:this.cssClass};
		let picker = this._pickerCtrl.create(pickerOptions);
		pickerOptions.buttons = [
			{
				text: this.cancelText,
				role: 'cancel',
				handler: () => {
					this.cancel.emit(null);
				}
			},
			{
				text: this.doneText,
				handler: (data: any) => {
					this.onChange(data);
					this.change.emit(data);
				}
			}
		];
		// 是否为父级选项。
		this._isDependent = this.multiPickerColumns.some(col => col.options.some(opt => opt.parentVal));
		this.generate(picker);
		if (this.multiPickerColumns.length > 1 && this._isDependent) {
			this.generateSequence();
			picker.ionChange.subscribe(() => {
				this.validate(picker);
			});
		}
		picker.present(pickerOptions).then(() => {
			this._pickerCmp = picker.instance;
			this._pickerColumnCmps = this._pickerCmp._cols.toArray();
			this._pickerColumnCmps.forEach(col => col.lastIndex = -1)
			for (let i = 0; i < picker.getColumns().length; i++) {
				this.validate(picker);
			}
		});
		this._isOpen = true;
		picker.onDidDismiss(() => {
			this._isOpen = false;
		});
	}
	/**
	 * 确定列的序列。
	 */
	private generateSequence() {
		let hasParentCol = this.multiPickerColumns.some(col => col.parentCol !== undefined);
		// 如果列是一个独立列，或者没有明确父级列，按照从左到右的顺序验证列。
		if (!this._isDependent || !hasParentCol) {
			this.multiPickerColumns.forEach((col, index) => this._sequence.push(index));
		} else {
			// 如果明确了父级列，则必须有一个祖先列（此列没有父级列）
			let name = undefined;
			let alias = undefined;
			for (let i = 0; i < this.multiPickerColumns.length; i++) {
				let index = this.multiPickerColumns.findIndex(col => col.parentCol === name || (alias && col.parentCol === alias));
				name = this.multiPickerColumns[index].name;
				alias = this.multiPickerColumns[index].alias;
				if (index > -1) {
					this._sequence.push(index);
				}
			}
		}
	}
	/**
	 * 初始化选择器面板。设置选择项，添加列。
	 */
	private generate(picker: any) {
		let values = this._value.toString().split(this.separator);
		this.multiPickerColumns.forEach((col, index) => {
			// 找到被选择的值，根据此值确定父级值。
			let selectedOpt = col.options.find(option => option.value == values[index]) || col.options[0];
			let options = col.options;
			// 若是依赖项，则其父级列的值是其父级值。
			if (this._isDependent) {
				// 过滤父级值。
				options = options.filter(option => option.parentVal === selectedOpt.parentVal);
			}
			// 生成列。
			let column: any = {
				name: col.name || index.toString(),
				options: options.map(option => { return { text: option.text, value: option.value, disabled: option.disabled || false } }),
				columnWidth: col.columnWidth
			}
			// 设置选择项。
			let selectedIndex = column.options.findIndex(option => option.value == values[index]);
			// 若没有默认值，默认选中第1项。
			selectedIndex = selectedIndex === -1 ? 0 : selectedIndex;
			column.selectedIndex = selectedIndex;
			picker.addColumn(column);
		});
		this.divyColumns(picker);
	}
	/**
	 * 验证被选择的项目，特别是依赖项。
	 */
	private validate(picker: any) {
		let columns = picker.getColumns();
		for (let j = 0; j < this._sequence.length; j++) {
			let i = this._sequence[j];
			let curCol: PickerColumn = columns[i];
			let parentCol: PickerColumn = this.getParentCol(i, columns);
			if (!parentCol) continue;
			let curOption: MultiPickerOption = curCol.options[curCol.selectedIndex];
			// 处理父级列已变化，但选择项尚未更新的情况。
			if (parentCol.selectedIndex >= parentCol.options.length) {
				parentCol.selectedIndex = parentCol.options.length - 1;
			}
			let parentOption: MultiPickerOption = parentCol.options[parentCol.selectedIndex] || {};
			let curParentVal;
			if (curOption) {
				curParentVal = this.getOptionParentValue(i, curOption);
			}
			if (curParentVal != parentOption.value) {
				curCol.options.splice(0, curCol.options.length);
				this.multiPickerColumns[i].options.forEach(option => {
					if (option.parentVal == parentOption.value) {
						curCol.options.push({ text: option.text, value: option.value, disabled: false });

						// 页面渲染完成后（setTimeout），设置选择项。
						let selectedIndex = curCol.selectedIndex >= curCol.options.length ? curCol.options.length - 1 : curCol.selectedIndex;
						setTimeout(() => this._pickerColumnCmps[i].setSelected(selectedIndex, 150), 0);
					}
				});
			}
		}
	}
	/**
	 * 获得一个选项的父级值。
	 * @private
	 */
	getOptionParentValue(colIndex, option) {
		return this.multiPickerColumns[colIndex].options.find(opt => opt.value == option.value).parentVal;
	}
	/**
	 * 获得某列的父级列。
	 */
	getParentCol(childColIndex: number, columns: PickerColumn[]): PickerColumn {
		// 在_sequence中获得子列位置。
		let pos = this._sequence.findIndex(idx => idx === childColIndex);
		if (pos > 0) {
			// 父列索引号是上述元素在_sequence中的索引号-1
			return columns[this._sequence[pos - 1]]
		}
		// 如果索引号为0，则此列是祖先列，没有父列。
		return null;
	}
	private divyColumns(picker: any) {
		let pickerColumns = picker.getColumns();
		let columns: number[] = [];
		pickerColumns.forEach((col, i) => {
			columns.push(0);
			col.options.forEach(opt => {
				if (opt.text.replace(/[^\x00-\xff]/g, "01").length > columns[i]) {
					columns[i] = opt.text.replace(/[^\x00-\xff]/g, "01").length;
				}
			});
		});
		if (columns.length === 2) {
			var width = Math.max(columns[0], columns[1]);
			if (!pickerColumns[0].columnWidth) {
				pickerColumns[0].columnWidth = `${width * 16}px`;
			}
			if (!pickerColumns[1].columnWidth) {
				pickerColumns[1].columnWidth = `${width * 16}px`;
			}
		} else if (columns.length === 3) {
			var width = Math.max(columns[0], columns[2]);
			if (!pickerColumns[1].columnWidth) {
				pickerColumns[1].columnWidth = `${columns[1] * 16}px`;
			}
			if (!pickerColumns[0].columnWidth) {
				pickerColumns[0].columnWidth = `${width * 16}px`;
			}
			if (!pickerColumns[2].columnWidth) {
				pickerColumns[2].columnWidth = `${width * 16}px`;
			}
		} else if (columns.length > 3) {
			columns.forEach((col, i) => {
				if (!pickerColumns[i].columnWidth) {
					pickerColumns[i].columnWidth = `${col * 12}px`;
				}
			});
		}
	}
	private setValue(newData: any) {
		if (newData === null || newData === undefined) {
			this._value = '';
		} else {
			this._value = newData;
		}
	}
	private getValue(): string {
		return this._value;
	}
	private checkHasValue(inputValue: any) {
	}
	private updateText() {
		if(!this._value){
			return;
		}
		this._text = '';
		let values: string[] = this._value.toString().split(this.separator);
		this.multiPickerColumns.forEach((col, index) => {
			let option = col.options.find(option => option.value.toString() === values[index]);
			if (option) {
				this._text += `${option.text}`;
				if (index < this.multiPickerColumns.length - 1) {
					this._text += `${this.separator}`;
				}
			}
		});
		this._text = this._text.trim();
	}
	/**
	 * @input {boolean} 是否不可用，默认false
	 */
	@Input() get disabled() {
		return this._disabled;
	}
	set disabled(val: boolean) {
		this._disabled = val;
	}
	private writeValue(val: any) {
		this.setValue(val);
		this.updateText();
		this.checkHasValue(val);
	}
	private ngAfterContentInit() {
		// 格式化并更新值。
		this.updateText();
	}
	private registerOnChange(fn: Function): void {
		this._fn = fn;
		this.onChange = (val: any) => {
			this.setValue(this.convertObjectToString(val));
			this.updateText();
			this.checkHasValue(val);

			fn(this._value);
			this.onTouched();
		};
	}
	private registerOnTouched(fn: any) { this.onTouched = fn; }
	private onChange(val: any) {
		this.setValue(this.convertObjectToString(val));
		this.updateText();
		this.onTouched();
	}
	private onTouched() { }
	private ngOnDestroy() {
	}
	/**
	* 将选择器的ionChange事件转换为字符串。
	*/
	private convertObjectToString(newData) {
		let value = ``;
		this.multiPickerColumns.forEach((col, index) => {
			value += `${newData[col.name || index.toString()].value}`;
			if (index !== this.multiPickerColumns.length - 1) {
				value += this.separator;
			}
		});
		return value;
	}
}