
function runAllTests(){
  var tests = [
    test_checkLogicGroups,
    test_extractColumnsFromWhere,
    test_selectData,
    test_updateRow,
    test_appendRow,
    test_getColumnIdByName,
    test_hashify,
    test_groupedDataMap,
    
    test_SqlAbstract_insert,
    test_SqlAbstract_update,
    test_SqlAbstract_options,
    test_serializer,
    test_select_serializer,
    test_select_serializer,
    
    test_dates,
    
//    test_performance,
//    test_SqlAbstract_performance
  ];

  for (var n in tests){
    runTest(tests[n]);
  }
  
  Logger.log('All Tests OK')
  return true;
}

function runTest(func){
  try {
    return func();
  } catch(e) {
    var name = func.name;
    var out = Utilities.formatString("Failed: '%s'", name);
    Logger.log(out);
    Logger.log(e);
    throw(out);
  }
}

var ss;
var ssUrl = createTestSpreadsheet();
Logger.log("Test spreadsheet: %s", ssUrl);

function createTestSpreadsheet() {
  var testFileId;

  // var files = DriveApp.getFilesByName('SQL Abstract - TEST');
  // while (files.hasNext()) {
  //   var file = files.next();
  //   testFileId = file.getId();
  // }
  
  if (testFileId){
    ss = SpreadsheetApp.openById(testFileId);
    initTestSpreadsheet(ss);
  }
  else {
    ss = SpreadsheetApp.create('SQL Abstract - TEST');
    initTestSpreadsheet(ss);
  }
  
  return ss.getUrl();
}


function removeTestSpreadsheet() {
  var files = DriveApp.getFilesByName('SQL Abstract - TEST');
  
  while (files.hasNext()) {
    var file = files.next();
    DriveApp.removeFile(file)
    break;
  }
}


function initTestSpreadsheet(ss){
  if (!ss.getSheetByName('testSelectData')){
    ss.insertSheet('testSelectData');
  }
  
  if (!ss.getSheetByName('Big Table')){
    var sheet = ss.insertSheet('Big Table');
    
    var date = new Date();
    
    var data = [];
    
    var header = [];
    for (var n = 1; n <= 26; n++){
      header.push('K' + n);
    }
    
    var row = ['Banana', date, 3.1415];
    for (var n = 1; n <= 23; n++){
      row.push(n);
    }

    data.push(header);
    
    var row1 = ['a', 'Test', 'Banana'];
    while (row1.length < 26){
      row1.push('Banana');
    }
    data.push(row1);
    
    var row2 = ['time', new Date(), 'Banana'];
    while (row2.length < 26){
      row2.push('Banana');
    }
    
    data.push(row2);
    
    for (var n = 1; n <= 10000; n++){
      data.push(row);
    }
    
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
}


// --- TESTS ---

function test_checkLogicGroups(){
  var testCases = [
    {
      name: '1 -or',
      args: {
        a1: {'-or': {'K1': 1, 'K2': 1}},
        a2: {'K1': true, 'K2': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '2 -or',
      args: {
        a1: {'-or': {'K1': 1, 'K2': 1}},
        a2: {'K1': false, 'K2': false},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '3 -or',
      args: {
        a1: {'-or': {'K1': 1, 'K2': 1}},
        a2: {'K1': true, 'K2': false},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '4 -or',
      args: {
        a1: {'-or': {'K1': 1, 'K2': 1}},
        a2: {'K1': false, 'K2': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '1 -and',
      args: {
        a1: {'-and': {'K1': 1, 'K2': 1}},
        a2: {'K1': true, 'K2': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '2 -and',
      args: {
        a1: {'-and': {'K1': 1, 'K2': 1}},
        a2: {'K1': false, 'K2': false},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '3 -and',
      args: {
        a1: {'-and': {'K1': 1, 'K2': 1}},
        a2: {'K1': false, 'K2': true},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '4 -and',
      args: {
        a1: {'-and': {'K1': 1, 'K2': 1}},
        a2: {'K1': true, 'K2': false},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '1 mixed',
      args: {
        a1: {'K1': 1, '-and': {'K2': 1, 'K3': 1}},
        a2: {'K1': true, 'K2': true, 'K3': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '2 mixed',
      args: {
        a1: {'K1': 1, '-and': {'K2': 1, 'K3': 1}},
        a2: {'K1': true, 'K2': false, 'K3': true},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '3 mixed',
      args: {
        a1: {'K1': 1, '-and': {'K2': 1, 'K3': 1}},
        a2: {'K1': false, 'K2': true, 'K3': true},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '4 mixed',
      args: {
        a1: {'-or': {'-and': {'K1': 1, 'K2': 1}, '-and': {'K3': 1, 'K4': 1}}},
        a2: {'K1': false, 'K2': true, 'K3': true, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '5 mixed',
      args: {
        a1: {'-or': {'-and': {'K1': 1, 'K2': 1}, '-and': {'K3': 1, 'K4': 1}}},
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '5 mixed - simple OR',
      args: {
        a1: [{'K1': 1, 'K2': 1}, {'K3': 1, 'K4': 1}],
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: false
    },
    {
      name: '6 mixed',
      args: {
        a1: {'-or': {'-and': {'K1': 1, 'K2': 1}, '-or': {'K3': 1, 'K4': 1}}},
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '6 mixed - simple OR',
      args: {
        a1: [{'K1': 1, 'K2': 1}, [{'K3': 1}, {'K4': 1}]],
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '6 mixed - simple OR 2',
      args: {
        a1: [[{'K4': 1}, {'K3': 1}], {'K1': 1, 'K2': 1}],
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '7 mixed',
      args: {
        a1: {'-or': {'-and': {'K1': 1, 'K2': 1}, 'K3': 1, 'K4': 1}},
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '7 mixed - simple OR',
      args: {
        a1: [{'K1': 1, 'K2': 1}, {'K3': 1}, {'K4': 1}],
        a2: {'K1': false, 'K2': true, 'K3': false, 'K4': true},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '8 mixed',
      args: {
        a1: {'-or': {'-and': {'K1': 1, 'K2': 1}, '-or': {'-and': {'K3': 1, 'K4': 1}, 'K5': 1}}},
        a2: {'K1': false, 'K2': true, 'K3': true, 'K4': true, 'K5': false},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '8 mixed (simple)',
      args: {
        a1: [{'K1': 1, 'K2': 1}, [{'K3': 1, 'K4': 1}, {'K5': 1}]],
        a2: {'K1': false, 'K2': true, 'K3': true, 'K4': true, 'K5': false},
        a3: '-and'
      },
      expect: true
    },
    {
      name: '9 mixed',
      args: {
        a1: {'K1': 1, '-or': {'K2': 1, 'K3': 1}},
        a2: {'K1': true, 'K2': false, 'K3': true},
        a3: '-and'
      },
      expect: true
    }
  ];
  
  var counter = 0;
  
  for (var n in testCases){
    //Logger.log('> ' + testCases[n].name + '');
    var args = testCases[n].args;
    var result = checkLogicGroups_(args.a1, args.a2);
    var cmp = result == testCases[n].expect;
    //Logger.log('  ' + cmp ? 'OK' : 'NOT OK');
    if (!cmp){
      Logger.log('> ' + testCases[n].name + '');
      Logger.log('  ' + 'NOT OK');
      throw '"' + testCases[n].name + '" - NOT OK';
      break;
    }

    counter++;
  }

  if (counter == testCases.length){
    Logger.log('');
    Logger.log('All OK');
    
    return true;
  }
  
  return false;
}


function test_extractColumnsFromWhere(){
  var where = extractColumnsFromWhere_({'K0': 1, '-or': {'K1': 'd12', '-and': {'K2': 4, 'K3': {'>': 5}}}});
  //Logger.log(where);
  var expect = {'K0': 1, 'K1': 'd12', 'K2': 4, 'K3': {'>': 5}};
  
  for (var key in expect){
    if (JSON.stringify(expect[key]) !== JSON.stringify(where[key])){
      Logger.log('result: ');
      Logger.log(where[key]);
      Logger.log('expect: ');
      Logger.log(expect[key]);
      Logger.log('NOT OK');
      throw 'NOT OK';
      return false;
    }
  }
  
  if (Object.keys(expect).length != 4){
    Logger.log('NOT OK');
    throw 'NOT OK';
    return false;
  }
  
  Logger.log('All OK');
  return true;
}


function test_selectData(){
  var testSheetName = 'testSelectData';
  var testSheet = ss.getSheetByName(testSheetName);
  
  if (!testSheet){
    testSheet = ss.insertSheet(testSheetName);
  }
  
  Logger.log('Initializing ' + testSheet.getName());
  
  testSheet.clear();
  
  // Test data
  testSheet.appendRow(['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K3', 'K8', 'K7']);
  testSheet.appendRow([1, 10, 'a', 1, 'a', 0, 1, 1.2]);
  testSheet.appendRow([2, 11, 'b', 5, 'aTest', 0, 1, 1.8]);
  testSheet.appendRow([3, 12, 'b', 3, 'a', 0, 1, 1.5]);
  testSheet.appendRow([4, 13, 'a', 7, 'abaTestasg', 2, 10, 1.5]);
  testSheet.appendRow([5, 14, 'a', 7, 'a', 1, 1, 1.3]);
  testSheet.appendRow([6, 15, 'c', 9, 'a', 0, 1, 1.2]);
  testSheet.appendRow([7, 16, 'c', 2, 'a', 0, 1, '1.4', 1]);
  
  // Test: get data as array
  (function(){
    var out = selectDataRows(testSheet, {}, [], ['K4']);

    if (! isArray(out[0])){
      throw "Output row is not Array"; 
    }

    if (out[1][0] != 7){
      throw "Sorting simple output failed!"; 
    }
  })();
  

  // Test: get data as array - selected columns only
  (function(){
    var out = selectDataRows(testSheet, {}, [], [], ['K2','K1']);
    if (! isArray(out[0])){
      throw "Output row is not Array"; 
    }

    if (out[0].length != 2 || out[0][0] != 10 || out[0][1] != 1){
      throw "Selecting fields failed!"; 
    }
  })();
  
  
  // Test: orderBy - asc
  (function(){
    var out = selectData(testSheet, {}, [], {'K4': 'asc', 'K6': 'asc'});
    var expect = [1,7,3,2,5,4,6];
    for (var n in out){
      var rowId = out[n].get('K1')
      if (rowId != expect[n]){
        Logger.log('Output: ' + rowId);
        Logger.log('Expect: ' + expect[n]);
        throw "Sorting failed!"; 
      }
    }
  })();
  
  
  // Test: orderBy - desc
  (function(){
    var out = selectData(testSheet, {}, [], {'K4': 'asc', 'K6': 'desc'});
    var expect = [1,7,3,2,4,5,6];
    for (var n in out){
      var rowId = out[n].get('K1')
      if (rowId != expect[n]){
        Logger.log('Output: ' + rowId);
        Logger.log('Expect: ' + expect[n]);
        throw "Sorting failed!"; 
      }
    }
  })();
  
  
  // Test: groupBy with orderBy
  (function(){
    var out = selectData(testSheet, {}, ['K3'], {'K4': 'asc'});
    if (out['a'].length != 3 || out['b'].length != 2 || out['c'].length != 2){
      throw "GroupBy failed!"; 
    }
    
    for (var key in out){
      for (var n in out[key]){
        //Logger.log(out[key][n].get());
      }
    }
    
    if (out['a'][0].get('K4') != 1 || out['b'][0].get('K4') != 3 || out['c'][0].get('K4') != 2){
      throw "GroupBy with orderBy failed!"; 
    }
  })();
  
  
  // Test: duplicated columns mapping
  (function(){
    var out = selectData(testSheet, {'K3_2': 10});
    if (out[0].get('K1') != 4){
      throw "Wrong duplicated columns mapping!"; 
    }
  })();
  

  // Test: where clause
  
  var testCases = [
    //function(row){return row['K1'] == 'd15'}
    {
      name: 'Function',
      args: {
        a1: testSheet,
        a2: function(row){return row['K3'] == 'a'},
      },
      expect: [1,4,5]
    },
    {
      name: 'All',
      args: {
        a1: testSheet,
        a2: {},
      },
      expect: [1,2,3,4,5,6,7]
    },
    {
      name: 'Simple and',// K2 = 15 AND K3 = 'c'
      args: {
        a1: testSheet,
        a2: {'K2': 15, 'K3': 'c'},
      },
      expect: [6]
    },
    {
      name: 'Operator ==',// K2 == 12
      args: {
        a1: testSheet,
        a2: {'K2': {'==': 12}},
      },
      expect: [3]
    },
    {
      name: 'Operator !=', // K2 != 12
      args: {
        a1: testSheet,
        a2: {'K2': {'!=': 12}},
      },
      expect: [1,2,4,5,6,7]
    },
    {
      name: 'Operator >', // K2 > 12
      args: {
        a1: testSheet,
        a2: {'K2': {'>': 12}},
      },
      expect: [4,5,6,7]
    },
    {
      name: 'Operator >=', // K2 >= 12
      args: {
        a1: testSheet,
        a2: {'K2': {'>=': 12}},
      },
      expect: [3,4,5,6,7]
    },
    {
      name: 'Operator <', // K2 < 12
      args: {
        a1: testSheet,
        a2: {'K2': {'<': 12}},
      },
      expect: [1,2]
    },
    {
      name: 'Operator <=', // K2 <= 12
      args: {
        a1: testSheet,
        a2: {'K2': {'<=': 12}},
      },
      expect: [1,2,3]
    },
    {
      name: 'Operator ~ with RegExp', // K2 like 'Test'
      args: {
        a1: testSheet,
        a2: {'K5': {'~': /Test/}},
      },
      expect: [2,4]
    },
    {
      name: 'Operator ~ with String', // K2 like 'Test'
      args: {
        a1: testSheet,
        a2: {'K5': {'~': 'Test'}},
      },
      expect: [2,4]
    },
    {
      name: 'Value IN range',// K3 IN ('a','c')
      args: {
        a1: testSheet,
        a2: {'K3': ['a','c']},
      },
      expect: [1,4,5,6,7]
    },
    {
      name: 'Value NOT IN range',// K3 NOT IN ('a','c')
      args: {
        a1: testSheet,
        a2: {'K3': {'!=': ['a','c']}},
      },
      expect: [2,3]
    },
    {
      name: 'Two conditions for one column - OR',// K2 = 12 OR K2 > 14
      args: {
        a1: testSheet,
        a2: {'K2': [{'==': 12},{'>': 14}]},
      },
      expect: [3,6,7]
    },
    // DEPRECIATED
    //{
    //  name: 'Two conditions for one column - AND',// K2 = 12 OR K2 > 14
    //  args: {
    //    a1: testSheet,
    //    a2: {'K2': {'&&': [{'>': 11},{'<=': 14}]}},
    //  },
    //  expect: [3,4,5]
    //},
    {
      name: 'Two conditions for one column - HASH AND',// K2 > 11 AND K2 <= 14
      args: {
        a1: testSheet,
        a2: {'K2': {'>': 11, '<=': 14}},
      },
      expect: [3,4,5]
    },
    {
      name: 'Simple and with custom comparison',// K2 >= 12 AND K3 IN ('b','c')
      args: {
        a1: testSheet,
        a2: {'K2': {'>=': 12}, 'K3': ['b', 'c']},
      },
      expect: [3,6,7]
    },
    {
      name: 'Logical operator: -and',// K2 >= 12 AND K3 IN ('b','c')
      args: {
        a1: testSheet,
        a2: {'-and': {'K2': {'>=': 12}, 'K3': ['b', 'c']}},
      },
      expect: [3,6,7]
    },
    {
      name: 'Logical operator: -or',// K2 <= 11 OR K3 IN ('b','c')
      args: {
        a1: testSheet,
        a2: {'-or': {'K2': {'<=': 11}, 'K3': ['b', 'c']}},
      },
      expect: [1,2,3,6,7]
    },
    {
      name: 'Logical operator: -or (simple)',// K2 <= 11 OR K3 IN ('b','c')
      args: {
        a1: testSheet,
        a2: [{'K2': {'<=': 11}}, {'K3': ['b', 'c']}],
      },
      expect: [1,2,3,6,7]
    },
    {
      name: 'Logical operator: mixed',// K2 < 13 OR (K3 IN ('b','c') AND K4 > 7)
      args: {
        a1: testSheet,
        a2: {'-or': {'K2': {'<': 13}, '-and': {'K3': ['b', 'c'], 'K4': {'>': 7}}}},
      },
      expect: [1,2,3,6]
    },
    {
      name: 'Logical operator: mixed (simple)',// K2 < 13 OR (K3 IN ('b','c') AND K4 > 7)
      args: {
        a1: testSheet,
        a2: [{'K2': {'<': 13}}, {'K3': ['b', 'c'], 'K4': {'>': 7}}],
      },
      expect: [1,2,3,6]
    },
    {
      name: 'Logical operator: mixed 2',// K2 < 13 AND (K3 IN ('b','c') OR K4 < 2)
      args: {
        a1: testSheet,
        a2: {'-and': {'K2': {'<': 13}, '-or': {'K3': ['b', 'c'], 'K4': {'<': 2}}}},
      },
      expect: [1,2,3]
    },
    {
      name: 'Logical operator: mixed 2 (simple)',// K2 < 13 AND (K3 IN ('b','c') OR K4 < 2)
      args: {
        a1: testSheet,
        //a2: {'-and': {'K2': {'<': 13}, '-or': {'K3': ['b', 'c'], 'K4': {'<': 2}}}},
        a2: {'K2': {'<': 13}, '-or': {'K3': ['b', 'c'], 'K4': {'<': 2}}},
      },
      expect: [1,2,3]
    },
    {
      name: 'RegExp',// K2 LIKE '%Test%'
      args: {
        a1: testSheet,
        a2: {'K5': /Test/},
      },
      expect: [2,4]
    },
    {
      name: 'Function',// K2 > 11 AND K2 <= 14
      args: {
        a1: testSheet,
        a2: {'K2': function(x){return x > 11 && x <= 14}},
      },
      expect: [3,4,5]
    },
    {
      name: 'NOT NULL',// K7 != '' - puste komórki w arkuszu są pustymi stringami ''
      args: {
        a1: testSheet,
        a2: {'K7': {'!=': ''}},
      },
      expect: [7]
    },
    {
      name: 'Floats',// K7 != '' - puste komórki w arkuszu są pustymi stringami ''
      args: {
        a1: testSheet,
        a2: {'K8': {'>': 1.2, '<': 1.7}},
      },
      expect: [3,4,5]
    }
  ];
  
  var counter = 0;
  
  for (var n in testCases){
    var test = testCases[n];
    //Logger.log('> ' + test.name + '');
    
    var args = test.args;
    var result = selectData(args.a1, args.a2);
    
    var ok = true;

    for (var n in result){
      if (test.expect.length){
        var i = test.expect.indexOf(Number(result[n].get('K1')));
        if (i == -1){
          ok = false;
          break;
        }
      }
      else {
        ok = false;
        break;
      }
    }
    
    if (!ok || test.expect.length != result.length){
      Logger.log('> ' + test.name + '');
      Logger.log('  ' + 'Result:');
      Logger.log('  ' + result.map(function(x){return Number(x.get('K1'));}));
      Logger.log('  ' + 'Expect:');
      Logger.log('  ' + test.expect);
      Logger.log('  ' + 'NOT OK');
      throw '"' + test.name + '" - NOT OK';
      break;
    }

    counter++;
  }

  if (counter != testCases.length){
    throw "Test Where failed!"; 
  }
  

  // Test: set value
  (function(){
    var out = selectData(testSheet, {'K1': 5});
    out[0].set({'K5': 'x', 'K6': 'y'});
    
    var row = testSheet.getRange(6, 1, 1, 6).getDisplayValues();
    var columnIds = [4,5];
    var expect = ['x','y'];

    for (var n in columnIds){
      var colNr = columnIds[n];
      if (row[0][colNr] != expect[n]){
        Logger.log('Output: ' + row[0][colNr]);
        Logger.log('Expect: ' + expect[n]);
        throw "Set data failed!"; 
      }
    }
  })();
  
  return false;
}


function test_updateRow(){
  var testSheet = ss.getSheetByName('testSelectData');
  
  if (!testSheet){
    testSheet = ss.insertSheet('testSelectData');
  }
  
  Logger.log('Initializing ' + testSheet.getName());
  
  testSheet.clear();
  
  // Test data
  testSheet.appendRow(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']);
  testSheet.appendRow([1, 10, 'a', 1, 'a', 0]);
  
  updateRow(testSheet, 1, {'K2': 'x', 'K6': 'y'});
  
  var row = testSheet.getRange(2, 1, 1, 6).getDisplayValues();
  var columnIds = [1,5];
  var expect = ['x','y'];
  
  for (var n in columnIds){
    var colNr = columnIds[n];
    if (row[0][colNr] != expect[n]){
      Logger.log('Output: ' + row[0][colNr]);
      Logger.log('Expect: ' + expect[n]);
      throw "Set data failed!"; 
    }
  }
}


function test_appendRow(){
  var testSheet = ss.getSheetByName('testSelectData');
  
  if (!testSheet){
    testSheet = ss.insertSheet('testSelectData');
  }
  
  Logger.log('Initializing ' + testSheet.getName());
  
  testSheet.clear();
  
  // Test data
  testSheet.appendRow(['K1', 'K2', 'K3', 'K4', 'K5', 'K6']);
  
  appendRow(testSheet, {'K1': 9, 'K2': 'x', 'K6': 'a'});
  
  var row = testSheet.getRange(2, 1, 1, 6).getDisplayValues();
  var columnIds = [0,1,2,3,4,5];
  var expect = ['9','x','','','','a'];
  
  for (var n in columnIds){
    var colNr = columnIds[n];
    if (row[0][colNr] != expect[n]){
      Logger.log('Output: ' + row[0][colNr]);
      Logger.log('Expect: ' + expect[n]);
      throw "Append row failed!"; 
    }
  }
  
  return true;
}


function test_getColumnIdByName(){
  var headers = ['K1','K2','K3','K2','K2'];
  var columnIdByName = getColumnIdByName(headers);
  
  var expect = {'K1': 0,'K2': 1,'K3': 2,'K2_2': 3,'K2_3': 4};
  
  for (var columnName in expect){
    if (expect[columnName] != columnIdByName[columnName]){
      throw "Incorrect columnIdByName!"; 
    }
  }
  
  return true;
}


function test_hashify(){
  var headers = ['K1','K2','K3','K2','K2'];
  var row = [1,2,3,4,5];
  var hash = hashify(row, headers);
  
  var expectKeys = ['K1','K2','K3','K2_2','K2_3'];
  
  for (var n in expectKeys){
    var key = expectKeys[n];
    if (hash[key] != row[n]){
      throw "Incorrect hash!"; 
    }
  }
  
  return true;
}


function test_groupedDataMap(){
  var data = {
    'a': {
      'b': [1,3,2],
      'c': [3,1,2,5],
    },
    'b': [3,1,2,5,6,7]
  };
  
  groupedDataMap(data, function(nod){nod.sort()});
  
  groupedDataMap(data, function(nod){
    //Logger.log(nod);
  });
  
  if (data['a']['b'][2] != 3 || data['a']['b'][0] != 1 || data['b'][0] != 1 || data['b'][5] != 7){
    throw "groupedDataMap failed!";  
  }
  return true;
}


function test_performance(){
  var testSheet = ss.getSheetByName('Big Table');

  console.time('getValues');
  testSheet.getDataRange().getValues();
  console.timeEnd('getValues');
  
  console.time('getDisplayValues');
  testSheet.getDataRange().getDisplayValues();
  console.timeEnd('getDisplayValues');
  
  console.time('select 1');
  var out = selectData(testSheet);
  console.timeEnd('select 1');
  
  console.time('select 2');
  var out = selectData(testSheet, {'K1': {'~':'Banana'}});
  console.timeEnd('select 2');
  
  console.time('select 3');
  var out = selectData(testSheet, {'K1': 'Banana'});
  console.timeEnd('select 3');
  
  console.time('values');
  Logger.log(out[0].values());
  console.timeEnd('values');
  
  return true;
}

function test_performance_benchmark(){
  for (var n = 0; n < 6; n++){
    test_performance();
//    Utilities.sleep(1000);
  }
}

// Test:
// - SqlAbstract create DB from spreadsheet
// - createDB: name
// - dropTable: table
// - initTable: table, multi values
// - insert: object, array
function test_SqlAbstract_insert() {
  var sql = new SqlAbstract({debug: true, spreadsheets: [ssUrl]});

  sql.dropTable({table: 'Table1'});
  
  sql.createDB({
    spreadsheet: ssUrl,
    tables: [
      {
        name: 'Table1',
        columns: ['C1', 'C2', 'C3'],
        serializer: {
          'C3': {
            set: function(x){return '_' + x;}
          },
        }
      }
    ]
  })
  
  var duplicatedTableDetected = false;
  try {
    var out = sql.createTable({
      spreadsheet: ssUrl,
      table: {
        name: 'Table1',
        columns: ['C1', 'C2', 'C3'],
      }
    });
    duplicatedTableDetected = !out;
  } catch(e){
    duplicatedTableDetected = true;
  }
  
  if (!duplicatedTableDetected) throw "Duplicated table name not detected!";
  
  // initTable
  
  console.time('init');
  sql.initTable({table: 'Table1', values: [[1, 'init', 1],[1, 'init', 1],[1, 'init', 1],[1, 'init', 1],[1, 'init', 1]]});
  console.timeEnd('init');
  
  // insert
  
  sql.insert({table: 'Table1', values: {'C1': 1, 'C2': 'insert', 'C3': 2}});
  
  console.time('insert multiple');
  sql.insert({table: 'Table1', values: [[1, 'insert multiple', 3],[1, 'insert multiple', 3],[1, 'insert multiple', 3],[1, 'insert multiple', 3],[1, 'insert multiple', 3]]});
  console.timeEnd('insert multiple');
  
  console.time('insert multiple object');
  sql.insert({table: 'Table1', values: [{'C1': 1, 'C2': 'insert multiple object', 'C3': 2},{'C1': 1, 'C2': 'insert multiple object', 'C3': 2}]});
  console.timeEnd('insert multiple object');
  
  if (sql.select({table: 'Table1', where:{'C2': 'init'}}).length != 5) throw "Init failed!";
  
  if (sql.select({table: 'Table1', where:{'C2': 'insert'}}).length != 1) throw "Insert failed!";
  
  if (sql.select({table: 'Table1', where:{'C2': 'insert multiple'}}).length != 5) throw "Insert multiple failed!";
  
  if (sql.select({table: 'Table1', where:{'C2': 'insert multiple object'}}).length != 2) throw "Insert multiple object failed!";
  
  // Checking
  
  var table = sql.getTable({table: 'Table1'});
  
  var sheetRows = structure2string(table.sheet.getDataRange().getDisplayValues());
  // Logger.log(sheetRows);
  var expect = '[[string_C1,string_C2,string_C3],[string_1,string_init,string_1],[string_1,string_init,string_1],[string_1,string_init,string_1],[string_1,string_init,string_1],[string_1,string_init,string_1],[string_1,string_insert,string__2],[string_1,string_insert multiple,string__3],[string_1,string_insert multiple,string__3],[string_1,string_insert multiple,string__3],[string_1,string_insert multiple,string__3],[string_1,string_insert multiple,string__3],[string_1,string_insert multiple object,string__2],[string_1,string_insert multiple object,string__2]]';

  if (sheetRows != expect) throw "Data in sheet not updated!";
  
//  sql.dropTable({table: 'Table1'});
}


// Test:
// - SqlAbstract create DB from spreadsheet
// - createDB: as
// - dropTable: table
// - insert: table, multi values
// - update: table, single, next update, multi update, checking if tmp data was updated, checking if data in sheet was updated
// - select: table
function test_SqlAbstract_update() {
  var testSheet = ss.getSheetByName('Big Table');
  
  var sql = new SqlAbstract({debug: true, spreadsheets:[ssUrl]});
  
  sql.dropTable({table: 'Test - update'});
  
  sql.createDB({
    spreadsheet: ssUrl,
    tables: [
      {
        name: 'Test - update',
        as: 'Update',
        columns: ['K1', 'K2']
      }
    ]
  })
  
  console.time('insert 1');
  sql.insert({table: 'Update', values:[
    {'K1': 'a', 'K2': 'Null'},
    {'K1': 'b', 'K2': 'Null'},
    {'K1': 'b', 'K2': 'Null'},
    {'K1': 'c', 'K2': 'Null'},
    ]});
  console.timeEnd('insert 1');
  
    
  // update
    
  console.time('update 1');
  var out = sql.update({table: 'Update', where:{'K1': 'a'}, set:{'K2': 'Test1'}});
  console.timeEnd('update 1');
  console.log('Rows:', out.length);
  
  if (out.length != 1) throw "Update 1 row not found!";
  
  if (sql.select({table: 'Update', where:{'K1': 'a'}})[0].get('K2') != 'Test1') throw "Update 1 value not changed!";
  
  console.time('update 2');
  var out = sql.update({table: 'Update', where:{'K1': 'a'}, set:{'K2': 'Test2'}});
  console.timeEnd('update 2');
  console.log('Rows:', out.length);
  
  if (out.length != 1) throw "Update 2 row not found!";
  
  if (sql.select({table: 'Update', where:{'K1': 'a'}})[0].get('K2') != 'Test2') throw "Update 2 value not changed!";

  console.time('update 3');
  var out = sql.update({table: 'Update', where:{'K1': 'b'}, set:{'K2': 'Test 3'}});
  console.timeEnd('update 3');
  console.log('Rows:', out.length);
  
  if (out.length != 2) throw "Update 3 rows not found!";
  
  // updateRow
  
  sql.updateRow({table: 'Update', rowNr: 4, values: {'K2': 'updateRow'}})
  
  if (sql.select({table: 'Update', where:{'K1': 'c'}})[0].get('K2') != 'updateRow') throw "Update row failed!";
  
  // Checking
  
  var table = sql.getTable({table: 'Update'});
  
  var sheetRows = structure2string(table.sheet.getDataRange().getDisplayValues());
  
  var expect = '[[string_K1,string_K2],[string_a,string_Test2],[string_b,string_Test 3],[string_b,string_Test 3],[string_c,string_updateRow]]';

  if (sheetRows != expect) throw "Data in sheet not updated!";
  
//  sql.dropTable({table: 'Update'});
}


function test_SqlAbstract_options() {
  var testSheet = ss.getSheetByName('Big Table');
  
  var sql = new SqlAbstract({debug: true});
  
  // sheet, as, table
  var out1 = sql.select({sheet: testSheet, as: 'table1', where:{'K1': {'~':'Banana'}}});
  var out2 = sql.select({table: 'table1', where:{'K1': {'~':'Banana'}}});
  if (out1.length != out2.length) throw "Not the same outputs 1!";
  
  //sheet, table
  var out3 = sql.select({sheet: testSheet, where:{'K1': {'~':'Banana'}}});
  var out4 = sql.select({table: 'Big Table', where:{'K1': {'~':'Banana'}}});
  if (out3.length != out4.length) throw "Not the same outputs 2!";
  
  //sheets
  var sql2 = new SqlAbstract({debug: true, sheets:[testSheet]});
  var out5 = sql2.select({table: 'Big Table', where:{'K1': {'~':'Banana'}}});
  
  if (out1.length != out5.length) throw "Not the same outputs 3!";
}


function test_serializer() {
  var sql = new SqlAbstract({debug: true, spreadsheets:[ssUrl]});
  sql.dropTable({table: 'sheet - TestSerializers'});
  
  sql.createTable({
    spreadsheet: ssUrl,
    table: {
      name: 'sheet - TestSerializers',
      as: 'TestSerializers',
      columns: ['C1', 'C2', 'Time'],
      serializer: {
        'C2': {
          get: JSON.parse,
          set: JSON.stringify
        },
      }
    }
  });
  
  sql.insert({table: 'TestSerializers', values: {'C1': 1, 'C2': '', 'Time': ''}});
  
  var out = sql.select({table: 'TestSerializers', where:{'C1': 1}});

  //set
  out[0].set({'C2': {a:[1,2,3]}, 'Time': new Date()});
  
  var sql2 = new SqlAbstract({debug: true, spreadsheets: [
    {
      url: ssUrl,
      tables: {
        'sheet - TestSerializers': {
          as: 'TestSerializers',
          serializer: {
            'C2': {
              get: JSON.parse,
              set: JSON.stringify
            },
            'Time': {
              get: function(x){return Utilities.formatDate(x, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")}
            }
          }
        }
      }
    }
  ]});
  
  out2 = sql2.select({table: 'TestSerializers', where:{'C1': 1}});
  
  try {
    out2[0].get('C2').a;
  } catch (e){
    throw "JSON Serializer failed!"
  }
  
  var time = out2[0].get('Time');
  Logger.log(time);
  if (!/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/.test(time)) throw "Time serializer failed!";
  
  sql.dropTable({table: 'TestSerializers'});
}


function test_select_serializer() {
  var testSheet = ss.getSheetByName('Big Table');

  var out = select({
    sheet:testSheet,
    where:{'K1': 'time'},
    serializer: {
      'K2': {
        get: function(x){return Utilities.formatDate(x, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")}
      }
    }
  });
  
  var time = out[0].get('K2');
  Logger.log(time);
  if (!/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/.test(time)) throw "Time serializer failed!";
  
  return true;
}


function test_SqlAbstract_performance(){
  var testSheet = ss.getSheetByName('Big Table');
  
  var sql = new SqlAbstract({debug: true});
  console.time('select 1');
  var out1 = sql.select({sheet: testSheet, where:{'K1': {'~':'Banana'}}});
  console.timeEnd('select 1');

  var val1 = out1[1].get('K3');
  
  var uuid = Utilities.getUuid();

  out1[1].set({'K3': uuid});
  
  console.time('select 2');
  var out2 = sql.select({sheet: testSheet, where:{'K1': {'~':'Banana'}}});
  console.timeEnd('select 2');

  var val2 = out2[1].get('K3');
  
  if (val2 !== uuid){
    throw "Wrong get and set in data SqlAbstract object!"; 
  }
  
  
  var sql2 = new SqlAbstract();
  console.time('select 3');
  var out3 = sql2.select({sheet: testSheet, where:{'K1': {'~':'Banana'}}});
  console.timeEnd('select 3');
  
  console.time('get 3');
  var val3 = out3[1].get('K3');
  console.timeEnd('get 3');
  
  if (val3 !== uuid){
    throw "Wrong get and set in sheet!"; 
  }
  
  return true;
}


function test_dates() {
  var sql = new SqlAbstract({debug: true, spreadsheets:[ssUrl]});
  
  sql.dropTable({table: 'Test - dates'});
  
  sql.createDB({
    spreadsheet: ssUrl,
    tables: [
      {
        name: 'Test - dates',
        as: 'Dates',
        columns: ['K1', 'K2', 'K3']
      }
    ]
  })
  
  var date1 = new Date(2020,6,10,10,15,25);
  var date2 = new Date(2020,6,20,10,15,25);
  var date3 = new Date(2020,6,30,10,15,25);
  
  sql.insert({table: 'Dates', values:[
    {'K1': 'a', 'K2': date1},
    {'K1': 'b', 'K2': date2},
    {'K1': 'c', 'K2': date3}
  ]});
  
  var select = sql.select({table: 'Dates', where:{'K2': date1}});
  if (select.length != 1 || select[0].get('K1') != 'a') throw "Select date 1 object failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': {'==': date1}}});
  if (select.length != 1 || select[0].get('K1') != 'a') throw "Select date 1 object condition failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': '2020-07-10 10:15:25'}});
  if (select.length != 1 || select[0].get('K1') != 'a') throw "Select date 1 string failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': {'==': '2020-07-10 10:15:25'}}});
  if (select.length != 1 || select[0].get('K1') != 'a') throw "Select date 1 string condition failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': {'>=': '2020-07-20 10:15:25'}}});
  var out = structure2string(select.map(function(x){ return x.get('K1')}));
  if (out != "[string_b,string_c]") throw "Select date 1 string condition >= failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': {'!=': '2020-07-20 10:15:25'}}});
  var out = structure2string(select.map(function(x){ return x.get('K1')}));
  if (out != "[string_a,string_c]") throw "Select date 1 string condition != failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': {'>=': '2020-07-10 10:15:00', '<=': '2020-07-20 10:15:30'}}});
  var out = structure2string(select.map(function(x){ return x.get('K1')}));
  if (out != "[string_a,string_b]") throw "Select date 1 string condition >= <= failed!";
  
  var select = sql.select({table: 'Dates', where:{'K2': ['2020-07-10 10:15:25', '2020-07-30 10:15:25']}});
  var out = structure2string(select.map(function(x){ return x.get('K1')}));
  if (out != "[string_a,string_c]") throw "Select date 1 string condition >= <= failed!";
}


function test_getLastUpdatedTime(){
  // 94ms, 123ms
  console.time('getLastUpdatedTime');
  var ssId = ss.getId();
  console.log(getLastUpdatedTime(ssId));
  console.timeEnd('getLastUpdatedTime');
}