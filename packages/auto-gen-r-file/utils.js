let fs = require('fs');
let path = require('path');

 class utils {

    //文件夹是否存在，如果不存在则创建
    static mkdir (dir, cb) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            cc.log('utils-> 创建目录：'+dir);
        }
        cb && cb()
    }

    static seachBundle(fspath,bundles){
        if(!bundles){
            bundles = [];
        }
        let files = fs.readdirSync(fspath);
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let file_path = path.join(fspath, file);
            let stat = fs.lstatSync(file_path);
            if (stat.isDirectory()) {
                let metaFile = `${file_path}.meta`;
                let metaContent = fs.readFileSync(metaFile, 'utf-8');
                let data = JSON.parse(metaContent);
                if(data.isBundle){
                    bundles.push(file_path);
                    Editor.log(`auto gen R file: search-bundle: ${file_path}`);
                }
                // utils.seachBundle(file_path,bundles);                
            }
        }
        return bundles;
    }
}


module.exports = utils