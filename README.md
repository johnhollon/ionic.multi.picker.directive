
# 底部滚轮选择器指令（属性型指令）

## 1、使用方法

### 1.1 导入指令
指令仅需声明。
```Typescript
import { MultiPickerDirective } from '../directives/multi-picker';

@NgModule({
  declarations: [
    MyApp,
	...
	MultiPickerDirective,
	...
  ],
  ...
})
export class AppModule {}
```

### 1.2 在你的组件中初始化列定义。

#### 1.2.1 简单列模型。
以下是简单列模型。只有text和value两个属性。
```typescript
constructor() {
  this.simpleColumns = [
	// 按照在数组中的索引，这是第1列。
    {
      name: 'col1',
      options: [
        { text: '1', value: '1' },
        { text: '2', value: '2' },
        { text: '3', value: '3' }
      ]
    },
	// 按照在数组中的索引，这是第2列。
	{
      name: 'col2',
      options: [
        { text: '1-1', value: '1-1' },
        { text: '1-2', value: '1-2' },
        { text: '2-1', value: '2-1' },
        { text: '2-2', value: '2-2' },
        { text: '3-1', value: '3-1' }
      ]
    },
	// 按照在数组中的索引，这是第3列。
	{
      name: 'col3',
      options: [
        { text: '1-1-1', value: '1-1-1' },
        { text: '1-1-2', value: '1-1-2' },
        { text: '1-2-1', value: '1-2-1' },
        { text: '1-2-2', value: '1-2-2' },
        { text: '2-1-1', value: '2-1-1' },
        { text: '2-1-2', value: '2-1-2' },
        { text: '2-2-1', value: '2-2-1' },
        { text: '2-2-2', value: '2-2-2' },
        { text: '3-1-1', value: '3-1-1' },
        { text: '3-1-2', value: '3-1-2' }
      ]
    }
  ];
}
```

#### 1.2.2 复杂列模型。
以下是复杂列模型。除text、value两个属性外，还有parentVal列。

```typescript
  this.dependentColumns = [
    {
      options: [
        { text: '1', value: '1' },
        { text: '2', value: '2' },
        { text: '3', value: '3' }
      ]
    },{
      options: [
        { text: '1-1', value: '1-1', parentVal: '1' },
        { text: '1-2', value: '1-2', parentVal: '1' },
        { text: '2-1', value: '2-1', parentVal: '2' },
        { text: '2-2', value: '2-2', parentVal: '2' },
        { text: '3-1', value: '3-1', parentVal: '3' }
      ]
    }];
```

### 1.3 在模板中使用指令。

```html
    <div [multi-picker]="dependentColumns"></div>
```

### 1.4 列值分隔符

如果使用多列选择器（multi-picker属性对应的数组有多个元素），则最终值的每一列部分以分隔符分隔。
分隔符默认为空格。

### 1.5 父列

如果你使用了复杂列模型，则列之间有父子关系，实现联动。
默认情况下，按照从左到右的顺序确定父子关系，左侧的级别高于右侧。
也可以使用属性parentCol，确定某列的父级列。如：

```
    this.parentColumns = [
      {
        name: 'child',
        parentCol: 'parent',
        options: [
          { text: '1-1-1', value: '1-1-1', parentVal: '1-1' },
          { text: '1-1-2', value: '1-1-2', parentVal: '1-1' },
          { text: '1-2-1', value: '1-2-1', parentVal: '1-2' },
          { text: '1-2-2', value: '1-2-2', parentVal: '1-2' },
          { text: '2-1-1', value: '2-1-1', parentVal: '2-1' },
          { text: '2-1-2', value: '2-1-2', parentVal: '2-1' },
          { text: '2-2-1', value: '2-2-1', parentVal: '2-2' },
          { text: '2-2-2', value: '2-2-2', parentVal: '2-2' }
        ]
      },{
        name: 'parent',
        parentCol: 'ancestor',
        options: [
          { text: '1-1', value: '1-1', parentVal: '1' },
          { text: '1-2', value: '1-2', parentVal: '1' },
          { text: '2-1', value: '2-1', parentVal: '2' },
          { text: '2-2', value: '2-2', parentVal: '2' },
        ]
      },{
        name: 'ancestor',
        options: [
          { text: '1', value: '1' },
          { text: '2', value: '2' }
        ]
      }
    ];
```

## 2、属性
| 属性 | 描述 | 类型 | 可选值 | 默认值|
|-----------|-------------|------|---------|--------|
|multi-picker | ***必需*** 列定义 | MultiPickerColumn数组 | - | - |
|mp-cancel-text| 选择器取消按钮文字 | string | - | 取消 |
|mp-done-text| 选择器确认按钮文字 | string | - | 确认 |
|mp-separator|列值分隔符| String | - | 空格 |
|mp-change|选择器值发生变化事件 | EventEmitter | - |  |
|mp-cancel|选择器点击取消按钮的事件 | EventEmitter | - | |
|mp-cssClass|选择器样式类 | string | - | mp-picker |

## 3、MultiPickerColumn

| 属性 | 描述 | 类型 | 可选值 | 默认值|
|-----------|-------------|------|---------|--------|
|options| **必需**, 列设置 | MultiPickerOption数组 | - | - |
|name| 列名 | String | - | 从0开始的索引号 |
|parentCol|父列的列名|String| - |上1列|
|alias|父列的别名，若通过parentCol未找到父列，则继续通过alias寻找父列|String| - | - |
|columnWidth|列宽，应以px或%结尾|String|-|-|

## 4、MultiPickerOption

| 属性 | 描述 | 类型 | 可选值 | 默认值|
|-----------|-------------|------|---------|--------|
|text| **必需**, 显示的文字|String|-|-|
|value|**必需**, 值|String|-|-|
|parentVal|父级值|String|-|-|
|disabled|是否不可选| Boolean|-| false|

## 5、使用中国地区数据的例子

```typescript

...
import cities from '../assets/datas/chinese-cities.json';
...

private cityColumns: any[];
constructor() {
	this.cityColumns = cities;
}

```

```html

	<div 
		[multi-picker]="cityColumns" 
		mp-cancel-text="取消" 
		mp-done-text="确认" 
		mp-separator=" " 
		mp-cssClass="mp-picker"
		(mp-change)="change($event)" 
		(mp-cancel)="cancel($event)">DIV中的内容</div>

```

## 6、样式

通过 `mp-cssClass` 属性赋予样式类。修改样式类：

```css
.mp-picker{
	.picker-col{
		.picker-opt{
			height: 40px;
			font-size: 12px;
			line-height: 40px;
		}
	}
}

```

"# ionic.multi.picker.directive" 
"# ionic.multi.picker.directive" 
