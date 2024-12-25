"use strict";

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  console.log("云函数入口:", event);

  const { action, params = {} } = event;

  try {
    let result;
    switch (action) {
      case "login":
        result = await login(params);
        break;
      case "updateProfile":
        result = await updateProfile(params);
        break;
      case "uploadAvatar":
        result = await uploadAvatar(params);
        break;
      default:
        return {
          code: 404,
          msg: "未找到对应的操作",
          data: null,
        };
    }

    return {
      code: 0,
      msg: "success",
      data: result,
    };
  } catch (error) {
    console.error("云函数执行错误:", error);
    return {
      code: 500,
      msg: error.message || "服务器错误",
      data: null,
    };
  }
};

// 用户登录
async function login({ code, userInfo }) {
  if (!code) {
    throw new Error("登录code不能为空");
  }

  try {
    // 获取微信用户openid
    const res = await uniCloud.httpclient.request(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx58337efb4c35fab6&secret=55535e53b3e9d384301a806a81697d8b&js_code=${code}&grant_type=authorization_code`,
      {
        dataType: "json",
      }
    );

    if (!res.data.openid) {
      throw new Error("获取openid失败");
    }

    const { openid, session_key } = res.data;

    // 查找或创建用户
    const collection = db.collection("uni-id-users");
    let userRecord = await collection
      .where({
        openid: openid,
      })
      .get();

    let userId;
    const now = new Date();

    if (userRecord.data.length === 0) {
      // 创建新用户
      const result = await collection.add({
        openid: openid,
        nickname: userInfo.nickName || "微信用户",
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        create_date: now,
        last_login_date: now,
      });
      userId = result.id;
    } else {
      // 更新用户信息
      userId = userRecord.data[0]._id;
      await collection.doc(userId).update({
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        last_login_date: now,
      });
    }

    // 获取最新的用户信息
    const updatedUser = await collection.doc(userId).get();

    return {
      ...updatedUser.data[0],
      openid: openid,
      session_key: session_key,
    };
  } catch (error) {
    console.error("登录失败:", error);
    throw new Error("登录失败: " + error.message);
  }
}

// 更新用户资料
async function updateProfile({ userId, profile }) {
  if (!userId) {
    throw new Error("用户ID不能为空");
  }

  try {
    const collection = db.collection("uni-id-users");
    await collection.doc(userId).update({
      nickname: profile.nickname,
      avatar: profile.avatar,
      gender: profile.gender,
      birthday: profile.birthday,
      signature: profile.signature,
    });

    return { success: true };
  } catch (error) {
    console.error("更新用户资料失败:", error);
    throw new Error("更新用户资料失败");
  }
}

// 上传头像
async function uploadAvatar({ userId, avatar }) {
  if (!userId || !avatar) {
    throw new Error("参数不完整");
  }

  try {
    // 更新用户头像
    const collection = db.collection("uni-id-users");
    await collection.doc(userId).update({
      avatar: avatar,
    });

    return {
      avatar: avatar,
    };
  } catch (error) {
    console.error("上传头像失败:", error);
    throw new Error("上传头像失败");
  }
}
