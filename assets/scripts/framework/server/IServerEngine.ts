


interface IServerEngine<Room>{

    onCreate();
    
    // 登陆
    login(options?: any);

    // 登出
    logout();

    // 获取空闲房间列表
    getAvailableRooms<RoomAvailable>(): Promise<RoomAvailable[]>;

    // 创建房间
    createRoom(roomName,option: any): Promise<Room>;

    // 加入房间
    joinRoom(options: any):Promise<Room>;
    
    // 离开房间
    leaveRoom(room: Room);

    
    leaveRoomByName(roomName: string);

    leaveRoomById(roomId: string);


    // 房间内广播
    broadcastInRoom(room: Room,info);
    
    // 换座位
    changeSeat(seatId: number);

    // 重连
    reconnect(roomInfo);

    // 获取房间信息
    getRoomInfo(): Promise<any>;

    // 广播监听
    onBroadcast(data);

    // 房间状态发生改变监听
    onRoomInfoChange(roomInfo);

    // 成员加入监听
    onMemberJoined(memberInfo);

    // 成员离开监听
    onMemberLeave(memberInfo);

    // 更换房主监听
    onOwnerChanged(oldOwner,newOwner);

    // 更改座位监听
    onSeatChanged(res);

    // 登出监听
    onLogout(res);


}