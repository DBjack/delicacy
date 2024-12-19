"use strict";

const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log("post function params:", event);

  switch (event.action) {
    case "create":
      return await createPost(event.params);
    case "update":
      return await updatePost(event.params);
    case "getDrafts":
      return await getDrafts(event.params);
    case "delete":
      return await deletePost(event.params);
    case "getPostsByTag":
      return await getPostsByTag(event.params);
    case "getPostDetail":
      return await getPostDetail(event.params);
    case "search":
      return await searchPosts(event.params);
    default:
      return {
        code: 404,
        msg: "未找到对应的操作",
      };
  }
};

// 创建帖子
async function createPost(params) {
  try {
    const { user_id, title, description, images = [] } = params;

    if (!user_id) {
      throw new Error("未获取到用户信息");
    }

    // 创建帖子
    const post = {
      user_id,
      title,
      description,
      images,
      status: params.status || 1, // 默认为发布状态
      likeCount: 0,
      commentCount: 0,
      collectCount: 0,
      create_date: new Date(),
      update_date: new Date(),
    };

    const res = await db.collection("posts").add(post);
    console.log("创建帖子结果:", res);
    post._id = res.id;

    return {
      code: 0,
      msg: "发布成功",
      data: post,
    };
  } catch (error) {
    console.error("发布失败:", error);
    return {
      code: -1,
      msg: "发布失败",
      error: error.message || "未知错误",
    };
  }
}

// 更新帖子
async function updatePost(params) {
  try {
    const { id, ...updateData } = params;

    if (!id) {
      throw new Error("帖子ID不能为空");
    }

    // 更新帖子
    await db
      .collection("posts")
      .doc(id)
      .update({
        ...updateData,
        update_date: new Date(),
      });

    // 获取更新后的帖子
    const post = await db.collection("posts").doc(id).get();

    return {
      code: 0,
      msg: "更新成功",
      data: post.data[0],
    };
  } catch (error) {
    console.error("更新失败:", error);
    return {
      code: -1,
      msg: "更新失败",
      error: error.message || "未知错误",
    };
  }
}

// 获取草稿列表
async function getDrafts(params) {
  try {
    const { user_id } = params;

    if (!user_id) {
      throw new Error("用户ID不能为空");
    }

    // 查询草稿列表
    const drafts = await db
      .collection("posts")
      .where({
        user_id,
        status: 0,
      })
      .orderBy("update_date", "desc")
      .get();

    return {
      code: 0,
      msg: "获取成功",
      data: drafts.data,
    };
  } catch (error) {
    console.error("获取草稿列表失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message || "未知错误",
    };
  }
}

// 删除帖子
async function deletePost(params) {
  try {
    const { id } = params;

    if (!id) {
      throw new Error("帖子ID不能为空");
    }

    await db.collection("posts").doc(id).remove();

    return {
      code: 0,
      msg: "删除成功",
    };
  } catch (error) {
    console.error("删除失败:", error);
    return {
      code: -1,
      msg: "删除失败",
      error: error.message || "未知错误",
    };
  }
}

// 根据标签获取帖子
async function getPostsByTag(params) {
  try {
    const { tag, page = 1, pageSize = 10 } = params;
    const $ = db.command.aggregate;

    const posts = await db
      .collection("posts")
      .aggregate()
      .match({
        status: 1,
        tags: tag,
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
    console.error("获取帖子失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message,
    };
  }
}

// 获取帖子详情
async function getPostDetail(params) {
  try {
    const { id } = params;
    if (!id) {
      throw new Error("帖子ID不能为空");
    }

    const $ = db.command.aggregate;
    const post = await db
      .collection("posts")
      .aggregate()
      .match({
        _id: id,
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
        content: 1,
        images: 1,
        tags: 1,
        likeCount: 1,
        collectCount: 1,
        commentCount: 1,
        create_date: 1,
        author: $.arrayElemAt(["$author", 0]),
      })
      .end();

    if (!post.data || post.data.length === 0) {
      throw new Error("帖子不存在");
    }

    return {
      code: 0,
      msg: "获取成功",
      data: {
        ...post.data[0],
        author: {
          _id: (post.data[0].author && post.data[0].author._id) || "",
          nickname:
            (post.data[0].author && post.data[0].author.nickname) || "美食家",
          avatar: (post.data[0].author && post.data[0].author.avatar) || "",
        },
      },
    };
  } catch (error) {
    console.error("获取帖子详情失败:", error);
    return {
      code: -1,
      msg: "获取失败",
      error: error.message,
    };
  }
}

// 搜索帖子
async function searchPosts(params) {
  try {
    const { keyword } = params;
    if (!keyword) {
      throw new Error("搜索关键词不能为空");
    }

    // 使用正则表达式进行模糊搜索
    const searchRegex = new RegExp(keyword, "i");

    // 搜索帖子
    const posts = await db
      .collection("posts")
      .aggregate()
      .match({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex },
        ],
      })
      .lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      })
      .project({
        _id: 1,
        title: 1,
        content: 1,
        images: 1,
        tags: 1,
        location: 1,
        create_date: 1,
        user: { $arrayElemAt: ["$user", 0] },
      })
      .sort({
        create_date: -1,
      })
      .limit(20)
      .end();

    return {
      code: 0,
      msg: "搜索成功",
      data: posts.data,
    };
  } catch (error) {
    console.error("搜索失败:", error);
    return {
      code: -1,
      msg: "搜索失败",
      error: error.message,
    };
  }
}
