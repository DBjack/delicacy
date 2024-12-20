"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const _ = db.command;

exports.main = async (event, context) => {
  switch (event.action) {
    case "login":
      return await login(event.params);
    case "getUserInfo":
      return await getUserInfo(event.params);
    case "updateUserInfo":
      return await updateUserInfo(event.params);
    case "checkFollowStatus":
      return await checkFollowStatus(event.params);
    case "follow":
      return await follow(event.params);
    case "unfollow":
      return await unfollow(event.params);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 用户登录
async function login(params) {
  try {
    const { code, userInfo } = params;
    if (!code || !userInfo) {
      throw new Error("参数不完整");
    }

    // 获取微信用户openid
    const res = await uniCloud.httpclient.request(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wx58337efb4c35fab6&secret=55535e53b3e9d384301a806a81697d8b&js_code=${code}&grant_type=authorization_code`,
      {
        dataType: "json",
      }
    );

    if (!res.data.openid) {
      throw new Error("获取用户openid失败");
    }

    // 查找或创建用户
    let userRecord = await db
      .collection("users")
      .where({
        openid: res.data.openid,
      })
      .get();

    let userId;

    if (userRecord.data.length === 0) {
      // 创建新用户
      const { id } = await db.collection("users").add({
        openid: res.data.openid,
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city,
        create_date: new Date(),
        update_date: new Date(),
      });
      userId = id;
    } else {
      // 更新用户信息
      userId = userRecord.data[0]._id;
      await db.collection("users").doc(userId).update({
        nickname: userInfo.nickName,
        avatar: userInfo.avatarUrl,
        gender: userInfo.gender,
        country: userInfo.country,
        province: userInfo.province,
        city: userInfo.city,
        update_date: new Date(),
      });
    }

    // 获取最新的用户信息
    const newUserInfo = await db.collection("users").doc(userId).get();

    return {
      code: 0,
      msg: "登录成功",
      data: newUserInfo.data[0],
    };
  } catch (error) {
    console.error("登录失败:", error);
    return {
      code: -1,
      msg: error.message || "登录失败",
    };
  }
}

// 获取用户信息
async function getUserInfo(params) {
  try {
    const { userId } = params;
    if (!userId) {
      throw new Error("用户ID不能为空");
    }

    const userInfo = await db
      .collection("users")
      .aggregate()
      .match({
        _id: userId,
      })
      .lookup({
        from: "posts",
        let: {
          user_id: "$_id",
        },
        pipeline: $.pipeline()
          .match({
            $expr: {
              $eq: ["$user_id", "$$user_id"],
            },
          })
          .count("total")
          .done(),
        as: "posts_stats",
      })
      .lookup({
        from: "follows",
        let: {
          user_id: "$_id",
        },
        pipeline: $.pipeline()
          .match({
            $expr: {
              $eq: ["$following_id", "$$user_id"],
            },
          })
          .count("total")
          .done(),
        as: "followers_stats",
      })
      .lookup({
        from: "follows",
        let: {
          user_id: "$_id",
        },
        pipeline: $.pipeline()
          .match({
            $expr: {
              $eq: ["$follower_id", "$$user_id"],
            },
          })
          .count("total")
          .done(),
        as: "following_stats",
      })
      .project({
        _id: 1,
        nickname: 1,
        avatar: 1,
        bio: 1,
        tags: 1,
        worksCount: $.ifNull([$.arrayElemAt(["$posts_stats.total", 0]), 0]),
        followersCount: $.ifNull([
          $.arrayElemAt(["$followers_stats.total", 0]),
          0,
        ]),
        followingCount: $.ifNull([
          $.arrayElemAt(["$following_stats.total", 0]),
          0,
        ]),
      })
      .end();

    if (!userInfo.data || !userInfo.data[0]) {
      throw new Error("用户不存在");
    }

    return {
      code: 0,
      msg: "获取成功",
      data: userInfo.data[0],
    };
  } catch (error) {
    return {
      code: -1,
      msg: error.message,
    };
  }
}

// 更新用户信息
async function updateUserInfo(params) {
  try {
    const { userId, ...updateData } = params;
    if (!userId) {
      throw new Error("用户ID不能为空");
    }

    await db
      .collection("users")
      .doc(userId)
      .update({
        ...updateData,
        update_date: new Date(),
      });

    return {
      code: 0,
      msg: "更新成功",
    };
  } catch (error) {
    return {
      code: -1,
      msg: error.message,
    };
  }
}

// 检查关注状态
async function checkFollowStatus(params) {
  try {
    const { followerId, followingId } = params;
    if (!followerId || !followingId) {
      throw new Error("参数不完整");
    }

    const follow = await db
      .collection("follows")
      .where({
        follower_id: followerId,
        following_id: followingId,
      })
      .get();

    return {
      code: 0,
      msg: "获取成功",
      data: follow.data.length > 0,
    };
  } catch (error) {
    return {
      code: -1,
      msg: error.message,
    };
  }
}

// 关注用户
async function follow(params) {
  try {
    const { followerId, followingId } = params;
    if (!followerId || !followingId) {
      throw new Error("参数不完整");
    }

    if (followerId === followingId) {
      throw new Error("不能关注自己");
    }

    const follow = await db
      .collection("follows")
      .where({
        follower_id: followerId,
        following_id: followingId,
      })
      .get();

    if (follow.data.length > 0) {
      throw new Error("已经关注过了");
    }

    await db.collection("follows").add({
      follower_id: followerId,
      following_id: followingId,
      create_date: new Date(),
    });

    return {
      code: 0,
      msg: "关注成功",
    };
  } catch (error) {
    return {
      code: -1,
      msg: error.message,
    };
  }
}

// 取消关注
async function unfollow(params) {
  try {
    const { followerId, followingId } = params;
    if (!followerId || !followingId) {
      throw new Error("参数不完整");
    }

    await db
      .collection("follows")
      .where({
        follower_id: followerId,
        following_id: followingId,
      })
      .remove();

    return {
      code: 0,
      msg: "取消关注成功",
    };
  } catch (error) {
    return {
      code: -1,
      msg: error.message,
    };
  }
}
