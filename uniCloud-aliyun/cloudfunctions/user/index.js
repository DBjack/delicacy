"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data = {}, params = {} } = event;

  switch (action) {
    case "login":
      return await login(params);
    case "getExperts":
      return await getExperts(data);
    case "follow":
      return await follow(data);
    case "unfollow":
      return await unfollow(data);
    case "uploadAvatar":
      return await uploadAvatar(params);
    case "updateProfile":
      return await updateProfile(params);
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
      return {
        code: 400,
        msg: '参数不完整'
      };
    }
    
    // 获取微信用户openid
    const { result: wxResult } = await uniCloud.callFunction({
      name: 'common',
      data: {
        action: 'code2Session',
        params: {
          code
        }
      }
    });
    
    if (wxResult.code !== 0 || !wxResult.data.openid) {
      throw new Error('获取openid失败');
    }
    
    const openid = wxResult.data.openid;
    
    // 查找或创建用户
    const userCollection = db.collection('users');
    let user = await userCollection.where({
      openid
    }).get();
    
    let userId;
    
    if (user.data && user.data.length > 0) {
      // 更新用户信息
      userId = user.data[0]._id;
      await userCollection.doc(userId).update({
        nickname: userInfo.nickName || userInfo.nickname,
        avatar: userInfo.avatarUrl || userInfo.avatar,
        updateTime: new Date()
      });
    } else {
      // 创建新用户
      const result = await userCollection.add({
        openid,
        nickname: userInfo.nickName || userInfo.nickname,
        avatar: userInfo.avatarUrl || userInfo.avatar,
        bio: '',
        isExpert: false,
        verified: false,
        recommendScore: 0,
        followerCount: 0,
        followingCount: 0,
        likeCount: 0,
        status: 1,
        createTime: new Date(),
        updateTime: new Date()
      });
      userId = result.id;
    }
    
    // 获取最新的用户信息
    const userData = await userCollection.doc(userId).get();
    
    // 生成token（这里简单使用userId作为token，实际应该使用更安全的方式）
    const token = userId;
    
    return {
      code: 0,
      msg: 'success',
      data: {
        ...userData.data[0],
        token
      }
    };
  } catch (e) {
    return {
      code: 500,
      msg: e.message
    };
  }
}

// 获取达人列表
async function getExperts(data) {
  try {
    const { type = "recommend", userId } = data;
    let match = {
      status: 1,
      isExpert: true,
    };

    let sort = {};
    switch (type) {
      case "hot":
        sort = {
          followerCount: -1,
          postCount: -1,
        };
        break;
      case "new":
        sort = {
          createTime: -1,
        };
        break;
      default:
        sort = {
          recommendScore: -1,
          followerCount: -1,
        };
    }

    const result = await db.collection("users")
      .aggregate()
      .match(match)
      .lookup({
        from: "posts",
        localField: "_id",
        foreignField: "userId",
        as: "posts",
      })
      .lookup({
        from: "follows",
        let: {
          expertId: "$_id",
        },
        pipeline: $.pipeline()
          .match(dbCmd.expr($.and([
            $.eq(["$followingId", "$$expertId"]),
            $.eq(["$userId", userId]),
          ])))
          .done(),
        as: "follows",
      })
      .project({
        _id: 1,
        nickname: 1,
        avatar: 1,
        bio: 1,
        verified: 1,
        postCount: $.size("$posts"),
        followerCount: 1,
        likeCount: 1,
        isFollowing: $.gt([$.size("$follows"), 0]),
      })
      .sort(sort)
      .limit(20)
      .end();

    return {
      code: 0,
      msg: "success",
      data: result.data,
    };
  } catch (e) {
    return {
      code: 500,
      msg: e.message,
    };
  }
}

// 关注用户
async function follow(data) {
  const { userId, followingId } = data;

  if (!userId || !followingId) {
    return {
      code: 400,
      msg: "参数错误",
    };
  }

  const transaction = await db.startTransaction();
  try {
    // 添加关注记录
    await transaction.collection("follows").add({
      userId,
      followingId,
      createTime: new Date(),
    });

    // 更新被关注者的粉丝数
    await transaction.collection("users")
      .doc(followingId)
      .update({
        followerCount: dbCmd.inc(1),
      });

    // 更新关注者的关注数
    await transaction.collection("users")
      .doc(userId)
      .update({
        followingCount: dbCmd.inc(1),
      });

    await transaction.commit();

    return {
      code: 0,
      msg: "success",
    };
  } catch (e) {
    await transaction.rollback();
    return {
      code: 500,
      msg: e.message,
    };
  }
}

// 取消关注
async function unfollow(data) {
  const { userId, followingId } = data;

  if (!userId || !followingId) {
    return {
      code: 400,
      msg: "参数错误",
    };
  }

  const transaction = await db.startTransaction();
  try {
    // 删除关注记录
    await transaction.collection("follows")
      .where({
        userId,
        followingId,
      })
      .remove();

    // 更新被关注者的粉丝数
    await transaction.collection("users")
      .doc(followingId)
      .update({
        followerCount: dbCmd.inc(-1),
      });

    // 更新关注者的关注数
    await transaction.collection("users")
      .doc(userId)
      .update({
        followingCount: dbCmd.inc(-1),
      });

    await transaction.commit();

    return {
      code: 0,
      msg: "success",
    };
  } catch (e) {
    await transaction.rollback();
    return {
      code: 500,
      msg: e.message,
    };
  }
}

// 上传头像
async function uploadAvatar(params) {
  try {
    const { userId, avatar } = params;
    
    if (!userId || !avatar) {
      return {
        code: 400,
        msg: '参数不完整'
      };
    }
    
    const result = await db.collection('users')
      .doc(userId)
      .update({
        avatar,
        updateTime: new Date()
      });
      
    return {
      code: 0,
      msg: 'success',
      data: {
        avatar
      }
    };
  } catch (e) {
    return {
      code: 500,
      msg: e.message
    };
  }
}

// 更新用户资料
async function updateProfile(params) {
  try {
    const { userId, profile } = params;
    
    if (!userId || !profile) {
      return {
        code: 400,
        msg: '参数不完整'
      };
    }
    
    // 添加更新时间
    profile.updateTime = new Date();
    
    await db.collection('users')
      .doc(userId)
      .update(profile);
      
    // 获取最新的用户信息
    const userData = await db.collection('users')
      .doc(userId)
      .get();
      
    return {
      code: 0,
      msg: 'success',
      data: userData.data[0]
    };
  } catch (e) {
    return {
      code: 500,
      msg: e.message
    };
  }
}
