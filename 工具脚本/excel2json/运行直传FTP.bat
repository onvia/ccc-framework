@Echo Off
TITLE  FTP�ύ����
:start
CLS
COLOR 2f
mode con cols=50 lines=20
:sc_main
echo ----------------------------------------
echo    	������Ϸ�汾��
echo ----------------------------------------
echo.&echo.
set "select="
set/p select= �������֣����س����� :

echo �Ժ򵼳�,δ��ʽ��json

java -jar ../xlsx2json.jar xlsx2json=true format=false merge=false md5=false throwEmptyData=true

!!c:\FlashFXP\flashfxp.exe -c2 -upload ftp://${�˺�}:${����}@${��ַ}:21 -localpath="%cd%\json\" -remotepath="/${Զ��Ŀ¼}/v%select%/"

echo  Json������ɣ�������˳�
PAUSE >nul
Goto sc_maina