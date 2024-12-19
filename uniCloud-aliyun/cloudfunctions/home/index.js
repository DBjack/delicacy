"use strict";
const db = uniCloud.database();

exports.main = async (event, context) => {
  switch (event.action) {
    case "getRecommendPosts":
      return await getRecommendPosts(event.params);
    case "getFollowingPosts":
      return await getFollowingPosts(event.params);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 获取推荐帖子（最新发布）
async function getRecommendPosts(params) {
  try {
    const { page = 1, pageSize = 10 } = params;
    const $ = db.command.aggregate;

    const posts = await db
      .collection("posts")
      .aggregate()
      .match({
        status: 1,
      })
      .lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        likeCount: 1,
        collectCount: 1,
        create_date: 1,
        author: $.arrayElemAt(["$author", 0]),
      })
      .sort({
        create_date: -1, // 按创建时间倒序
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end();

    return {
      code: 0,
      msg: "获取成功",
      data: posts.data.map((post) => ({
        ...post,
        author: {
          _id: post.author?._id || "",
          nickname: post.author?.nickname || "美食家",
          avatar: post.author?.avatar || "",
        },
      })),
    };
  } catch (error) {
    console.error("获取推荐帖子失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message,
    };
  }
}

// 获取关注用户的帖子
async function getFollowingPosts(params) {
  try {
    const { userId, page = 1, pageSize = 10 } = params;
    const $ = db.command.aggregate;

    // 获取用户关注列表
    const userInfo = await db.collection("users").doc(userId).get();
    const followingIds = userInfo.data[0].following || [];

    const posts = await db
      .collection("posts")
      .aggregate()
      .match({
        status: 1,
        user_id: db.command.in(followingIds),
      })
      .lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        images: 1,
        likeCount: 1,
        collectCount: 1,
        create_date: 1,
        author: $.arrayElemAt(["$author", 0]),
      })
      .sort({
        create_date: -1,
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end();

    return {
      code: 0,
      msg: "获取成功",
      data: posts.data.map((post) => ({
        ...post,
        author: {
          _id: post.author?._id || "",
          nickname: post.author?.nickname || "美食家",
          avatar: post.author?.avatar || "",
        },
      })),
    };
  } catch (error) {
    console.error("获取关注帖子失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message,
    };
  }
}
