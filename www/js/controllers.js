
angular.module('app.controllers', ['ionic'])

.controller('textEncodingConverterCtrl', ['$scope', '$stateParams', "$ionicPopup", // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
// You can include any angular dependencies as parameters for this function
// TIP: Access Route Parameters for your page via $stateParams.parameterName
  function ($scope, $stateParams, $ionicPopup) {
    $scope.saveDisabled = true;
    $scope.choose = function(){
      window.plugins.mfilechooser.open([], function (uri) {
        $scope.uri=uri;
        $scope.$apply();
        $scope.filePath = uri.substring(0,uri.lastIndexOf("\/")+1);
        $scope.fileNameFull = uri.substring(uri.lastIndexOf("\/")+1);
        $scope.fileRead();
        //console.log($scope.file);
      }, function (error) {

        window.alert(error);

      });
    };

    $scope.fileRead = function(){
      console.log("scope0:");console.log($scope);
      console.log("file path:"+$scope.filePath);
      window.resolveLocalFileSystemURL("file://"+$scope.filePath, function (dirEntry) {
        console.log('file system open: ' + dirEntry.name);
        $scope.dirEntry = dirEntry;
        $scope.dirEntry.getFile($scope.fileNameFull, {create: true, exclusive: false}, function(fileEntry) {
          $scope.fileEntry = fileEntry;

          fileEntry.file(function (file) {
            var reader = new FileReader();

            reader.onloadend = function() {
              //console.log("Successful file read: " + this.result);
              $scope.fileContent = new Uint8Array(this.result);
              var charGuessing = window.chardet.detect(String.fromCharCode.apply(null, $scope.fileContent));
              console.log(charGuessing);
              $scope.file = {
                text: $scope.fileContent,
                detected_encoding: false
              }
              var detectedCharObj;
              for (x in $scope.charsetsAvailable){
                for(y in $scope.charsetsAvailable[x].codes){
                  if(charGuessing.encoding.toUpperCase()==$scope.charsetsAvailable[x].codes[y]){
                    console.log("scope1:");console.log($scope);
                    var probability = Math.round((Math.max(charGuessing.confidence,0.9)-0.9) * 1000);
                    if(probability>50){
                      $scope.fromCharset = $scope.charsetsAvailable[x].converter;
                      $scope.$apply();
                    }
                    $ionicPopup.alert({
                       title: 'Encoding Detected',
                       template:  "Encoding detected with "+
                       (probability).toString()+"% confidence: "+$scope.charsetsAvailable[x].visible
                     });
                    console.log($scope.charsetsAvailable[x]);
                  }
                }
              }
              $scope.saveDisabled = false;
            };
            reader.readAsArrayBuffer(file);

          }, function(){console.log("file cannot read")});

        }, function(){console.log("file cannot created")});

        var fnf = $scope.fileNameFull;
        $scope.fileName = fnf.substring(0,fnf.lastIndexOf("\."));
        $scope.fileExtension = fnf.substring(fnf.lastIndexOf("\."));
        $scope.fileBkpName = $scope.fileName+".orig"+$scope.fileExtension

      }, function(){console.log("file system cannot opened")});
    };

    $scope.save = function (){

      if($scope.file.text.length===0){
        $ionicPopup.alert({
           title: 'Warning',
           template:  "Please choose correct file."
         });
        return false;
      }
      if($scope.fromCharset==="#"){
        $ionicPopup.alert({
           title: 'Warning:',
           template:  "Please choose file encoding charset."
         });
        return false;
      }
      if($scope.toCharset==="#"){
        $ionicPopup.alert({
           title: 'Warning:',
           template:  "Please choose charset to convert file"
         });
        return false;
      }

      $scope.file.text_converted = window.iconv.encode(
        window.iconv.decode(new window.buffer.Buffer($scope.file.text),$scope.fromCharset)
      ,$scope.toCharset);
      $scope.dirEntry.getFile($scope.fileBkpName, {create: true, exclusive: false}, function(fileEntryBkp) {
        $scope.fileEntryBkp = fileEntryBkp;
        $scope.fileEntryBkp.createWriter(function (fileWriter) {

          fileWriter.onwriteend = function() {
            console.log("Successful file write...");
            $ionicPopup.alert({
               title: 'Backup Complete',
               template:  "Original file is backed up: "+$scope.fileEntryBkp.name
             });
          };

          fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
          };

          fileWriter.write(new Blob([$scope.file.text], { type: 'text/plain' }));
        });
      }, function(){console.log("file cannot created")});
      // Create a FileWriter object for our FileEntry (log.txt).
      $scope.fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
          console.log("Successful file write...");
          $ionicPopup.alert({
           title: 'Successful',
           template:  "File successfully converted: "+$scope.fileEntry.name
         });
          //readFile(fileEntry);
        };

        fileWriter.onerror = function (e) {
          console.log("Failed file write: " + e.toString());
        };

        fileWriter.write(new Blob([$scope.file.text_converted], { type: 'text/plain' }));
      });

    };

    $scope.charsets = [
      {"codes":["ANSI_X3.4-1968", "ANSI_X3.4-1986", "ASCII", "CP367", "IBM367", "ISO-IR-6", "ISO646-US", "ISO_646.IRV:1991", "US", "US-ASCII", "CSASCII"], "visible":"ASCII", "converter":"ASCII"},
      {"codes":["UTF-8", "UTF8"], "visible":"UTF-8", "converter":"UTF-8"},
      {"codes":["UTF-8-MAC", "UTF8-MAC"], "visible":"UTF-8-MAC", "converter":"UTF-8-MAC"},
      {"codes":["ISO-10646-UCS-2", "UCS-2", "CSUNICODE"], "visible":"UCS-2", "converter":"UCS-2"},
      {"codes":["UCS-2BE", "UNICODE-1-1", "UNICODEBIG", "CSUNICODE11"], "visible":"UNICODEBIG", "converter":"UCS-2BE"},
      {"codes":["UCS-2LE", "UNICODELITTLE"], "visible":"UNICODELITTLE", "converter":"UCS-2LE"},
      {"codes":["ISO-10646-UCS-4", "UCS-4", "CSUCS4"], "visible":"UCS-4", "converter":"UCS-4"},
      {"codes":["UCS-4BE"], "visible":"UCS-4BE", "converter":"UCS-4BE"},
      {"codes":["UCS-4LE"], "visible":"UCS-4LE", "converter":"UCS-4LE"},
      {"codes":["UTF-16"], "visible":"UTF-16", "converter":"UTF-16"},
      {"codes":["UTF-16BE"], "visible":"UTF-16BE", "converter":"UTF-16BE"},
      {"codes":["UTF-16LE"], "visible":"UTF-16LE", "converter":"UTF-16LE"},
      {"codes":["UTF-32"], "visible":"UTF-32", "converter":"UTF-32"},
      {"codes":["UTF-32BE"], "visible":"UTF-32BE", "converter":"UTF-32BE"},
      {"codes":["UTF-32LE"], "visible":"UTF-32LE", "converter":"UTF-32LE"},
      {"codes":["UNICODE-1-1-UTF-7", "UTF-7", "CSUNICODE11UTF7"], "visible":"UTF-7", "converter":"UTF-7"},
      {"codes":["UCS-2-INTERNAL"], "visible":"UCS-2-INTERNAL", "converter":"UCS-2-INTERNAL"},
      {"codes":["UCS-2-SWAPPED"], "visible":"UCS-2-SWAPPED", "converter":"UCS-2-SWAPPED"},
      {"codes":["UCS-4-INTERNAL"], "visible":"UCS-4-INTERNAL", "converter":"UCS-4-INTERNAL"},
      {"codes":["UCS-4-SWAPPED"], "visible":"UCS-4-SWAPPED", "converter":"UCS-4-SWAPPED"},
      {"codes":["C99"], "visible":"C99", "converter":"C99"},
      {"codes":["JAVA"], "visible":"JAVA", "converter":"JAVA"},
      {"codes":["CP819", "IBM819", "ISO-8859-1", "ISO-IR-100", "ISO8859-1", "ISO_8859-1", "ISO_8859-1:1987", "L1", "LATIN1", "CSISOLATIN1"], "visible":"ISO-8859-1 (LATIN1)", "converter":"ISO-8859-1"},
      {"codes":["ISO-8859-2", "ISO-IR-101", "ISO8859-2", "ISO_8859-2", "ISO_8859-2:1987", "L2", "LATIN2", "CSISOLATIN2"], "visible":"ISO-8859-2 (LATIN2)", "converter":"ISO-8859-2"},
      {"codes":["ISO-8859-3", "ISO-IR-109", "ISO8859-3", "ISO_8859-3", "ISO_8859-3:1988", "L3", "LATIN3", "CSISOLATIN3"], "visible":"ISO-8859-3 (LATIN3)", "converter":"ISO-8859-3"},
      {"codes":["ISO-8859-4", "ISO-IR-110", "ISO8859-4", "ISO_8859-4", "ISO_8859-4:1988", "L4", "LATIN4", "CSISOLATIN4"], "visible":"ISO-8859-4 (LATIN4)", "converter":"ISO-8859-4"},
      {"codes":["CYRILLIC", "ISO-8859-5", "ISO-IR-144", "ISO8859-5", "ISO_8859-5", "ISO_8859-5:1988", "CSISOLATINCYRILLIC"], "visible":"ISO-8859-5 (CYRILLIC)", "converter":"ISO-8859-5"},
      {"codes":["ARABIC", "ASMO-708", "ECMA-114", "ISO-8859-6", "ISO-IR-127", "ISO8859-6", "ISO_8859-6", "ISO_8859-6:1987", "CSISOLATINARABIC"], "visible":"ISO-8859-6 (ARABIC)", "converter":"ISO-8859-6"},
      {"codes":["ECMA-118", "ELOT_928", "GREEK", "GREEK8", "ISO-8859-7", "ISO-IR-126", "ISO8859-7", "ISO_8859-7", "ISO_8859-7:1987", "ISO_8859-7:2003", "CSISOLATINGREEK"], "visible":"ISO-8859-7 (GREEK)", "converter":"ISO-8859-7"},
      {"codes":["HEBREW", "ISO-8859-8", "ISO-IR-138", "ISO8859-8", "ISO_8859-8", "ISO_8859-8:1988", "CSISOLATINHEBREW"], "visible":"ISO-8859-8 (HEBREW)", "converter":"ISO-8859-8"},
      {"codes":["ISO-8859-9", "ISO-IR-148", "ISO8859-9", "ISO_8859-9", "ISO_8859-9:1989", "L5", "LATIN5", "CSISOLATIN5"], "visible":"ISO_8859-9 (LATIN5)", "converter":"ISO_8859-9"},
      {"codes":["ISO-8859-10", "ISO-IR-157", "ISO8859-10", "ISO_8859-10", "ISO_8859-10:1992", "L6", "LATIN6", "CSISOLATIN6"], "visible":"ISO-8859-10 (LATIN6)", "converter":"ISO-8859-10"},
      {"codes":["ISO-8859-11", "ISO8859-11", "ISO_8859-11"], "visible":"ISO-8859-11", "converter":"ISO-8859-11"},
      {"codes":["ISO-8859-13", "ISO-IR-179", "ISO8859-13", "ISO_8859-13", "L7", "LATIN7"], "visible":"ISO-8859-13 (LATIN7)", "converter":"ISO-8859-13"},
      {"codes":["ISO-8859-14", "ISO-CELTIC", "ISO-IR-199", "ISO8859-14", "ISO_8859-14", "ISO_8859-14:1998", "L8", "LATIN8"], "visible":"ISO-8859-14 (LATIN8)", "converter":"ISO-8859-14"},
      {"codes":["ISO-8859-15", "ISO-IR-203", "ISO8859-15", "ISO_8859-15", "ISO_8859-15:1998", "LATIN-9"], "visible":"ISO-8859-15 (LATIN9)", "converter":"ISO-8859-15"},
      {"codes":["ISO-8859-16", "ISO-IR-226", "ISO8859-16", "ISO_8859-16", "ISO_8859-16:2001", "L10", "LATIN10"], "visible":"ISO-8859-16 (LATIN10)", "converter":"ISO-8859-16"},
      {"codes":["KOI8-R", "CSKOI8R"], "visible":"KOI8-R", "converter":"KOI8-R"},
      {"codes":["KOI8-U"], "visible":"KOI8-U", "converter":"KOI8-U"},
      {"codes":["KOI8-RU"], "visible":"KOI8-RU", "converter":"KOI8-RU"},
      {"codes":["CP1250", "MS-EE", "WINDOWS-1250"], "visible":"WINDOWS-1250", "converter":"CP1250"},
      {"codes":["CP1251", "MS-CYRL", "WINDOWS-1251"], "visible":"WINDOWS-1251", "converter":"CP1251"},
      {"codes":["CP1252", "MS-ANSI", "WINDOWS-1252"], "visible":"WINDOWS-1252", "converter":"CP1252"},
      {"codes":["CP1253", "MS-GREEK", "WINDOWS-1253"], "visible":"WINDOWS-1253", "converter":"CP1253"},
      {"codes":["CP1254", "MS-TURK", "WINDOWS-1254"], "visible":"WINDOWS-1254", "converter":"CP1254"},
      {"codes":["CP1255", "MS-HEBR", "WINDOWS-1255"], "visible":"WINDOWS-1255", "converter":"CP1255"},
      {"codes":["CP1256", "MS-ARAB", "WINDOWS-1256"], "visible":"WINDOWS-1256", "converter":"CP1256"},
      {"codes":["CP1257", "WINBALTRIM", "WINDOWS-1257"], "visible":"WINDOWS-1257", "converter":"CP1257"},
      {"codes":["CP1258", "WINDOWS-1258"], "visible":"WINDOWS-1258", "converter":"CP1258"},
      {"codes":["850", "CP850", "IBM850", "CSPC850MULTILINGUAL"], "visible":"IBM850", "converter":"CP850"},
      {"codes":["862", "CP862", "IBM862", "CSPC862LATINHEBREW"], "visible":"IBM862", "converter":"CP862"},
      {"codes":["866", "CP866", "IBM866", "CSIBM866"], "visible":"IBM866", "converter":"CP866"},
      {"codes":["MAC", "MACINTOSH", "MACROMAN", "CSMACINTOSH"], "visible":"MAC", "converter":"MAC"},
      {"codes":["MACCENTRALEUROPE"], "visible":"MACCENTRALEUROPE", "converter":"MACCENTRALEUROPE"},
      {"codes":["MACICELAND"], "visible":"MACICELAND", "converter":"MACICELAND"},
      {"codes":["MACCROATIAN"], "visible":"MACCROATIAN", "converter":"MACCROATIAN"},
      {"codes":["MACROMANIA"], "visible":"MACROMANIA", "converter":"MACROMANIA"},
      {"codes":["MACCYRILLIC"], "visible":"MACCYRILLIC", "converter":"MACCYRILLIC"},
      {"codes":["MACUKRAINE"], "visible":"MACUKRAINE", "converter":"MACUKRAINE"},
      {"codes":["MACGREEK"], "visible":"MACGREEK", "converter":"MACGREEK"},
      {"codes":["MACTURKISH"], "visible":"MACTURKISH", "converter":"MACTURKISH"},
      {"codes":["MACHEBREW"], "visible":"MACHEBREW", "converter":"MACHEBREW"},
      {"codes":["MACARABIC"], "visible":"MACARABIC", "converter":"MACARABIC"},
      {"codes":["MACTHAI"], "visible":"MACTHAI", "converter":"MACTHAI"},
      {"codes":["HP-ROMAN8", "R8", "ROMAN8", "CSHPROMAN8"], "visible":"ROMAN8", "converter":"HP-ROMAN8"},
      {"codes":["NEXTSTEP"], "visible":"NEXTSTEP", "converter":"NEXTSTEP"},
      {"codes":["ARMSCII-8"], "visible":"ARMSCII-8", "converter":"ARMSCII-8"},
      {"codes":["GEORGIAN-ACADEMY"], "visible":"GEORGIAN-ACADEMY", "converter":"GEORGIAN-ACADEMY"},
      {"codes":["GEORGIAN-PS"], "visible":"GEORGIAN-PS", "converter":"GEORGIAN-PS"},
      {"codes":["KOI8-T"], "visible":"KOI8-T", "converter":"KOI8-T"},
      {"codes":["CP154", "CYRILLIC-ASIAN", "PT154", "PTCP154", "CSPTCP154"], "visible":"CYRILLIC-ASIAN (CP154)", "converter":"CP154"},
      {"codes":["MULELAO-1"], "visible":"MULELAO-1", "converter":"MULELAO-1"},
      {"codes":["CP1133", "IBM-CP1133"], "visible":"CP1133", "converter":"CP1133"},
      {"codes":["ISO-IR-166", "TIS-620", "TIS620", "TIS620-0", "TIS620.2529-1", "TIS620.2533-0", "TIS620.2533-1"], "visible":"ISO-IR-166 (TIS620)", "converter":"ISO-IR-166"},
      {"codes":["CP874", "WINDOWS-874"], "visible":"WINDOWS-874", "converter":"CP874"},
      {"codes":["VISCII", "VISCII1.1-1", "CSVISCII"], "visible":"VISCII", "converter":"VISCII"},
      {"codes":["TCVN", "TCVN-5712", "TCVN5712-1", "TCVN5712-1:1993"], "visible":"replace2", "converter":"replace3"},
      {"codes":["ISO-IR-14", "ISO646-JP", "JIS_C6220-1969-RO", "JP", "CSISO14JISC6220RO"], "visible":"JP (ISO-IR-14)", "converter":"ISO-IR-14"},
      {"codes":["JISX0201-1976", "JIS_X0201", "X0201", "CSHALFWIDTHKATAKANA"], "visible":"JISX0201-1976", "converter":"JISX0201-1976"},
      {"codes":["ISO-IR-87", "JIS0208", "JIS_C6226-1983", "JIS_X0208", "JIS_X0208-1983", "JIS_X0208-1990", "X0208", "CSISO87JISX0208"], "visible":"ISO-IR-87", "converter":"ISO-IR-87"},
      {"codes":["ISO-IR-159", "JIS_X0212", "JIS_X0212-1990", "JIS_X0212.1990-0", "X0212", "CSISO159JISX02121990"], "visible":"ISO-IR-159", "converter":"ISO-IR-159"},
      {"codes":["CN", "GB_1988-80", "ISO-IR-57", "ISO646-CN", "CSISO57GB1988"], "visible":"CN (ISO646-CN)", "converter":"ISO646-CN"},
      {"codes":["CHINESE", "GB_2312-80", "ISO-IR-58", "CSISO58GB231280"], "visible":"CHINESE (ISO-IR-58)", "converter":"ISO-IR-58"},
      {"codes":["CN-GB-ISOIR165", "ISO-IR-165"], "visible":"ISO-IR-165", "converter":"ISO-IR-165"},
      {"codes":["ISO-IR-149", "KOREAN", "KSC_5601", "KS_C_5601-1987", "KS_C_5601-1989", "CSKSC56011987"], "visible":"KOREAN (ISO-IR-149)", "converter":"ISO-IR-149"},
      {"codes":["EUC-JP", "EUCJP", "EXTENDED_UNIX_CODE_PACKED_FORMAT_FOR_JAPANESE", "CSEUCPKDFMTJAPANESE"], "visible":"EUC-JP", "converter":"EUC-JP"},
      {"codes":["MS_KANJI", "SHIFT-JIS", "SHIFT_JIS", "SJIS", "CSSHIFTJIS"], "visible":"MS_KANJI (SHIFT-JIS)", "converter":"MS_KANJI"},
      {"codes":["CP932"], "visible":"CP932", "converter":"CP932"},
      {"codes":["ISO-2022-JP", "CSISO2022JP"], "visible":"ISO-2022-JP", "converter":"ISO-2022-JP"},
      {"codes":["ISO-2022-JP-1"], "visible":"ISO-2022-JP-1", "converter":"ISO-2022-JP-1"},
      {"codes":["ISO-2022-JP-2", "CSISO2022JP2"], "visible":"ISO-2022-JP-2", "converter":"ISO-2022-JP-2"},
      {"codes":["CN-GB", "EUC-CN", "EUCCN", "GB2312", "CSGB2312"], "visible":"CN-GB", "converter":"CN-GB"},
      {"codes":["GBK"], "visible":"GBK", "converter":"GBK"},
      {"codes":["CP936", "MS936", "WINDOWS-936"], "visible":"WINDOWS-936", "converter":"CP936"},
      {"codes":["GB18030"], "visible":"GB18030", "converter":"GB18030"},
      {"codes":["ISO-2022-CN", "CSISO2022CN"], "visible":"ISO-2022-CN", "converter":"ISO-2022-CN"},
      {"codes":["ISO-2022-CN-EXT"], "visible":"ISO-2022-CN-EXT", "converter":"ISO-2022-CN-EXT"},
      {"codes":["HZ", "HZ-GB-2312"], "visible":"HZ (HZ-GB-2312)", "converter":"HZ"},
      {"codes":["EUC-TW", "EUCTW", "CSEUCTW"], "visible":"EUC-TW", "converter":"EUC-TW"},
      {"codes":["BIG-5", "BIG-FIVE", "BIG5", "BIGFIVE", "CN-BIG5", "CSBIG5"], "visible":"BIG-5", "converter":"BIG-5"},
      {"codes":["CP950"], "visible":"CP950", "converter":"CP950"},
      {"codes":["BIG5-HKSCS:1999"], "visible":"BIG5-HKSCS:1999", "converter":"BIG5-HKSCS:1999"},
      {"codes":["BIG5-HKSCS:2001"], "visible":"BIG5-HKSCS:2001", "converter":"BIG5-HKSCS:2001"},
      {"codes":["BIG5-HKSCS", "BIG5-HKSCS:2004", "BIG5HKSCS"], "visible":"BIG5-HKSCS", "converter":"BIG5-HKSCS"},
      {"codes":["EUC-KR", "EUCKR", "CSEUCKR"], "visible":"EUC-KR", "converter":"EUC-KR"},
      {"codes":["CP949", "UHC"], "visible":"UHC (CP949)", "converter":"CP949"},
      {"codes":["CP1361", "JOHAB"], "visible":"JOHAB (CP1361)", "converter":"CP1361"},
      {"codes":["ISO-2022-KR", "CSISO2022KR"], "visible":"ISO-2022-KR", "converter":"ISO-2022-KR"},
      {"codes":["CP856"], "visible":"CP856", "converter":"CP856"},
      {"codes":["CP922"], "visible":"CP922", "converter":"CP922"},
      {"codes":["CP943"], "visible":"CP943", "converter":"CP943"},
      {"codes":["CP1046"], "visible":"CP1046", "converter":"CP1046"},
      {"codes":["CP1124"], "visible":"CP1124", "converter":"CP1124"},
      {"codes":["CP1129"], "visible":"CP1129", "converter":"CP1129"},
      {"codes":["CP1161", "IBM-1161", "IBM1161", "CSIBM1161"], "visible":"IBM-1161", "converter":"CP1161"},
      {"codes":["CP1162", "IBM-1162", "IBM1162", "CSIBM1162"], "visible":"IBM-1162", "converter":"CP1162"},
      {"codes":["CP1163", "IBM-1163", "IBM1163", "CSIBM1163"], "visible":"IBM-1163", "converter":"CP1163"},
      {"codes":["DEC-KANJI"], "visible":"DEC-KANJI", "converter":"DEC-KANJI"},
      {"codes":["DEC-HANYU"], "visible":"DEC-HANYU", "converter":"DEC-HANYU"},
      {"codes":["437", "CP437", "IBM437", "CSPC8CODEPAGE437"], "visible":"IBM437", "converter":"CP437"},
      {"codes":["CP737"], "visible":"CP737", "converter":"CP737"},
      {"codes":["CP775", "IBM775", "CSPC775BALTIC"], "visible":"IBM775", "converter":"CP775"},
      {"codes":["852", "CP852", "IBM852", "CSPCP852"], "visible":"IBM852", "converter":"CP852"},
      {"codes":["CP853"], "visible":"CP853", "converter":"CP853"},
      {"codes":["855", "CP855", "IBM855", "CSIBM855"], "visible":"IBM855", "converter":"CP855"},
      {"codes":["857", "CP857", "IBM857", "CSIBM857"], "visible":"IBM857", "converter":"CP857"},
      {"codes":["CP858"], "visible":"CP858", "converter":"CP858"},
      {"codes":["860", "CP860", "IBM860", "CSIBM860"], "visible":"IBM860", "converter":"CP860"},
      {"codes":["861", "CP-IS", "CP861", "IBM861", "CSIBM861"], "visible":"IBM861", "converter":"CP861"},
      {"codes":["863", "CP863", "IBM863", "CSIBM863"], "visible":"IBM863", "converter":"CP863"},
      {"codes":["CP864", "IBM864", "CSIBM864"], "visible":"IBM864", "converter":"CP864"},
      {"codes":["865", "CP865", "IBM865", "CSIBM865"], "visible":"IBM865", "converter":"CP865"},
      {"codes":["869", "CP-GR", "CP869", "IBM869", "CSIBM869"], "visible":"IBM869", "converter":"CP869"},
      {"codes":["CP1125"], "visible":"CP1125", "converter":"CP1125"},
      {"codes":["EUC-JISX0213"], "visible":"EUC-JISX0213", "converter":"EUC-JISX0213"},
      {"codes":["SHIFT_JISX0213"], "visible":"SHIFT_JISX0213", "converter":"SHIFT_JISX0213"},
      {"codes":["ISO-2022-JP-3"], "visible":"ISO-2022-JP-3", "converter":"ISO-2022-JP-3"},
      {"codes":["BIG5-2003"], "visible":"BIG5-2003", "converter":"BIG5-2003"},
      {"codes":["ISO-IR-230", "TDS565"], "visible":"ISO-IR-230", "converter":"ISO-IR-230"},
      {"codes":["ATARI", "ATARIST"], "visible":"ATARI", "converter":"ATARI"},
      {"codes":["RISCOS-LATIN1"], "visible":"RISCOS-LATIN1", "converter":"RISCOS-LATIN1"}
    ];

    $scope.charsetsAvailable=[];
    $scope.setValues = function (){
      for (x in $scope.charsets){
        if(!window.iconv.encodingExists($scope.charsets[x].converter)){
          continue;
        }
        $scope.charsetsAvailable.push($scope.charsets[x]);
      }
      // if($scope.file!==undefined && $scope.file.detected_encoding!==false){
      //   $scope.fromCharset.value = $scope.file.detected_encoding.converter;
      // }
    };
    $scope.setValues();

  }])

  .controller('aboutCtrl', ['$scope', '$stateParams', // The following is the constructor function for this page's controller. See https://docs.angularjs.org/guide/controller
  // You can include any angular dependencies as parameters for this function
  // TIP: Access Route Parameters for your page via $stateParams.parameterName
  function ($scope, $stateParams) {


  }])
