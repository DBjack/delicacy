"use strict";
const db = uniCloud.database();

exports.main = async (event, context) => {
  switch (event.action) {
    case "getHotPosts":
      return await getHotPosts(event.params);
    case "getHotTags":
      return await getHotTags(event.params);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 获取热门帖子
async function getHotPosts(params) {
  try {
    const { page = 1, pageSize = 10 } = params;

    // 查询已发布的帖子，按点赞数和收藏数排序
    const $ = db.command.aggregate;
    const posts = await db
      .collection("posts")
      .aggregate()
      .match({
        status: 1, // 已发布状态
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
        likeCount: -1,
        collectCount: -1,
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
    console.error("获取热门帖子失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message,
    };
  }
}

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
      msg: "获取失败",
      error: error.message,
    };
  }
}
