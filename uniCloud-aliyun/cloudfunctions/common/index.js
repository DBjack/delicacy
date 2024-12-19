"use strict";

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;

  switch (action) {
    case "getOpenId":
      return await getOpenId(data);
    case "uploadFile":
      return await uploadFile(data);
    default:
      return {
        code: 404,
        msg: "未找到对应的方法",
      };
  }
};

// 获取openid
async function getOpenId(data) {
  const { code } = data;

  try {
    const res = await uniCloud.getPhoneNumber({
      code,
      provider: "weixin",
    });

    return {
      code: 0,
      msg: "获取成功",
      data: res,
    };
  } catch (e) {
    return {
      code: -1,
      msg: "获取失败",
      error: e,
    };
  }
}

// 上传文件
async function uploadFile(data) {
  const { cloudPath, fileContent } = data;

  try {
    const result = await uniCloud.uploadFile({
      cloudPath,
      fileContent,
    });

    return {
      code: 0,
      msg: "上传成功",
      data: {
        fileID: result.fileID,
        fileUrl: result.fileID,
      },
    };
  } catch (e) {
    return {
      code: -1,
      msg: "上传失败",
      error: e,
    };
  }
}
