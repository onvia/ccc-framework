import SceneBase from "../../framework/core/scene/SceneBase";
import { engine } from "../../framework/Engine";
import List from "../../framework/gui/VirtualList/List";
import { R } from "../../utils/R";
const {ccclass,inspector, property} = cc._decorator;

@ccclass
@inspector("packages://autoproperty/inspector.js")
export default class LobbyScene extends SceneBase {



    @property(List)
    RoomList: List = null;

    roomInfos: any[] = [];
    
    async start(){
        
        engine.uibind.bind(this);

    }

    onSceneHideBegin(): void {
        console.log(`LobbyScene-> 开始隐藏场景`);

    }

    onSceneHideEnd(): void {
        console.log(`LobbyScene-> 场景隐藏完成，可以释放当前场景资源`);

    }
    


    onListRender(item: cc.Node,id: number){
        let infos = this.roomInfos[id];
         
    }


    async onClickCreateRoom(){
        console.log(`LobbyScene-> 创建房间`);
        engine.sceneMgr.to(R.scene.FightingScene);
    }

    onClickSendMsg(){
    }
    
    async onClickLeave(){
        console.log(`LobbyScene-> `);
        
        console.log(`LobbyScene->离开大厅 `);
    }

    
    onEnable(){
    }
    onDisable(){
        engine.event.targetOff(this);
    }
}
