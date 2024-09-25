import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Tree, Button, Input } from "antd";
import type { TreeDataNode, TreeProps, InputRef } from "antd";
import {
  FileOutlined,
  FolderOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { uniqueId } from "lodash";
import useClickOutside from "./useClickOutside";
import "./style.less";
import classNames from "classnames";

const PREFIX = "file-tree";

interface ExtendedTreeDataNode extends TreeDataNode {
  type?: "file" | "folder";
  editable?: boolean;
}

const defaultData: ExtendedTreeDataNode[] = [];

const recursionFindNode = (
  data: ExtendedTreeDataNode[],
  key: React.Key,
  callback?: (
    node: ExtendedTreeDataNode,
    parentNode: ExtendedTreeDataNode[],
    index: number
  ) => void
) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === key) {
      callback?.(data[i], data, i);
    }
    if (data[i]?.children) {
      recursionFindNode(
        data[i].children as ExtendedTreeDataNode[],
        key,
        callback
      );
    }
  }

  return [...data];
};

const CreateFile = forwardRef((props: TreeProps, forwardRef) => {
  const { treeData = defaultData, ...restProps } = props;
  const [gData, setGData] = useState(treeData);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const onDrop: TreeProps["onDrop"] = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split("-");
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);
    const loop = (
      data: ExtendedTreeDataNode[],
      key: React.Key,
      callback: (
        node: ExtendedTreeDataNode,
        i: number,
        data: ExtendedTreeDataNode[]
      ) => void
    ) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children!, key, callback);
        }
      }
    };
    const data = [...gData];

    // 找到并移除拖拽对象
    let dragObj: ExtendedTreeDataNode;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    // 检查目标节点类型
    let targetNode: ExtendedTreeDataNode;
    loop(data, dropKey, (item) => {
      targetNode = item as ExtendedTreeDataNode;
    });

    // 如果目标节点是文件类型且不是放入间隙，则不允许作为子节点插入
    if (!info.dropToGap && targetNode!.type === "file") {
      return;
    }

    if (!info.dropToGap) {
      // 作为子节点插入
      loop(data, dropKey, (item) => {
        item.children = item.children || []; //确保有子节点数组
        item.children.unshift(dragObj); //将拖拽对象放到子节点数组的开头
      });
    } else {
      // 作为兄弟节点插入(插入到目标节点上下位置)
      let ar: ExtendedTreeDataNode[] = [];
      let i: number;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr; // 存储父节点数组
        i = index; // 存储放下节点的索引
      });
      if (dropPosition === -1) {
        // 将拖拽对象插入到放下节点的上方
        ar.splice(i!, 0, dragObj!);
      } else {
        // 将拖拽对象插入到放下节点的下方
        ar.splice(i! + 1, 0, dragObj!);
      }
    }
    setGData(data);
  };

  const handleAddNode = (type: "file" | "folder") => {
    const key = uniqueId();
    const title = type === "file" ? "文件" : "文件夹";

    const newNode: ExtendedTreeDataNode = {
      title,
      key,
      type,
    };

    setGData([...gData, newNode]);
  };

  const handleDeleteNode = (item: ExtendedTreeDataNode) => {
    const treeData = recursionFindNode(
      gData,
      item.key,
      (node, parentNode, i) => {
        parentNode.splice(i, 1);
      }
    );

    setGData(treeData);
  };

  const handleChange = (e: any) => {
    const modifiedName = e.target.value;

    const treeData = recursionFindNode(gData, editingKey!, (node) => {
      node.title = modifiedName;
    });

    setGData(treeData);
    setEditingKey(null);
  };

  const onSelect = (node: ExtendedTreeDataNode) => {
    console.log("node", node);

    if (node?.title && node?.key) {
      setEditingKey(node.key as string);
      // 确保dom生成
      setTimeout(() => {
        // 用户体验优化，默认选中所有文本
        ref.current?.focus();
        ref.current?.select();
      });
    }
  };

  const titleRender = (node: ExtendedTreeDataNode) => {
    const titleCls = classNames(`${PREFIX}-node-title`);

    return (
      <div className={titleCls}>
        <div
          className={`${PREFIX}-node-title-content`}
          onDoubleClick={() => onSelect(node)}
        >
          {node.type === "file" ? <FileOutlined /> : <FolderOutlined />}
          <span className={`${PREFIX}-node-title-content-text`}>
            {editingKey === node.key ? (
              <Input
                ref={ref}
                size="small"
                defaultValue={node.title as string}
                onBlur={handleChange}
                onPressEnter={handleChange}
              />
            ) : (
              (node.title as React.ReactNode)
            )}
          </span>
        </div>
        <div className={`${PREFIX}-node-title-operation`}>
          <DeleteOutlined
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteNode(node);
            }}
          />
        </div>
      </div>
    );
  };

  const ref = useClickOutside<InputRef>(handleChange);

  useImperativeHandle(forwardRef, () => ({
    handleAddNode,
    handleDeleteNode,
    onSelect,
  }));

  return (
    <div>
      <Button
        onClick={() => handleAddNode("file")}
        className="button-node1"
        icon={<FileOutlined />}
      ></Button>
      <Button
        onClick={() => handleAddNode("folder")}
        className="butto-node2"
        icon={<FolderOutlined />}
      ></Button>
      <Tree
        className="draggable-tree"
        draggable={{
          icon: false,
        }}
        blockNode
        titleRender={titleRender}
        onDrop={onDrop}
        treeData={gData}
        {...restProps}
      />
    </div>
  );
});

export default CreateFile;
