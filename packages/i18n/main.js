'use strict';

const Fs = require('fire-fs');
const Path = require('path');
// let scene = require('scene');

let projectPath = Editor.projectPath;
if (!projectPath) {
   projectPath = Editor.Project.path;
}
let languages = {};
let KEY = 'name';
let SOURCE_FILE  = "db://assets/editor/i18n/language.json"; //多语言文件
let DIS_PATH = "db://assets/resources/i18n/";
let PATH_SOURCE = Path.join(projectPath, './assets/editor/i18n');
let PATH = Path.join(projectPath, './assets/resources/i18n');


function mount() {
    // 创建目录，保证目录存在
    Fs.ensureDirSync(PATH_SOURCE);
    Fs.ensureDirSync(PATH);
};


function loadJson(){
  let fspath = Editor.assetdb.urlToFspath(SOURCE_FILE);  
  // Editor.log('loadJson:fspath '+fspath);
  var jsonData = Fs.readFileSync(fspath,  'utf-8');     // 读取构建好的 js
  // Editor.log('loadJson:jsonData '+jsonData);
  let json = JSON.parse(jsonData);
  // Editor.log('main->loadJson ',json);
  // {"name":"text1","hi":"आइसक्रीम","en-us":"Ice Cream","vi":"Kem","th":"ไอศครีม","pt-br":"Sorvete","id":"Es Krim","zh":"雪糕"}
  for (let i = 0; i < json.length; i++) {
    let _data = json[i];
    // Editor.log('main->loadJson languages   : ',Object.keys(_data));
    let keys = Object.keys(_data);
    for (let j = 0; j < keys.length; j++) {
      const _language = keys[j];      
      const value = _data[_language];      
      if(_language == KEY){
        continue;
      }      
      // Editor.log('main->loadJson languages   value: ',_language,'  ',value);
      if(!languages[_language]){
        languages[_language] = {};
      }
      let key = _data[KEY];
      languages[_language][key] = value;
    }
  }
  

  for (const key in languages) {    
    const content = languages[key];
    
      // Editor.log('main->loadJson languages   value: ',key,'  ',content);
    create(key,JSON.stringify(content,null,'\t'));
  }

  // Editor.log('main->loadJson languages: ',languages);
}

function create(name,content) {
  let js = `export const data = ${content}`;
  let url = `${DIS_PATH}${name}.ts`;
  let endcb = function (resolve,reject,error, meta) {            
      if (error) {
        Editor.assetdb.error('Failed to create asset %s, %s', url, error.stack);
        reject();
        return;
      }
      Editor.success('i18n->create languages: ',url);
      resolve();
  }
  return new Promise((resolve, reject) => {    
      if (Editor.assetdb.exists(url)) {
        Editor.assetdb.saveExists(url, js,(err,meta)=>{
          endcb(resolve,reject,err,meta);
        });
      } else {
        Editor.assetdb.create(url, js,(err,meta)=>{
          endcb(resolve,reject,err,meta);
        });
      }
  });
};


module.exports = {
  load () {
    mount();
  },

  unload () {
  },


  // register your ipc messages here
  messages: {
    'open' () {
      // open entry panel registered in package.json
      
      loadJson();
      // Editor.Panel.open('i18n');
    },
    'refresh'(){
      
      Editor.Scene.callSceneScript('i18n', 'update-default-language', function (err, result) {
        // console.log(result);
        });
    },
    'help'(){
        Editor.log(`多语言文件 [ ${SOURCE_FILE} ]，点击生成按钮，会在 [ ${DIS_PATH} ] 生成多语言脚本 *.ts`);
    },
  },
};