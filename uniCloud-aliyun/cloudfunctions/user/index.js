"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  switch (event.action) {
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
          .match(_.expr($.eq(["$user_id", "$$user_id"])))
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
          .match(_.expr($.eq(["$following_id", "$$user_id"])))
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
          .match(_.expr($.eq(["$follower_id", "$$user_id"])))
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
