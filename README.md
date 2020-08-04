# Google Apps Script SQL Abstract
Library helps working on Google Spreadsheet as on database. The query is not text but Java Script structure. First row in sheet is reserved for columns headers. 
Module loads data from sheet by method getValues() (returns objects ex. if value in cell is date, returns Date object, etc.). Inspiration was Perl module [SQL::Abstract](https://metacpan.org/pod/SQL::Abstract)

## SqlAbstract object
Pure object.
```
var sql = new SqlAbstract();
```
All sheets from selected spreadsheets will be available as tables (table name is sheet name).
```
var sql = new SqlAbstract({
  spreadsheets: [Spreadsheet]
});
```
Only selected tables from given spreadsheet will be tables.  
Options:  
- as - given table name for selected sheet
- serializer - data in each column could be write and read in different way, ex. as JSON  
```
var sql = new SqlAbstract({
  spreadsheets: [
    {
      url: SpreadsheetUrl,
      tables: {
        'Sheet Name': {
          as: 'Table name',
          serializer: {
            'Column 1': { // for JSON
              get: JSON.parse,
              set: JSON.stringify
            },
            'Column 2': { // for date
              get: function (x) {
                return Utilities.formatDate(x, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
              }
            }
          }
        }
      }
    }
  ]
});
```

### Methods

- createDB
  ```
  sql.createDB({
    spreadsheet: SpreadsheetUrl,
    tables: [
      {
        name: 'Sheet name',
        as: 'Table name',
        columns: ['C1', 'C2', 'C3']
      }
    ]
  })
  ```
- createTable
  ```
  sql.createTable({
    spreadsheet: SpreadsheetUrl,
    table: {
      name: 'Sheet name',
      as: 'Table name',
      columns: ['C1', 'C2', 'C3']
    }
  });
  ```
- dropTable
  ```
  sql.dropTable({table: 'Table1'});
  ```
- initTable
  ```
  sql.initTable({table: 'Table1', values: [[1, 'init', 1],[1, 'init', 1]]});
  ```
- select
  ```
  let out = sql.select({table: 'Table1', where:{'C2': 'init'}, orderBy: ['C3','C4'], groupBy: ['C1']})
  ```
  **Parameters:**
  - sheet - sheet handler
  - as - declared table name
  - table - name of table (sheet name or declared using 'as' table name)
  - where - where clause, Java Script structure (describled in next section) or function ex.:
    ```
    function(row){return row['K1'] == 'd15'}
    ```
  - groupBy - list of columns for grouping ex. ['K1','K2']. First groups by column 'K1' next 'K2' returns structure:
    ```
    {'K1_values': {'K2_values': [...rows...]}}
    ```
  - orderBy - sorts output by given list of columns ex. `{'K1': 'asc', 'K2': 'desc'}`
  - columns - limits colums, if not given returns all columns
  
  **Return**  
  Output is a list of row objects.

  **Row object methods:**
  - get([columnName]) - when column name is given, returns data from given column in row. Otherwise returns all row as hash, where keys are columns headers.
  - set({columnName: value}) - set value for given columns. You can set more then one value.
  - values() - returns row as hash, where keys are columns headers (the same as get())

  **Row object properties:**
  - data - row as array
  - row - row as array (the same as data)
  - rowNr - number of current row in sheet (started from 1)
  - id - number of current row in output array (started from 0)
  - columnIdByName - sheet headers mapping
  - headers: sheet headers as array
  - sheet: sheet handler

- insert
  ```
  sql.insert({table: 'Table1', values: {'C1': 1, 'C2': 'insert', 'C3': 2}})

  sql.insert({table: 'Update', values:[{'K1': 'a', 'K2': 'Null'},{'K1': 'b', 'K2': 'Null'}]});

  sql.insert({table: 'Table1', values: [[1, 'insert multiple', 3],[1, 'insert multiple', 3]]});
  ```
- update
  ```
      sql.update({table: 'Update', where:{'K1': 'a'}, set:{'K2': 'Test1'}});
  ```
- updateRow
  ```
      sql.updateRow({table: 'Update', rowNr: 4, values: {'K2': 'updateRow'}})
  ```
- getTable
  ```
    var table = sql.getTable({table: 'Update'});

    table.sheet.getName();
  ```
  
### Where clause
1. Simple equate.  
  Query: `K2 = 15 AND K3 = 'c'`  
  Where: `{'K2': 15, 'K3': 'c'}`
2. Operators: '==', '!=', '>’, ‘<’, ‘>=’, ‘<=’, ‘~’.  
    - '>='  
    Query: `K2 >= 12`  
    Where: `{'K2': {'>=': 12}}`  
    - ‘!=’  
    Query: `K2 <> 12`  
    Where: `{'K2': {'!=': 12}}`  
    - ‘~’  
    Query: `K2 LIKE '%Test%'`  
    Where: `{'K5': {'~': 'Test'}}`  
3. Value in range.  
  Query: `K3 IN ('a','c')`  
  Where: `{'K3': ['a','c']}`  
4. Value not in range.  
  Query: `K3 NOT IN ('a','c')`  
  Where: `{'K3': {'!=': ['a','c']}}`
5. Logical operators for single column.
    - AND  
      Query: `K2 > 11 AND K2 <= 14`  
      Where: `{'K2': {'>': 11, '<=': 14}}`
    - OR  
      Query: `K2 = 12 OR K2 > 14`  
      Where: `{'K2': [{'==': 12},{'>': 14}]}`
6. Logical operators in where clause.
    - AND  
      Query: `K2 >= 12 AND K3 IN ('b','c')`  
      Where: `{'K2': {'>=': 12}, 'K3': ['b', 'c']}`  
      or with '-and' operator  
      Where: `{'-and': {'K2': {'>=': 12}, 'K3': ['b', 'c']}}`
    - OR  
      Query: `K2 <= 11 OR K3 IN ('b','c')`  
      Where: `[{'K2': {'<=': 11}}, {'K3': ['b', 'c']}]`  
      or with '-or' operator  
      Where: `{'-or': {'K2': {'<=': 11}, 'K3': ['b', 'c']}}`  
    - Mixed  
      Query: `K2 < 13 OR (K3 IN ('b','c') AND K4 > 7)`  
      Where: `[{'K2': {'<': 13}}, {'K3': ['b', 'c'], 'K4': {'>': 7}}}]`  
      or  
      Where: `{'-or': {'K2': {'<': 13}, '-and': {'K3': ['b', 'c'], 'K4': {'>': 7}}}}`
    - Mixed AND with OR inside  
      Query: `K1 = 1 AND (K2 = 1 OR K3 = 1)`  
      Where: `{'K1': 1, '-or': {'K2': 1, 'K3': 1}}`
7. Regular expressions (mysql LIKE statement).  
  Query: `K2 LIKE '%Test%'`  
  Where (given regexp): `{'K5': /Test/}`  
  Where (text is converted to regexp): `{'K5': ‘Test’}`
8. Function as condition.  
  Query: `K2 > 11 AND K2 <= 14`  
  Where: `{'K2': function(x){return x > 11 && x <= 14}}`

### Cache
Second and next select from the same table gets data from cache, so it's faster.

## Single functions
1. selectData  
    Returns selected rows as array of objects.  
    `selectData(sheet, where, [groupBy], [orderBy], [columns])`
2. selectDataRows  
    Returns selected rows as two dimensional array.  
    `selectDataRows(sheet, where, [groupBy], [orderBy], [columns])`
3. updateRow  
    Updates values for selected columns in given row number (started from 1).  
    `updateRow(sheet, 2, {'K2': 'x', 'K6': 'y'})`  
4. appendRow  
    Adds given data for selected columns as a new row.  
    `appendRow(sheet, {'K1': 9, 'K2': 'x', 'K6': 'a'})`

## Duplicated header name handling
When in columns headers there is duplicated column name, it's name should be called with adding it's occurrence number after the name ex.:  
Headers: `'K1', 'K2', 'K3', 'K2', 'K2'`.  
Second 'K2' is called 'K2_2', third 'K2_3' and so on.  
Ex. the where clause, searching on second column `'K2': {'K2_2': 10}`

## Performance
Depends on Google Script environment performance. They vary depending on the time of run. Ex. measured times (table with 10000 rows):  
- getValues: 3549ms  
  ```
  var testSheet = ss.getSheetByName('Big Table');
  testSheet.getDataRange().getValues();
  ```
- selectData without condition: 3211ms
  ```
  var out = selectData(testSheet);
  ```
- selectData with condition: 4528ms
  ```
  var out = selectData(testSheet, {'K1': 'Banana'});
  ```
  
## Example
More examples there are in file Tests.gs.  
  
Example sheet  
<table>
  <thead>
    <tr>
      <th>K1</th>
      <th>K2</th>
      <th>K3</th>
      <th>K4</th>
      <th>K5</th>
      <th>K6</th>
      <th>K3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>10</td>
      <td>a</td>
      <td>1</td>
      <td>a</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>2</td>
      <td>11</td>
      <td>b</td>
      <td>5</td>
      <td>aTest</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>3</td>
      <td>12</td>
      <td>b</td>
      <td>3</td>
      <td>a</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>4</td>
      <td>13</td>
      <td>a</td>
      <td>7</td>
      <td>abaTestasg</td>
      <td>2</td>
      <td>10</td>
    </tr>
    <tr>
      <td>5</td>
      <td>14</td>
      <td>a</td>
      <td>7</td>
      <td>a</td>
      <td>1</td>
      <td>1</td>
    </tr>
    <tr>
      <td>6</td>
      <td>15</td>
      <td>c</td>
      <td>9</td>
      <td>a</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>7</td>
      <td>16</td>
      <td>c</td>
      <td>2</td>
      <td>a</td>
      <td>0</td>
      <td>1</td>
    </tr>
  </tbody>
</table>

```
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sql = new SqlAbstract({spreadsheets: [ss]});
// table is sheet name
var out = sql.select({table: 'Sheet1', where: [{'K1': '2'}, {'K2': {‘>’: 14}, 'K3': ‘c’}]});

for (var m in out){
  Logger.log(m);
  // Get value for column name ‘K1’
  Logger.log(out[m].get(‘K1’));
  // Set value in column name ‘K3’
  out[m].set({‘K3’: 5});
}
```
or   
```
var ss = SpreadsheetApp.getActiveSpreadsheet();
var sheet = ss.getSheetByName('Data');
var out = selectData(sheet, [{'K1': '2'}, {'K2': {‘>’: 14}, 'K3': ‘c’}]);

for (var m in out){
  Logger.log(m);
  // Get value for column name ‘K1’
  Logger.log(out[m].get(‘K1’));
  // Set value in column name ‘K3’
  out[m].set({‘K3’: 5});
}
```
