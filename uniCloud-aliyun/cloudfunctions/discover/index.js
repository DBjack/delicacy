"use strict";
exports.main = async (event, context) => {
  const { action, params = {} } = event;
  const db = uniCloud.database();

  switch (action) {
    case "getHotPosts":
      try {
        const { page = 1, pageSize = 10 } = params;
        const skip = (page - 1) * pageSize;

        const res = await db
          .collection("posts")
          .aggregate()
          .match({
            status: 1, // 只获取已发布的帖子
          })
          .lookup({
            from: "uni-id-users",
            localField: "author_id",
            foreignField: "_id",
            as: "author",
          })
          .unwind("$author")
          .project({
            _id: 1,
            title: 1,
            description: 1,
            cover: "$images.0", // 使用第一张图片作为封面
            images: 1,
            likeCount: 1,
            commentCount: 1,
            viewCount: 1,
            createTime: 1,
            "author._id": 1,
            "author.nickname": 1,
            "author.avatar": 1,
          })
          .sort({
            likeCount: -1,
            commentCount: -1,
            createTime: -1,
          })
          .skip(skip)
          .limit(pageSize)
          .end();

        return {
          code: 0,
          msg: "success",
          data: res.data,
        };
      } catch (error) {
        console.error("获取热门帖子失败:", error);
        return {
          code: 1,
          msg: "获取热门帖子失败",
          error: error.message,
        };
      }

    case "getHotTags":
      try {
        const res = await db
          .collection("tags")
          .aggregate()
          .project({
            _id: 1,
            name: 1,
            image: 1,
            count: 1,
          })
          .sort({
            count: -1,
          })
          .limit(10)
          .end();

        return {
          code: 0,
          msg: "success",
          data: res.data,
        };
      } catch (error) {
        console.error("获取热门标签失败:", error);
        return {
          code: 1,
          msg: "获取热门标签失败",
          error: error.message,
        };
      }

    default:
      return {
        code: 404,
        msg: "未找到对应的方法",
      };
  }
};
