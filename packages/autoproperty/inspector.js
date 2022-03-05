let utils = Editor.require('packages://autoproperty/utils.js')
let assets = [];

// require('electron').ipcRenderer.on('autoproperty-prefabs', function(event, args) {
//     assets = args;
//     console.log('inspector-> get msg ',assets.length);    
// });

Vue.component('test-inspector', {
    // 修改组件在 inspector 的显示样式
    template: `<template v-for="prop in target">\n
              <component\n v-if="prop.attrs.visible !== false"\n :is="prop.compType"\n :target.sync="prop"\n :indent="0"\n :multi-values="multi"\n ></component>\n
            </template>\n
            <div class="layout vertical" style="padding: 10px;">\n
            <ui-button v-on:confirm="onclicked" class="green">自动绑定</ui-button>\n
            <ui-button v-on:confirm="onclickreload" class="blue">重新加载资源</ui-button>\n
            <ui-button v-on:confirm="onclicklognodes" class="normal">输出节点结构</ui-button>\n
            </div>`,

    props: {
        target: {
            twoWay: true,
            type: Object,
        },
    },

    methods: {
        onclicklognodes: function () {
            let self = this;
            let curNode = self.getRootNode(self.target.node.value.uuid)
            let content = curNode.name+'\n';
            content = self.logNodes(curNode,content,'');
            console.log(`inspector-> logNodes`);            
            console.log(`${content}`);
            
            Editor.Ipc.sendToMain("autoproperty:log",content);
        },
        onclickreload: function () {
            Editor.assetdb.queryAssets('db://assets/**\/*', 'prefab', (err, results) => {
                console.log('inspector-> reloaded prefab', results.length);
                assets = results;

                Editor.Ipc.sendToMain("autoproperty:reloadend");
            });
        },
        onclicked: function () {
            let self = this;
            console.log('autoproperty-> onclicked');
            let curNode = self.getRootNode(self.target.node.value.uuid)
            for (const key in self.target) {

                let prop = self.target[key]
                if (prop && prop.attrs.visible !== false) {
                    let _constructor = cc.js.getClassByName(prop.attrs.type)
                    _constructor = _constructor ? _constructor : cc.js._registeredClassIds[prop.attrs.type]

                    if (_constructor) {
                        if (prop.type == "Array") {

                            // Editor.log(`autoproperty: key: ${key},newKey: ${newkey}`);
                            for (let idx = 0; idx < prop.value.length; idx++) {
                                if (!prop.value[idx].value.uuid) {
                                    let hasCheckNewKey = false;
                                    let _bindArray = function (value) {
                                        if (value) {
                                            Editor.Ipc.sendToPanel("scene", "scene:set-property", {
                                                id: self.target.uuid.value, // curComponent.uuid,
                                                path: `${key}.${idx}`,
                                                type: prop.attrs.type,
                                                value: {
                                                    uuid: value.uuid,
                                                    name: value.name
                                                },
                                                isSubProp: false
                                            })
                                        } else {
                                            if (hasCheckNewKey) {
                                                return;
                                            }
                                            hasCheckNewKey = true;
                                            let newkey = key;
                                            let isSEnd = key.endsWith('s')
                                            if (isSEnd) {
                                                newkey = newkey.substring(0, newkey.length - 1);
                                            }
                                            self._getValue(curNode, `${newkey}${idx}`, _constructor, _bindArray.bind(self))
                                        }
                                    }
                                    self._getValue(curNode, `${key}${idx}`, _constructor, _bindArray.bind(self))

                                }
                            }
                        } else if (!prop.value.uuid) {

                            let _bind = function (value) {
                                if (value) {
                                    Editor.Ipc.sendToPanel("scene", "scene:set-property", {
                                        id: self.target.uuid.value, // curComponent.uuid,
                                        path: key,
                                        type: prop.attrs.type,
                                        value: {
                                            uuid: value.uuid,
                                            name: value.name
                                        },
                                        isSubProp: false
                                    })
                                }
                            }
                            self._getValue(curNode, key, _constructor, _bind.bind(self));
                        }
                    }
                }
            }


            setTimeout(() => {
                Editor.Ipc.sendToMain("autoproperty:savescene");
            }, 1000);
        },


        _getValue(node, name, _constructor, cb) {
            if (_constructor == cc.Node) {
                let _node = this._getChildren(node, name);
                if (cb) {
                    cb(_node);
                }
                return _node;
            }
            if (cc.js.isChildClassOf(_constructor, cc.Component)) {
                let component = this._getChildrenByComponent(node, name, _constructor);
                if (cb) {
                    cb(component);
                }
                return component;
            }
            if (_constructor == cc.Prefab) {
                this._getPrefab(name, _constructor, cb);
            }
        },



        /// 获取子节点
        _getChildren(root, name) {
            let _getChild = (_root) => { //"Editor Scene Background"
                let child = _root.name == name ? _root : _root.getChildByName(name)
                if (child)
                    return child
                for (let idx = 0; idx < _root.childrenCount; idx++) {
                    child = _getChild(_root._children[idx])
                    if (child != null) {
                        break
                    }
                }
                return child
            }
            return _getChild(root)
        },

        /// 获取子节点的component
        _getChildrenByComponent(root, name, comp) {
            let _getChild = (_root) => {
                console.log("root:", _root.name, _root.name == name)
                let child = _root.name == name ? _root : _root.getChildByName(name)
                let component = child ? child.getComponent(comp) : null
                if (component) {
                    return component
                }
                for (let idx = 0; idx < _root.childrenCount; idx++) {
                    component = _getChild(_root._children[idx])
                    if (component != null) {
                        break
                    }
                }
                return component
            }
            return _getChild(root)
        },

        _getPrefab(name, _constructor, cb) {
            let _find = function () {
                let obj = assets.find((item) => {
                    return item.url.endsWith(`${name}.prefab`)
                });
                if (cb) {
                    cb(obj);
                }
            }

            if (assets.length != 0) {
                _find();
            } else {
                Editor.assetdb.queryAssets('db://assets/**\/*', 'prefab', (err, results) => {
                    console.log('inspector-> loaded prefab', results.length);
                    assets = results;
                    _find();
                });
            }
        },

        /// huo
        getRootNode(uuid) {
            let _getChild = (root) => {
                if (root.uuid == uuid)
                    return root
                let child = null
                for (let idx = 0; idx < root.childrenCount; idx++) {
                    let temp = root._children[idx]
                    if (temp.name == "Editor Scene Background" || temp.name == "Editor Scene Foreground") {
                        continue
                    }
                    child = _getChild(temp)
                    if (child != null) {
                        break
                    }
                }
                return child
            }
            return _getChild(cc.director.getScene())
        },
        logNodes(node,content, space = ' ') {
            let self = this;
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                // console.log(`${space}${child.name}`);
                content += `${space}${child.name}\n`
                if (child.childrenCount > 0) {
                    content = self.logNodes(child,content, space + '  ');
                }
            }
            return content;
        }
    },
    messages: {
        'asset-db:assets-created'() {
            console.log('inspector-> asset-db:assets-created');
        }
    }
});