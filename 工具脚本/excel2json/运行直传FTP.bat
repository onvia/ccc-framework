@Echo Off
TITLE  FTP提交工具
:start
CLS
COLOR 2f
mode con cols=50 lines=20
:sc_main
echo ----------------------------------------
echo    	输入游戏版本号
echo ----------------------------------------
echo.&echo.
set "select="
set/p select= 输入数字，按回车继续 :

echo 稍候导出,未格式化json

java -jar ../xlsx2json.jar xlsx2json=true format=false merge=false md5=false throwEmptyData=true

!!c:\FlashFXP\flashfxp.exe -c2 -upload ftp://${账号}:${密码}@${地址}:21 -localpath="%cd%\json\" -remotepath="/${远程目录}/v%select%/"

echo  Json导出完成，任意键退出
PAUSE >nul
Goto sc_maina