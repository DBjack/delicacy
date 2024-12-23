"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const _ = db.command;

exports.main = async (event, context) => {
  const { action, params = {} } = event;

  try {
    let result;
    switch (action) {
      case "getPosts":
        result = await getPosts(params);
        break;
      case "getPostsByTag":
        result = await getPostsByTag(params);
        break;
      case "searchPosts":
        result = await searchPosts(params);
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
    console.error(error);
    return {
      code: 500,
      msg: error.message || "服务器错误",
      data: null,
    };
  }
};

// 获取帖子列表
async function getPosts({ category = "all", page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    let query = collection
      .aggregate()
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        cover: "$images[0]", // 使用第一张图片作为封面
        images: 1,
        tags: 1,
        category: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      });

    // 根据分类筛选
    if (category !== "all") {
      if (category === "hot") {
        query = query.sort({
          likeCount: -1,
          commentCount: -1,
        });
      } else if (category === "new") {
        query = query.sort({
          create_date: -1,
        });
      } else {
        query = query.match({
          category,
        });
      }
    } else {
      query = query.sort({
        create_date: -1,
      });
    }

    const list = await query.skip(skipAmount).limit(pageSize).end();

    return list.data || [];
  } catch (error) {
    console.error("获取帖子列表失败:", error);
    throw new Error("获取帖子列表失败");
  }
}

// 根据标签获取帖子
async function getPostsByTag({ tag, page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    const list = await collection
      .aggregate()
      .match({
        tags: tag,
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        cover: "$images[0]",
        images: 1,
        tags: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .sort({
        create_date: -1,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .end();

    return list.data || [];
  } catch (error) {
    console.error("获取标签帖子失败:", error);
    throw new Error("获取标签帖子失败");
  }
}

// 搜索帖子
async function searchPosts({ keyword, page = 1, pageSize = 10 }) {
  const collection = db.collection("posts");
  const skipAmount = (page - 1) * pageSize;

  try {
    const list = await collection
      .aggregate()
      .match({
        $or: [
          {
            title: new RegExp(keyword, "i"),
          },
          {
            description: new RegExp(keyword, "i"),
          },
          {
            tags: keyword,
          },
        ],
      })
      .lookup({
        from: "uni-id-users",
        localField: "user_id",
        foreignField: "_id",
        as: "author",
      })
      .unwind({
        path: "$author",
        preserveNullAndEmptyArrays: true,
      })
      .project({
        _id: 1,
        title: 1,
        description: 1,
        cover: "$images[0]",
        images: 1,
        tags: 1,
        likeCount: 1,
        commentCount: 1,
        collectCount: 1,
        create_date: 1,
        "author._id": 1,
        "author.nickname": 1,
        "author.avatar": 1,
      })
      .sort({
        create_date: -1,
      })
      .skip(skipAmount)
      .limit(pageSize)
      .end();

    return list.data || [];
  } catch (error) {
    console.error("搜索帖子失败:", error);
    throw new Error("搜索帖子失败");
  }
}
