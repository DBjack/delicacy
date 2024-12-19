"use strict";
const db = uniCloud.database();

exports.main = async (event, context) => {
  switch (event.action) {
    case "getHotTags":
      return await getHotTags();
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 获取热门标签
async function getHotTags() {
  try {
    // 这里先返回一些固定的标签，后续可以根据实际使用频率来统计
    const hotTags = [
      { id: 1, name: "家常菜", count: 128 },
      { id: 2, name: "甜点", count: 96 },
      { id: 3, name: "烘焙", count: 85 },
      { id: 4, name: "川菜", count: 76 },
      { id: 5, name: "粤菜", count: 68 },
      { id: 6, name: "早餐", count: 65 },
      { id: 7, name: "午餐", count: 62 },
      { id: 8, name: "晚餐", count: 58 },
      { id: 9, name: "小吃", count: 52 },
      { id: 10, name: "素食", count: 45 },
    ];

    return {
      code: 0,
      msg: "获取成功",
      data: hotTags,
    };
  } catch (error) {
    console.error("获取热门标签失败:", error);
    return {
      code: -1,
      msg: "���取热门标签失败",
      error: error.message,
    };
  }
}
