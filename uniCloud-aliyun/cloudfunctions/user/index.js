"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data = {} } = event;

  switch (action) {
    case "getExperts":
      return await getExperts(data);
    case "follow":
      return await follow(data);
    case "unfollow":
      return await unfollow(data);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

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
